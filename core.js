'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {formatPhone}=require('./receipt');
function dayKey(date, timezone = 'America/Sao_Paulo') {
  return new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
function parseOrder(body) {
  if (typeof body !== 'string' || body.length > 30000) return null;
  const match = body.match(/^(?:Pedido Casa do Açaí BG: |\*Pedido |\*Casa do Açaí BG\*\r?\nPedido: )(BG-[A-Z0-9-]{8,80})\*?\r?\n/);
  if (!match || !/^\*?(?:Total|TOTAL|TOTAL DOS PRODUTOS): R\$ [\d.,]+\*?$/m.test(body) || !/^(?:Nome|Cliente): .+/m.test(body) || !/^Forma de pagamento: .+/m.test(body) || !body.includes('*LOCAL DE ENTREGA*') || !(/^(?:• \d+x |\*\d+x .+ — R\$ [\d.,]+\*)/m.test(body))) return null;
  return {id:match[1], body};
}
function greetingByTime(greeting,date,timezone='America/Sao_Paulo') {
  const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hourCycle:'h23'}).format(date));
  const salutation=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
  const body=String(greeting||'').replace(/^\s*(?:bom\s+dia|boa\s+tarde|boa\s+noite)\s*[,!:;.—–-]?\s*/i,'');
  return salutation+', '+body;
}
function personalizedGreeting(greeting, phone) {
  if (!/^\d{10,15}$/.test(String(phone || ''))) return greeting;
  return greeting.replace(/https:\/\/almeidamoraisj\.github\.io\/casa-do-acai\/(?:\?[^\s]*)?/, `https://almeidamoraisj.github.io/casa-do-acai/?contato=${phone}`);
}
class Store {
  constructor(filename) {
    this.filename=filename;
    this.data=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):{greetings:{},orders:{}};
    if (!this.data.greetings || !this.data.orders) throw new Error('Arquivo de estado inválido; restaure o backup.');
  }
  save() {
    fs.mkdirSync(path.dirname(this.filename),{recursive:true});
    const tmp=this.filename+'.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data,null,2),{mode:0o600});
    fs.renameSync(tmp,this.filename);
  }
}
class Handler {
  constructor({store,config,send,print,now=()=>new Date(),log=console.log,resolvePhone=async m=>m.from.endsWith('@c.us')?m.from.split('@')[0]:null}) {Object.assign(this,{store,config,send,print,now,log,resolvePhone});}
  async handle(message) {
    if (message.fromMe || !message.from || !/@(c\.us|lid)$/.test(message.from) || message.type === 'notification') return;
    const order=parseOrder(message.body);
    // Pedido estruturado não é um comando, mesmo se houver "cardápio" na observação.
    const text=String(message.body||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(!order && /(?:^|[^a-z0-9_])cardapio(?:$|[^a-z0-9_])/i.test(text)) {
      try {await this.send(message,'Aqui está o link do cardápio: https://almeidamoraisj.github.io/casa-do-acai-bg/');}
      catch(error){this.log('Link do cardápio não confirmado: '+error.message);}
      return;
    }
    if(!order && /(?:^|[^a-z0-9_])(?:tempos?|demor[a-z]*)(?:$|[^a-z0-9_])/i.test(text)) {
      try {await this.send(message,'Nosso prazo de entrega é de até 50 minutos. Lembrando que pode ser entregue antes, pedimos paciência e agradecemos a preferência.');}
      catch(error){this.log('Resposta de prazo não confirmada: '+error.message);}
      return;
    }
    const today=dayKey(this.now(),this.config.timezone);
    // Reserva antes de enviar: uma reconexão não repete uma saudação de resultado incerto.
    const greetingKey=message.from+'|'+today;
    let phone = null;
    if(!order && this.config.greetingEnabled && !this.store.data.greetings[greetingKey]) {
      this.store.data.greetings[greetingKey]={status:'sending',at:this.now().toISOString()};this.store.save();
      try {phone = await this.resolvePhone(message);} catch (error) {this.log('Contato não identificado para o link do cardápio: '+error.message);}
      try {await this.send(message,personalizedGreeting(greetingByTime(this.config.greeting,this.now(),this.config.timezone),phone));this.store.data.greetings[greetingKey].status='sent';}
      catch(error) {this.store.data.greetings[greetingKey].status='failed';this.log('Saudação não confirmada: '+error.message);}
      this.store.save();
    }
    if(!order) return;
    const key=crypto.createHash('sha256').update(message.from+'|'+order.id).digest('hex');
    if(this.store.data.orders[key]) {this.log('Pedido já registrado: '+order.id);return;}
    try { if(!phone) phone = await this.resolvePhone(message); } catch (error) { this.log('Não foi possível obter o telefone: '+error.message); }
    const cleanBody=order.body.replace(/^Contato:.*\r?\n/gm,'');
    const body=phone ? cleanBody.replace(/^((?:Cliente|Nome): .+)$/m, `$1\nContato: ${formatPhone(phone)}`) : cleanBody;
    const record={...order,body,phone,sender:message.from,messageId:message.id?._serialized,status:'printing',receivedAt:this.now().toISOString()};
    this.store.data.orders[key]=record;this.store.save();
    // Reserva antes do envio: uma repetição do pedido não duplica a confirmação.
    record.confirmation={status:'sending',at:this.now().toISOString()};this.store.save();
    try {
      await this.send(message,'Obrigada! Seu pedido já foi recebido, e já está sendo preparado, agora é só aguardar.');
      record.confirmation.status='sent';
    } catch(error) {
      record.confirmation.status='failed';
      this.log('Confirmação de recebimento não enviada: '+error.message);
    }
    this.store.save();

    try {await this.print(record);record.status='submitted';this.log('Pedido enviado à fila da impressora: '+order.id);}
    catch(error) {record.status='failed';record.error=error.message;this.log('FALHA na impressão de '+order.id+': '+error.message+'. Use --retry '+order.id+' após conferir a fila.');}
    this.store.save();
  }
}
module.exports={greetingByTime,dayKey,parseOrder,personalizedGreeting,Store,Handler};

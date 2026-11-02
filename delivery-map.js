(function(root){
 'use strict';
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(?:rua|avenida|av|r)\b/g,'').replace(/[^a-z0-9]/g,'');
 async function show({city,address,selected,onSelect}){
  const router=await root.CASA_INTERNAL_ROUTING.load(),data=router.data;
  const panel=document.getElementById('deliveryPinPanel'),canvas=document.getElementById('deliveryPinCanvas'),ctx=canvas.getContext('2d');
  panel.hidden=false;
  let center=selected?[selected.latitude,selected.longitude]:city==='Pontal do Araguaia'?[-15.904,-52.257]:[-15.902,-52.244];
  const query=normalize(address.split(' - ')[0].split(',')[0].replace(/\s+\d+\s*$/,''));
  if(!selected&&query.length>3){
   const matched=data.segments.filter(s=>normalize(data.wayNames[s[4]])===query);
   // A busca só aproxima a visualização; o cliente confirma o ponto da entrega.
   if(matched.length){let best=null;for(const segment of matched){const a=data.nodes[segment[0]],b=data.nodes[segment[1]],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];const d=router.meters(center,mid);if(!best||d<best.d)best={d,mid};}center=best.mid;}
  }
  let scale=2.8,point=selected?[selected.latitude,selected.longitude]:null,drag=null;
  const W=720,H=440,latMeters=111195,lonMeters=latMeters*Math.cos(center[0]*Math.PI/180);
  function xy(p){return [W/2+(p[1]-center[1])*lonMeters/scale,H/2-(p[0]-center[0])*latMeters/scale];}
  function latlon(x,y){return [center[0]-(y-H/2)*scale/latMeters,center[1]+(x-W/2)*scale/lonMeters];}
  function dot(p,color,label){const [x,y]=xy(p);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,8,0,2*Math.PI);ctx.fill();ctx.font='bold 14px Arial';ctx.fillText(label,x+12,y-10);}
  function draw(){
   ctx.fillStyle='#f4f1e9';ctx.fillRect(0,0,W,H);ctx.lineWidth=2;ctx.strokeStyle='#a5a6aa';
   for(const [a,b]of data.segments){const [x,y]=xy(data.nodes[a]),[u,v]=xy(data.nodes[b]);if((x<0&&u<0)||(y<0&&v<0)||(x>W&&u>W)||(y>H&&v>H))continue;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.stroke();}
   const used=new Set();ctx.font='22px Arial';ctx.fillStyle='#34333b';
   for(const [a,b,,,way]of data.segments){const name=data.wayNames[way];if(!name||used.has(way))continue;const [x,y]=xy(data.nodes[a]),[u,v]=xy(data.nodes[b]);const mx=(x+u)/2,my=(y+v)/2;if(mx<25||mx>W-130||my<25||my>H-20||Math.hypot(x-u,y-v)<35)continue;const cell=Math.floor(mx/220)+','+Math.floor(my/65);if(used.has(cell))continue;ctx.fillText(name,mx,my-5);used.add(way);used.add(cell);}
   dot(data.reference,'#c2314f','Praça do Relógio');
   if(point)dot(point,'#702d98','Entrega');
   const [x,y]=[W/2,H/2];ctx.strokeStyle='#702d98';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke();
   ctx.fillStyle='#34333b';ctx.fillText('Mapa aproximado · © OpenStreetMap',12,H-14);
  }
  function position(event){const box=canvas.getBoundingClientRect();return [(event.clientX-box.left)*W/box.width,(event.clientY-box.top)*H/box.height];}
  canvas.onpointerdown=event=>{const p=position(event);drag={p,center:[...center],moved:false};canvas.setPointerCapture(event.pointerId);};
  canvas.onpointermove=event=>{if(!drag)return;const p=position(event),dx=p[0]-drag.p[0],dy=p[1]-drag.p[1];if(Math.hypot(dx,dy)>5)drag.moved=true;center=[drag.center[0]+dy*scale/latMeters,drag.center[1]-dx*scale/lonMeters];draw();};
  canvas.onpointerup=event=>{if(!drag)return;const p=position(event);if(!drag.moved)point=latlon(...p);drag=null;draw();};
  canvas.onpointercancel=()=>{drag=null;};
  canvas.onkeydown=event=>{const step=80*scale;if(event.key==='ArrowUp')center[0]+=step/latMeters;else if(event.key==='ArrowDown')center[0]-=step/latMeters;else if(event.key==='ArrowLeft')center[1]-=step/lonMeters;else if(event.key==='ArrowRight')center[1]+=step/lonMeters;else if(event.key==='Enter')point=[...center];else return;event.preventDefault();draw();};
  document.getElementById('deliveryPinZoomIn').onclick=()=>{scale=Math.max(.35,scale/1.5);draw();};
  document.getElementById('deliveryPinZoomOut').onclick=()=>{scale=Math.min(30,scale*1.5);draw();};
  document.getElementById('deliveryPinUse').onclick=()=>{const p=point||center;onSelect({latitude:p[0],longitude:p[1]});panel.hidden=true;};
  document.getElementById('deliveryPinCancel').onclick=()=>{panel.hidden=true;};
  draw();canvas.focus();
 }
 root.CASA_DELIVERY_MAP={show};
})(window);

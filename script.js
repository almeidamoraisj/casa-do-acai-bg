// ---- Configuração ----
const FREE_DELIVERY_NEIGHBORHOODS = ['BR-070','Cidade Jardim','Vila Maria','São José','Novo Horizonte','Palmares','Jardim dos Ipês','Nova Barra do Garças','Nova Barra','Abel Lira','Ouro Fino','Piracema','Serra Dourada','Cidade Universitária','Cristino Cortes','Coopema','Domingos Mariano','Sena Marques','São João'];
function normalizeNeighborhood(value) { return String(value || '').replace(/^bairro\s+/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
function matchNeighborhood(value) {
  const normalized = normalizeNeighborhood(value);
  const aliases = {jardimsenamarques:'Sena Marques'};
  return aliases[normalized] || FREE_DELIVERY_NEIGHBORHOODS.find(name=>normalizeNeighborhood(name)===normalized) || '';
}
const DELIVERY_CITIES = ['Barra do Garças','Pontal do Araguaia','Aragarças'];
function suggestCity(value) {
  document.getElementById('deliveryCity').value = DELIVERY_CITIES.find(city=>normalizeNeighborhood(city)===normalizeNeighborhood(value)) || '';
}
function deliveryFee() {
  const city=document.getElementById('deliveryCity').value;
  if (!city) return null;
  if (city==='Pontal do Araguaia') return 10;
  if (city==='Aragarças') return 13;
  if (city==='Barra do Garças') return !selectedNeighborhood() ? null : matchNeighborhood(selectedNeighborhood()) ? 0 : 6;
  return null;
}
function orderTotal() { return cartTotal() + (deliveryFee() ?? 0); }
function syncOtherAddress() {
  const parts=document.getElementById('custAddress').value.split(' - ').map(value=>value.trim());
  suggestCity(canonicalCity(parts.at(-1)));
  suggestNeighborhood(parts.length>=3 ? parts[1] : '');
}
function selectedNeighborhood() { const value=document.getElementById('deliveryNeighborhood').value; return value==='other' ? document.getElementById('otherNeighborhood').value.trim() : value; }
function suggestNeighborhood(value) {
  const select=document.getElementById('deliveryNeighborhood');
  const match=matchNeighborhood(value);
  select.value=match || (value ? 'other' : '');
  document.getElementById('otherNeighborhood').value=match ? '' : value;
  updateNeighborhood();
}
function updateNeighborhood() {
  const other=document.getElementById('deliveryNeighborhood').value==='other';
  document.getElementById('otherNeighborhoodLabel').hidden=!other;
  const neighborhood=selectedNeighborhood();
  const fee=deliveryFee();
  document.getElementById('deliveryCorrection').hidden = deliveryMode === 'current';
  document.getElementById('deliveryCorrection').open = fee === null && deliveryMode !== 'current';
  document.getElementById('deliveryFeeStatus').textContent=fee===null ? (deliveryMode === 'current' ? 'Aguardando identificação automática do bairro e da cidade.' : 'Selecione a cidade e o bairro da entrega.') : fee===0 ? 'Entrega grátis para este bairro.' : `Taxa de entrega: ${fmtBRL(fee)}`;
  renderCartBar();
  updateConfirmState();
}
function buildNeighborhoodOptions() { document.getElementById('deliveryNeighborhood').innerHTML='<option value="">Selecione o bairro</option>'+FREE_DELIVERY_NEIGHBORHOODS.map(name=>`<option value="${name}">${name}</option>`).join('')+'<option value="other">Outro bairro</option>'; }
// O link enviado pela automação identifica o próprio remetente, sem digitação.
const customerPhone = /(?:^|[?&])contato=(\d{10,15})(?:&|$)/.exec(window.location?.search || '')?.[1] || '';
function customerContactText(phone) {
  const match=phone.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : '+'+phone;
}
const WHATSAPP_PHONE = "5566992600308"; // (66) 99260-0308 — troque se precisar

// ---- Catálogo ----
const MARMITAS = [
  { name: "Marmita Premium", image: "assets/marmitas/premium.webp", desc: "Sonho de Valsa, Ouro Branco, Creme de Avelã e Creme de Ninho" },
  { name: "Marmita Verão", image: "assets/marmitas/verao.webp", desc: "Kiwi, morango e banana" },
  { name: "Marmita Duplo Sabor", image: "assets/marmitas/duplo-sabor.webp", desc: "Metade açaí, metade cupuaçu", free: "Grátis granola" },
  { name: "Marmita da Felicidade", image: "assets/marmitas/felicidade.webp", desc: "Creme de avelã, chocoball, disquete, ovomaltine e creme de ninho" },
  { name: "Marmita Tradição", image: "assets/marmitas/tradicao.webp", desc: "Granola, leite condensado, leite em pó, paçoca e banana" },
  { name: "Marmita da Casa", image: "assets/marmitas/casa.webp", desc: "Banana, morango, kiwi, creme de avelã e creme de ninho" },
  { name: "Marmita Cupuaçu", image: "assets/marmitas/cupuacu.webp", desc: "Cupuaçu puro e cremoso", free: "Grátis granola" },
];
const MARMITA_PRICE = 40;

const SIZES = [
  { label: "300ml", price: 20 },
  { label: "480ml", price: 25 },
  { label: "600ml", price: 27 },
];

const COPOS = [
  { name: "Copo Premium", image: "assets/copos/premium.webp", desc: "Sonho de Valsa, Ouro Branco, Creme de Avelã e Creme de Ninho" },
  { name: "Copo Duplo Sabor", image: "assets/copos/duplo-sabor.webp", desc: "Metade açaí, metade cupuaçu", free: "Grátis granola" },
  { name: "Copo Verão", image: "assets/copos/verao.webp", desc: "Kiwi, morango e banana" },
  { name: "Copo Tradição", image: "assets/copos/tradicao.webp", desc: "Granola, leite condensado, leite em pó, paçoca e banana" },
  { name: "Copo Felicidade", image: "assets/copos/felicidade.webp", desc: "Creme de avelã, chocoball, disquete, ovomaltine e creme de ninho" },
  { name: "Copo Cupuaçu", image: "assets/copos/cupuacu.webp", desc: "Cupuaçu puro e cremoso", free: "Grátis granola" },
];

const CASA = { name: "Copo da Casa", desc: "Banana, morango, kiwi, creme de avelã e creme de ninho", size: "600ml", price: 35 };

const ADICIONAIS = [
  { name: "Leite em pó", price: 3 },
  { name: "Leite condensado", price: 3 },
  { name: "Morango", price: 6 },
  { name: "Banana", price: 3 },
  { name: "Kiwi", price: 6 },
  { name: "Sonho de Valsa", price: 4 },
  { name: "Ouro Branco", price: 4 },
  { name: "Creme de Ninho", price: 5 },
  { name: "Paçoca", price: 2 },
  { name: "Chocoball", price: 3 },
  { name: "Disquete", price: 3 },
  { name: "Ovomaltine", price: 5 },
  { name: "Granola", price: 3 },
  { name: "Creme de Avelã", price: 6 },
];

// Cada produto/tamanho mantém um rascunho independente do carrinho.
const ITEMS = [];
const drafts = {};
const cart = [];
let nextCartId = 0;

function regItem(label, price, category) {
  const name = label.replace(/ \(\d+ml\)$/, '');
  const product = [...MARMITAS, ...COPOS, CASA].find(p => p.name === name);
  const ingredients = name.includes('Cupuaçu') ? ['Granola'] : name.includes('Duplo Sabor') ? ['Açaí', 'Cupuaçu', 'Granola'] : (product?.desc || '').replace(/ e /g, ', ').split(', ').filter(Boolean).map(text => text[0].toUpperCase()+text.slice(1));
  const group = category+'|'+name;
  const i = ITEMS.push({ label, price, category, ingredients, group }) - 1;
  drafts[i] = { qty: 1, extras: {}, removed: [] };
  return i;
}
function includedIngredientsHtml(i) {
  const item = ITEMS[i];
  return `<div class="included-ingredients">${item.ingredients.map((name,j) => `<button type="button" class="ingredient-chip" data-ingredient-group="${i}" data-ingredient="${j}" aria-pressed="false" aria-label="Retirar ${name}" onclick="toggleIngredient(${i},${j})"><span>${name}</span><span class="ingredient-icon" aria-hidden="true">×</span></button>`).join('')}</div><p class="ingredients-hint">Toque no × para retirar um ingrediente. Toque novamente para recolocar.</p>`;
}
function refreshIngredients(i) {
  const item = ITEMS[i];
  (document.querySelectorAll?.(`[data-ingredient-group="${i}"]`) || []).forEach(button => {
    const j = Number(button.dataset.ingredient), removed = drafts[i].removed.includes(j);
    button.classList.toggle('is-removed', removed);
    button.setAttribute('aria-pressed', String(removed));
    button.setAttribute('aria-label', `${removed ? 'Recolocar' : 'Retirar'} ${item.ingredients[j]}`);
    button.querySelector('.ingredient-icon').textContent = removed ? '+' : '×';
  });
}
function toggleIngredient(i,j) {
  const removed = drafts[i].removed.includes(j);
  ITEMS.forEach((item,k) => {
    if (item.group !== ITEMS[i].group) return;
    drafts[k].removed = removed ? drafts[k].removed.filter(n => n !== j) : [...new Set([...drafts[k].removed,j])].sort((a,b)=>a-b);
    refreshIngredients(k);
  });
}
function fmtBRL(n) {
  return "R$ " + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function draftPrice(i) {
  return ITEMS[i].price + Object.entries(drafts[i].extras)
    .reduce((sum, [a, qty]) => sum + ADICIONAIS[a].price * qty, 0);
}
function productHtml(i, size) {
  const item = ITEMS[i];
  return `<details class="product-option" id="product-${i}" ontoggle="scrollProductOptions(this)">
    <summary aria-label="Personalizar ${item.label}">
      <span class="item-row-info"><span class="item-row-size">${size}</span>
      <span class="item-row-price">${fmtBRL(item.price)}</span></span>
      <span class="customize-label">Escolher <span class="option-chevron" aria-hidden="true">⌄</span></span>
    </summary>
    <div class="product-customizer">
      <h4>Adicionais pagos</h4>
      <p class="extras-hint">Opcionais · até 1 de cada por produto</p>
      <div class="product-extras">${ADICIONAIS.map((a, j) => `
        <div class="add-row">
          <div class="add-row-info"><span class="add-row-name">${a.name}</span>
          <span class="add-row-price">+ ${fmtBRL(a.price)}</span></div>
          <div class="stepper">
            <button type="button" id="extra-minus-${i}-${j}" disabled aria-label="Remover ${a.name} de ${item.label}" onclick="changeExtra(${i}, ${j}, -1)">−</button>
            <span class="qty-count" id="extra-qty-${i}-${j}">0</span>
            <button type="button" id="extra-plus-${i}-${j}" aria-label="Acrescentar ${a.name} a ${item.label}" onclick="changeExtra(${i}, ${j}, 1)">+</button>
          </div>
        </div>`).join('')}</div>
      <div class="product-price-breakdown" id="breakdown-${i}" aria-live="polite"></div>
      <div class="product-actions">
        <div class="stepper">
          <button type="button" id="draft-minus-${i}" disabled aria-label="Diminuir quantidade de ${item.label}" onclick="changeDraftQty(${i}, -1)">−</button>
          <span class="qty-count" id="draft-qty-${i}">1</span>
          <button type="button" aria-label="Aumentar quantidade de ${item.label}" onclick="changeDraftQty(${i}, 1)">+</button>
        </div>
        <button type="button" class="product-add" onclick="addProduct(${i})">Adicionar <span id="draft-total-${i}" aria-live="polite">${fmtBRL(item.price)}</span></button>
      </div>
      <p class="product-feedback" id="feedback-${i}" role="status"></p>
    </div>
  </details>`;
}
function scrollProductOptions(option) {
  if (!option.open) return;
  requestAnimationFrame(() => {
    if (!option.open) return;
    const summary = option.querySelector('summary');
    const nav = document.querySelector('nav');
    const visibleTop = nav ? nav.getBoundingClientRect().bottom : 0;
    // Pequeno avanço, mantendo a opção escolhida visível abaixo do menu fixo.
    const distance = Math.min(96, Math.max(0, summary.getBoundingClientRect().top - visibleTop - 12));
    if (distance > 0) window.scrollBy({top:distance, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
}

function buildMarmitas() {
  document.getElementById('marmitasGrid').innerHTML = MARMITAS.map(m => {
    const i = regItem(`${m.name} (750ml)`, MARMITA_PRICE, 'Marmitas');
    return `<div class="item-card">${m.image ? `<div class="marmita-visual"><img src="${m.image}" alt="${m.name}" width="1343" height="1171" loading="lazy" decoding="async"></div>` : ''}<h3>${m.name}</h3>${includedIngredientsHtml(i)}
      <div class="item-rows">${productHtml(i, '750ml')}</div></div>`;
  }).join('');
}
function buildCopos() {
  document.getElementById('coposGrid').innerHTML = COPOS.map(c => {
    let firstItem;
    const rows = SIZES.map(size => {
      const i = regItem(`${c.name} (${size.label})`, size.price, 'Copos');
      firstItem ??= i;
      return productHtml(i, size.label);
    }).join('');
    return `<div class="item-card">${c.image ? `<div class="copo-visual"><img src="${c.image}" alt="${c.name}" width="640" height="640" loading="lazy" decoding="async"></div>` : ''}<h3>${c.name}</h3>${includedIngredientsHtml(firstItem)}
      <div class="item-rows">${rows}</div></div>`;
  }).join('');
}
function buildCasa() {
  const i = regItem(`${CASA.name} (${CASA.size})`, CASA.price, 'Copo da Casa');
  document.getElementById('casaFeature').innerHTML = `<div class="casa-feature-info">
    <h3>${CASA.name}</h3>${includedIngredientsHtml(i)}</div>
    <div class="casa-customizer">${productHtml(i, CASA.size)}</div>`;
}
function updateDraft(i) {
  const draft = drafts[i];
  document.getElementById(`draft-qty-${i}`).textContent = draft.qty;
  document.getElementById(`draft-minus-${i}`).disabled = draft.qty <= 1;
  ADICIONAIS.forEach((a, j) => {
    const qty = draft.extras[j] || 0;
    document.getElementById(`extra-qty-${i}-${j}`).textContent = qty;
    document.getElementById(`extra-minus-${i}-${j}`).disabled = qty === 0;
    document.getElementById(`extra-plus-${i}-${j}`).disabled = qty >= 1;
  });
  const price = draftPrice(i);
  document.getElementById(`draft-total-${i}`).textContent = fmtBRL(price * draft.qty);
  document.getElementById(`breakdown-${i}`).textContent =
    `Base ${fmtBRL(ITEMS[i].price)} + adicionais ${fmtBRL(price - ITEMS[i].price)} = ${fmtBRL(price)} por unidade`;
}
function changeExtra(i, a, delta) {
  const next = Math.min(1, Math.max(0, (drafts[i].extras[a] || 0) + delta));
  if (next) drafts[i].extras[a] = next;
  else delete drafts[i].extras[a];
  document.getElementById(`feedback-${i}`).textContent = '';
  updateDraft(i);
}
function changeDraftQty(i, delta) {
  drafts[i].qty = Math.max(1, drafts[i].qty + delta);
  document.getElementById(`feedback-${i}`).textContent = '';
  updateDraft(i);
}
function addProduct(i) {
  const extras = Object.entries(drafts[i].extras).map(([a, qty]) => ({ ...ADICIONAIS[a], qty }));
  // Copia a configuração: alterações posteriores nunca mudam um item já adicionado.
  const removed = drafts[i].removed.map(j => ITEMS[i].ingredients[j]);
  const key = JSON.stringify([i, extras, removed]);
  const existing = cart.find(item => item.key === key);
  if (existing) existing.qty += drafts[i].qty;
  else cart.push({ ...ITEMS[i], id: nextCartId++, key, extras, removed, basePrice: ITEMS[i].price,
    price: draftPrice(i), qty: drafts[i].qty });
  const addedQty = drafts[i].qty;
  drafts[i] = { qty: 1, extras: {}, removed: [] };
  ITEMS.forEach((item,k) => { if (item.group === ITEMS[i].group) { drafts[k].removed = []; refreshIngredients(k); } });
  updateDraft(i);
  document.getElementById(`feedback-${i}`).textContent = `${addedQty === 1 ? 'Item adicionado' : addedQty + ' itens adicionados'} ao carrinho ✓`;
  renderAll();
}
function changeQty(id, delta) {
  const index = cart.findIndex(item => item.id === id);
  if (index < 0) return;
  cart[index].qty = Math.max(0, cart[index].qty + delta);
  if (!cart[index].qty) cart.splice(index, 1);
  renderAll();
}
function cartCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }
function cartTotal() { return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
function renderCartItems() {
  const el = document.getElementById('cartItems');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty">Seu carrinho está vazio.<br>Escolhe um açaí no cardápio 🍇</div>`;
    return;
  }
  el.innerHTML = cart.map(item => `<div class="cart-line"><div class="cart-line-info">
    <h4>${item.label}</h4><span>Base: ${fmtBRL(item.basePrice)} por unidade</span>
    ${item.extras.length ? `<ul class="cart-extras">${item.extras.map(a => `<li>${a.qty}x ${a.name} · + ${fmtBRL(a.price * a.qty)}</li>`).join('')}</ul><span>Adicionais por unidade</span>` : `<p class="cart-no-extras">Sem adicionais</p>`}
    ${(item.removed || []).map(name => `<p class="removed-ingredient">Sem ${name}</p>`).join('')}
    <p class="cart-final-price">${fmtBRL(item.price)} cada · ${fmtBRL(item.price * item.qty)}</p>
    </div><div class="stepper">
    <button type="button" aria-label="Remover uma unidade de ${item.label}" onclick="changeQty(${item.id}, -1)">−</button>
    <span class="qty-count">${item.qty}</span>
    <button type="button" aria-label="Acrescentar uma unidade de ${item.label}" onclick="changeQty(${item.id}, 1)">+</button>
    </div></div>`).join('');
}

// ---- Entrega: localização autorizada ou endereço digitado ----
let deliveryMode = null;
let deliveryLocation = null;
let locationRequestId = 0;
let locationWatch = null;
let locationTimer = null;
function stopLocationCapture() {
  if (locationWatch !== null) navigator.geolocation.clearWatch(locationWatch);
  if (locationTimer !== null) clearTimeout(locationTimer);
  locationWatch = null; locationTimer = null;
}

// Uma consulta de endereço por captura concluída, com cache e cancelamento.
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';
const addressCache = new Map();
let deliveryAddressParts = { street: '', neighborhood: '', city: '' };
function syncCurrentAddress() {
  const parts = document.getElementById('currentAddress').value.split(' - ').map(part => part.trim());
  deliveryAddressParts = { ...deliveryAddressParts, street: parts[0] || '', neighborhood: parts.length >= 3 ? parts[1] : deliveryAddressParts.neighborhood, city: parts.length >= 3 ? parts.slice(2).join(' - ') : deliveryAddressParts.city };
  suggestCity(deliveryAddressParts.city);
  suggestNeighborhood(deliveryAddressParts.neighborhood);
}
let addressController = null;
let addressLastRequest = 0;
function neighborhoodFromResult(data) {
  const a = data.address || {};
  const namedNeighborhood = a.suburb || a.quarter || a.neighbourhood || a.city_district;
  if (namedNeighborhood) return namedNeighborhood;
  return ['suburb','quarter','neighbourhood','city_district'].includes(data.addresstype) ? data.name || '' : '';
}
async function reverseAddress(location, zoom, signal, format = 'jsonv2') {
  const delay = Math.max(0, 1100 - (Date.now() - addressLastRequest));
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  if (signal.aborted) throw new Error('Cancelado');
  addressLastRequest = Date.now();
  const query = new URLSearchParams({format, lat:String(location.latitude), lon:String(location.longitude), zoom:String(zoom), layer:'address', addressdetails:'1', 'accept-language':'pt-BR'});
  return fetchLocationJSON(`${REVERSE_GEOCODE_URL}?${query}`, signal);
}
function canonicalCity(value) {
  return DELIVERY_CITIES.find(city => normalizeNeighborhood(city) === normalizeNeighborhood(value || '')) || '';
}
function cityFromResult(data) {
  const a = data.address || {};
  return [a.city, a.town, a.municipality, a.village, a.county, data.addresstype === 'city' ? data.name : ''].map(canonicalCity).find(Boolean) || '';
}
async function fetchLocationJSON(url, signal) {
  const child = new AbortController();
  const cancel = () => child.abort();
  signal.addEventListener('abort', cancel, {once:true});
  if (signal.aborted) child.abort();
  const timer = setTimeout(cancel, 8000);
  try {
    const response = await fetch(url, {signal:child.signal, referrerPolicy:'origin'});
    if (!response.ok) throw new Error('Consulta de localização indisponível');
    return await response.json();
  } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
async function alternativeLocation(location, signal) {
  // Apenas coordenadas atuais autorizadas, enviadas diretamente pelo celular.
  const query = new URLSearchParams({latitude:String(location.latitude), longitude:String(location.longitude), localityLanguage:'pt'});
  const data = await fetchLocationJSON(`https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`, signal);
  if (data.countryCode && data.countryCode !== 'BR') return {city:'', neighborhood:''};
  const administrative = data.localityInfo?.administrative || [];
  const city = [data.city, ...administrative.map(item=>item.name)].map(canonicalCity).find(Boolean) || '';
  const locality = data.localityName || data.locality || '';
  // Uma cidade ou estado nunca é tratado como bairro.
  const forbidden = [...DELIVERY_CITIES, data.city, data.countryName, data.principalSubdivision].filter(Boolean).map(normalizeNeighborhood);
  const neighborhood = locality && !forbidden.includes(normalizeNeighborhood(locality)) ? locality : '';
  return {city, neighborhood};
}
let googleMapsLoader;
function loadGoogleGeocoder() {
  if (window.google?.maps?.Geocoder) return Promise.resolve(window.google.maps.Geocoder);
  if (!window.CASA_GOOGLE_MAPS_KEY || !document.createElement) return Promise.reject(new Error('Google não configurado'));
  if (!googleMapsLoader) googleMapsLoader = new Promise((resolve,reject) => {
    const script = document.createElement('script');
    let timer;
    const fail = () => { clearTimeout(timer); googleMapsLoader = null; script.remove(); reject(new Error('Google Maps indisponível')); };
    window.casaGoogleReady = () => {
      clearTimeout(timer);
      if (window.google?.maps?.Geocoder) resolve(window.google.maps.Geocoder); else fail();
    };
    script.src = 'https://maps.googleapis.com/maps/api/js?' + new URLSearchParams({key:window.CASA_GOOGLE_MAPS_KEY,callback:'casaGoogleReady',language:'pt-BR',region:'BR',loading:'async'});
    script.async = true; script.onerror = fail;
    timer = setTimeout(fail, 10000);
    document.head.appendChild(script);
  });
  return googleMapsLoader;
}
function parseGoogleAddress(results) {
  const component = (result,types) => {
    for (const type of types) {
      const part = result.address_components?.find(p => p.types?.includes(type));
      if (part) return part.long_name;
    }
    return '';
  };
  const cityOf = result => canonicalCity(component(result,['administrative_area_level_2','locality']));
  const city = results.map(cityOf).find(Boolean) || '';
  const sameCity = results.filter(result => cityOf(result) === city);
  const street = sameCity.map(result=>component(result,['route'])).find(Boolean) || '';
  const neighborhood = sameCity.map(result=>component(result,['neighborhood','sublocality_level_1','sublocality','sublocality_level_2'])).find(Boolean) || '';
  return {street,neighborhood,city,neighborhoodApproximate:false,source:'Google Maps'};
}
async function googleLocation(location,signal) {
  const Geocoder = await loadGoogleGeocoder();
  if (signal.aborted) throw new Error('Cancelado');
  return new Promise((resolve,reject) => {
    const abort = () => finish(new Error('Cancelado'));
    const timer = setTimeout(()=>finish(new Error('Consulta Google excedeu o tempo')),8000);
    let done = false;
    function finish(error,value) {
      if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);
      error ? reject(error) : resolve(value);
    }
    signal.addEventListener('abort',abort,{once:true});
    new Geocoder().geocode({location:{lat:location.latitude,lng:location.longitude}},(results,status)=> {
      if(status==='OK') finish(null,parseGoogleAddress(results || []));
      else finish(new Error('Google Geocoding: '+status));
    });
  });
}
function mappedNeighborhood(location, city) {
  const data = window.CASA_NEIGHBORHOOD_REFERENCES;
  if (city !== 'Barra do Garças' || !data || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return null;
  const radians = degrees => degrees * Math.PI / 180;
  let nearest = null;
  for (const point of data.points) {
    const dy = radians(point.latitude - location.latitude), dx = radians(point.longitude - location.longitude);
    const h = Math.sin(dy/2)**2 + Math.cos(radians(location.latitude))*Math.cos(radians(point.latitude))*Math.sin(dx/2)**2;
    const distance = 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
    if (!nearest || distance < nearest.distanceMeters) nearest = {name:point.name,distanceMeters:distance};
  }
  return nearest && nearest.distanceMeters <= data.maximumDistanceMeters ? nearest : null;
}
function nearbyNeighborhood(result, location, city) {
  const resultCity = cityFromResult(result);
  if (!city || !resultCity || city !== resultCity) return '';
  const lat = Number(result.lat), lon = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
  const dy = (lat - location.latitude) * 111320;
  const dx = (lon - location.longitude) * 111320 * Math.cos(location.latitude * Math.PI / 180);
  // Aproximação autorizada pela loja, dentro do mesmo município.
  return Math.hypot(dx, dy) <= 2000 ? neighborhoodFromResult(result) : '';
}
async function fillLocationAddress(location, requestId) {
  const field = document.getElementById('currentAddress');
  const initialValue = field.value;
  const status = document.getElementById('addressStatus');
  const key = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
  status.textContent = 'Identificando rua, bairro e cidade pela localização…';
  const controller = new AbortController();
  addressController = controller;
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    let address = addressCache.get(key);
    if (!address) {
      try { address = await googleLocation(location,controller.signal); }
      catch(error) { if(controller.signal.aborted) throw error; address = {street:'',city:'',neighborhood:'',neighborhoodApproximate:false}; }
      if (!address.street || !address.city || (address.city === 'Barra do Garças' && !address.neighborhood)) {
        let exact = {};
        try { exact = await reverseAddress(location,18,controller.signal); } catch(error) {if(controller.signal.aborted)throw error;}
        const a=exact.address || {}, fallbackCity=cityFromResult(exact);
        if(!address.city || !fallbackCity || address.city===fallbackCity) {
          address.street ||= a.road || a.pedestrian || a.footway || '';
          address.city ||= fallbackCity;
          address.neighborhood ||= neighborhoodFromResult(exact);
        }
      }
      if (address.city === 'Barra do Garças' && !address.neighborhood) {
        const mapped = mappedNeighborhood(location,address.city);
        if (mapped) {
          address.neighborhood = mapped.name;
          address.neighborhoodApproximate = true;
          address.neighborhoodSource = 'mapa cadastral';
          address.neighborhoodReferenceDistance = Math.round(mapped.distanceMeters);
        }
      }
      if (!address.city || (address.city === 'Barra do Garças' && !address.neighborhood)) {
        try {
          const alternative = await alternativeLocation(location, controller.signal);
          if (!alternative.city || (address.city && address.city !== alternative.city)) {
            // Divergência de município não fornece um bairro para cobrança.
          } else {
            address.city ||= alternative.city;
            if (!address.neighborhood && alternative.neighborhood) { address.neighborhood = alternative.neighborhood; address.neighborhoodApproximate = true; }
          }
        } catch (error) { if(controller.signal.aborted) throw error; }
      }
      if (!address.city) {
        try { address.city = cityFromResult(await reverseAddress(location, 10, controller.signal)); } catch (error) { if(controller.signal.aborted) throw error; }
      }
      if (address.city === 'Barra do Garças' && !address.neighborhood) {
        const mapped = mappedNeighborhood(location,address.city);
        if (mapped) {
          address.neighborhood = mapped.name;
          address.neighborhoodApproximate = true;
          address.neighborhoodSource = 'mapa cadastral';
          address.neighborhoodReferenceDistance = Math.round(mapped.distanceMeters);
        }
      }
      if (address.city === 'Barra do Garças' && !address.neighborhood) {
        for (const zoom of [14, 13]) {
          if (controller.signal.aborted || requestId !== locationRequestId) break;
          try {
            const region = await reverseAddress(location, zoom, controller.signal);
            const neighborhood = nearbyNeighborhood(region, location, address.city);
            if (neighborhood) { address.neighborhood = neighborhood; address.neighborhoodApproximate = true; break; }
          } catch (error) { if(controller.signal.aborted) throw error; }
        }
      }
      // Não congela respostas incompletas: uma nova tentativa consulta de novo.
      if (address.city && (address.city !== 'Barra do Garças' || address.neighborhood)) addressCache.set(key, address);
    }
    if (requestId !== locationRequestId || deliveryMode !== 'current') return;
    deliveryAddressParts = {...address};
    if (field.value === initialValue) {
      field.value = [address.street || 'Localização no mapa', address.neighborhood, address.city].filter(Boolean).join(' - ');
      document.getElementById('locationVerified').checked = false;
    }
    suggestCity(address.city);
    suggestNeighborhood(address.neighborhood);
    if (deliveryFee() === null) {
      status.textContent = 'Não foi possível identificar a região de entrega. Toque em “Tentar novamente” para consultar a localização de novo.';
      document.getElementById('deliveryFeeStatus').textContent = 'Região não identificada. A taxa ainda não foi calculada.';
    } else {
      status.textContent = address.neighborhoodSource === 'mapa cadastral' ? 'Bairro preenchido automaticamente por referência próxima do mapa cadastral (aproximado). Confira o ponto de entrega.' : address.neighborhoodApproximate ? 'Endereço preenchido automaticamente; bairro identificado pela região próxima. Confira o ponto no mapa.' : 'Endereço e taxa preenchidos automaticamente. Confira o ponto no mapa.';
    }
    document.getElementById('locationRetry').hidden = false;
    updateConfirmState();
  } catch (error) {
    if (requestId === locationRequestId && deliveryMode === 'current') {
      status.textContent = 'A consulta da região falhou. Toque em “Tentar novamente”.';
      document.getElementById('deliveryFeeStatus').textContent = 'Não foi possível calcular a taxa pela localização.';
      document.getElementById('locationRetry').hidden = false;
    }
  } finally {
    clearTimeout(timeout);
    if (addressController === controller) addressController = null;
  }
}

function deliveryReady() {
  return deliveryMode === 'current' ? deliveryLocation !== null && document.getElementById('locationVerified').checked && !!document.getElementById('currentAddress').value.trim() :
    deliveryMode === 'other' && !!document.getElementById('custAddress').value.trim();
}
function selectDelivery(mode) {
  document.getElementById('deliveryCity').value = '';
  document.getElementById('deliveryNeighborhood').value = '';
  document.getElementById('otherNeighborhood').value = '';
  document.getElementById('otherNeighborhoodLabel').hidden = true;
  document.getElementById('deliveryFeeStatus').textContent = 'Identificando a região da entrega…';
  document.getElementById('deliveryCorrection').hidden = mode === 'current';
  const requestId = ++locationRequestId;
  stopLocationCapture();
  if (addressController) addressController.abort();
  document.getElementById('addressStatus').textContent = '';
  deliveryAddressParts = { street: '', neighborhood: '', city: '' };
  document.getElementById('locationVerified').checked = false;
  deliveryMode = mode;
  deliveryLocation = null;
  document.getElementById('deliveryCurrent').setAttribute('aria-pressed', String(mode === 'current'));
  document.getElementById('deliveryOther').setAttribute('aria-pressed', String(mode === 'other'));
  document.getElementById('locationPanel').hidden = mode !== 'current';
  document.getElementById('addressPanel').hidden = mode !== 'other';
  document.getElementById('locationMap').hidden = true;
  document.getElementById('locationRetry').hidden = true;
  updateConfirmState();
  if (mode === 'other') {
    document.getElementById('custAddress').focus();
    return;
  }
  const status = document.getElementById('locationStatus');
  function fail(message) {
    if (requestId !== locationRequestId || deliveryMode !== 'current') return;
    status.textContent = message;
    document.getElementById('locationRetry').hidden = false;
    updateConfirmState();
  }
  if (!window.isSecureContext || !navigator.geolocation) {
    fail('Não foi possível acessar a localização. Abra o site em HTTPS ou escolha “Enviar para outro local” e digite o endereço.');
    return;
  }
  let best = null;
  let captureFinished = false;
  const targetAccuracy = 30;
  function finishCapture() {
    if (captureFinished || requestId !== locationRequestId || deliveryMode !== 'current') return;
    captureFinished = true;
    stopLocationCapture();
    if (!best) { fail('Não foi possível obter a localização. Tente novamente ou digite o endereço em “Enviar para outro local”.'); return; }
    deliveryLocation = best;
    fillLocationAddress(best, requestId);
    status.textContent = `Localização obtida · precisão aproximada de ${Math.round(best.accuracy)} metros. ` +
      (best.accuracy > 100 ? 'A precisão está baixa. Prefira “Enviar para outro local” se o ponto não corresponder à entrega.' : 'Confira o ponto no mapa enquanto buscamos o endereço automaticamente.');
    document.getElementById('locationRetry').hidden = false;
    updateConfirmState();
  }
  status.textContent = 'Buscando uma posição mais precisa por até 30 segundos. Permita localização precisa no celular e mantenha esta tela aberta.';
  locationWatch = navigator.geolocation.watchPosition(position => {
    if (requestId !== locationRequestId || deliveryMode !== 'current') return;
    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy) || accuracy < 0 || Math.abs(latitude)>90 || Math.abs(longitude)>180) return;
    if (!best || accuracy < best.accuracy) {
      best = { latitude, longitude, accuracy };
      const map = document.getElementById('locationMap');
      map.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
      map.hidden = false;
      status.textContent = `Melhor precisão até agora: ${Math.round(accuracy)} metros. Aguarde enquanto tentamos melhorar…`;
    }
    if (accuracy <= targetAccuracy) finishCapture();
  }, error => {
    if (requestId !== locationRequestId || deliveryMode !== 'current') return;
    if (error.code === 1) {
      stopLocationCapture();fail('Acesso negado. Permita localização precisa no navegador ou escolha “Enviar para outro local”.');
    } else if (best) finishCapture();
    else {stopLocationCapture();fail('Não foi possível obter sua localização. Tente novamente ou escolha “Enviar para outro local”.');}
  }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
  locationTimer = setTimeout(finishCapture, 30000);
}

// ---- Habilita/desabilita o botão de confirmar ----
function cashChange() {
  if (document.getElementById('custPayment').value !== 'Dinheiro') return {valid:true,needed:false};
  const value = document.getElementById('custChange').value.trim();
  if (!value) return {valid:true,needed:false};
  const localized = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value);
  const decimal = /^\d+(?:\.\d{1,2})?$/.test(value);
  if (!localized && !decimal) return {valid:false,error:'Informe um valor válido, como 100,00.'};
  const amount = Number(localized ? value.replaceAll('.','').replace(',','.') : value);
  const cents = Math.round(amount*100), totalCents = Math.round(orderTotal()*100);
  if (!Number.isSafeInteger(cents) || cents < totalCents) return {valid:false,error:`O valor para troco deve ser pelo menos ${fmtBRL(orderTotal())}.`};
  return {valid:true,needed:true,amount:cents/100,change:(cents-totalCents)/100};
}
function updateConfirmState() {
  const hasItems = cartCount() > 0;
  const name = document.getElementById('custName').value.trim();
  const payment = document.getElementById('custPayment').value;
  const change = cashChange();
  document.getElementById('cashChangePanel').hidden = payment !== 'Dinheiro';
  document.getElementById('cashChangeError').textContent = change.valid ? '' : change.error;

  document.getElementById('cartTotal').textContent = fmtBRL(orderTotal());
  document.getElementById('cartProductsTotal').textContent = fmtBRL(cartTotal());
  document.getElementById('cartDeliveryFee').textContent = deliveryFee()===null ? 'Selecione o local' : deliveryFee()===0 ? 'GRÁTIS' : fmtBRL(deliveryFee());
  document.getElementById('cartConfirmBtn').disabled = !(hasItems && name && payment && deliveryReady() && deliveryFee() !== null && change.valid);
}

// ---- Barra flutuante ----
function renderCartBar() {
  const count = cartCount();
  const bar = document.getElementById('cartBar');
  document.getElementById('cartBarCount').textContent = count;
  document.getElementById('cartBarTotal').textContent = fmtBRL(orderTotal());
  bar.classList.toggle('visible', count > 0);
}

function renderAll() {
  renderCartItems();
  renderCartBar();
  updateConfirmState();
}

// ---- Abrir / fechar painel ----
function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

// ---- Monta a mensagem agrupada por categoria e abre o WhatsApp ----
let lastOrderSnapshot = null;
let lastOrderCode = null;
function confirmOrder() {
  if (!cart.length) return;
  const name = document.getElementById('custName').value.trim();
  const payment = document.getElementById('custPayment').value;
  const note = document.getElementById('custNote').value.trim();
  const change = cashChange();
  if (!name || !payment || !deliveryReady() || deliveryFee() === null || !change.valid) return;
  let msg = `Cliente: ${name}\n`;
  if(customerPhone) msg += `Contato: ${customerContactText(customerPhone)}\n`;
  msg += '\n*PRODUTOS*\n';
  cart.forEach(item => {
    const label = item.category === 'Marmitas' ? item.label.replace(' (750ml)', '') : item.label;
    msg += `\n*${item.qty}x ${label} — ${fmtBRL(item.price * item.qty)}*\n`;
    (item.removed || []).forEach(name => { msg += `*Sem ${name}*\n`; });
    if (item.extras.length) {
      msg += item.qty > 1 ? 'Adicionais em cada unidade:\n' : 'Adicionais:\n';
      item.extras.forEach(a => { msg += `  + ${a.name} · ${fmtBRL(a.price)}\n`; });
    }
  });
  msg += `\nProdutos: ${fmtBRL(cartTotal())}\n`;
  msg += `Taxa de entrega: ${deliveryFee()===0 ? 'GRÁTIS' : fmtBRL(deliveryFee())}\n`;
  msg += `*TOTAL: ${fmtBRL(orderTotal())}*\n`;
  msg += `\nForma de pagamento: ${payment}\n`;
  if (payment === 'Dinheiro') msg += change.needed ? `Troco para: ${fmtBRL(change.amount)}\nTroco: ${fmtBRL(change.change)}\n` : 'Troco: Não precisa\n';
  if (note) msg += `Observação: ${note}\n`;
  msg += "\n📍 *LOCAL DE ENTREGA*\n";
  if (deliveryMode === 'current') {
    msg += `Endereço: ${deliveryAddressForMessage(document.getElementById('currentAddress').value.trim())}\n`;
    msg += `Localização: https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
  } else {
    msg += `Endereço: ${deliveryAddressForMessage(document.getElementById('custAddress').value.trim())}`;
    const complement = document.getElementById('custComplement').value.trim();
    if (complement) msg += `\nComplemento: ${complement}`;
  }

  if (selectedNeighborhood()) msg += `\nBairro: ${selectedNeighborhood()}`;
  const city = document.getElementById('deliveryCity').value;
  if (city !== 'Barra do Garças') msg += `\nCidade: ${city}`;
  const snapshot = msg;
  if (snapshot !== lastOrderSnapshot) {
    const random = window.crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    lastOrderCode = `BG-${random}`;
    lastOrderSnapshot = snapshot;
  }
  msg = `*Casa do Açaí BG*\nPedido: ${lastOrderCode}\n\n` + msg;
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

// ---- Inicialização ----
buildNeighborhoodOptions();
buildMarmitas();
buildCopos();
buildCasa();
ITEMS.forEach((_, i) => updateDraft(i));
renderAll();

function deliveryAddressForMessage(value) {
  const parts = value.split(' - ').map(part => part.trim());
  if (document.getElementById('deliveryCity').value === 'Barra do Garças' && normalizeNeighborhood(parts.at(-1) || '') === normalizeNeighborhood('Barra do Garças')) parts.pop();
  return parts.join(' - ');
}

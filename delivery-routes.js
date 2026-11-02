(function (root) {
  'use strict';
  const reference = Object.freeze({name:'Praça do Relógio',lat:-15.8941042,lng:-52.2581299});
  const tiers = Object.freeze({
    'Pontal do Araguaia': Object.freeze({limitMeters:2100,nearFee:6,farFee:8}),
    'Aragarças': Object.freeze({limitMeters:3500,nearFee:10,farFee:15})
  });
  function feeForDistance(city, distanceMeters) {
    const tier = tiers[city];
    if (!tier || !Number.isFinite(distanceMeters) || distanceMeters < 0) return null;
    return distanceMeters <= tier.limitMeters ? tier.nearFee : tier.farFee;
  }
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function cityOf(result) {
    for (const type of ['administrative_area_level_2','locality']) {
      const name = result.address_components?.find(c => c.types?.includes(type))?.long_name;
      const city = Object.keys(tiers).find(city => normalize(city) === normalize(name));
      if (city) return city;
    }
    return '';
  }
  function abortable(promise, signal) {
    if (!signal) return Promise.resolve(promise);
    return new Promise((resolve,reject) => {
      const abort = () => reject(new Error('Consulta cancelada'));
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort',abort,{once:true});
      Promise.resolve(promise).then(value => {
        signal.removeEventListener('abort',abort); resolve(value);
      },error => { signal.removeEventListener('abort',abort); reject(error); });
    });
  }
  async function googleQuote({city,location,address,signal}) {
    if (!tiers[city]) throw new Error('Cidade sem cobrança por percurso');
    const maps = root.google?.maps;
    if (!maps?.importLibrary) throw new Error('Google Maps não disponível');
    let destination;
    if (location) {
      if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || Math.abs(location.latitude)>90 || Math.abs(location.longitude)>180) throw new Error('Localização inválida');
      destination = {lat:location.latitude,lng:location.longitude};
    } else {
      if (!address?.trim()) throw new Error('Informe o endereço da entrega');
      const results = await abortable(new Promise((resolve,reject) => {
        new maps.Geocoder().geocode({address:address+', '+city+', Brasil',region:'BR'},(results,status) => {
          if (status === 'OK') resolve(results || []);
          else reject(new Error('Endereço não encontrado: '+status));
        });
      }),signal);
      // Não calcula uma entrega no centro da cidade ou em município diferente.
      const result = results.find(r => !r.partial_match && cityOf(r) === city && r.address_components?.some(c => c.types?.includes('route')));
      const latLng = result?.geometry?.location;
      const lat = typeof latLng?.lat === 'function' ? latLng.lat() : latLng?.lat;
      const lng = typeof latLng?.lng === 'function' ? latLng.lng() : latLng?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Confira a rua, o número e a cidade do endereço');
      destination = {lat,lng};
    }
    const {Route} = await abortable(maps.importLibrary('routes'),signal);
    if (!Route?.computeRoutes) throw new Error('Biblioteca de rotas não disponível');
    const result = await abortable(Route.computeRoutes({
      origin:{lat:reference.lat,lng:reference.lng},destination,
      travelMode:'DRIVING',routingPreference:'TRAFFIC_UNAWARE',
      computeAlternativeRoutes:false,fields:['distanceMeters']
    }),signal);
    const distanceMeters = result.routes?.[0]?.distanceMeters;
    const fee = feeForDistance(city,distanceMeters);
    if (fee === null) throw new Error('Não foi encontrado um percurso válido');
    return {distanceMeters,fee,source:'Google Maps'};
  }
  function provider() { return root.CASA_DELIVERY_ROUTE_PROVIDER || 'internal'; }
  async function quote(options) {
    if (provider()==='google') return googleQuote(options);
    const {city,location,signal}=options;
    if (!tiers[city]) throw new Error('Cidade sem cobrança por percurso');
    if (!location) throw new Error('Marque o ponto da entrega no mapa');
    if (signal?.aborted) throw new Error('Consulta cancelada');
    const router=await abortable(root.CASA_INTERNAL_ROUTING.load(),signal);
    let result;
    try {result=router.route(location);}
    catch(error) {
      // Se até a menor distância possível ultrapassa o limite, qualquer percurso
      // pelas ruas está na faixa distante. Não apresenta essa medida como rota.
      const minimum=router.meters([reference.lat,reference.lng],[location.latitude,location.longitude]);
      if (!Number.isFinite(minimum)||minimum<=tiers[city].limitMeters) throw error;
      result={distanceMeters:minimum,distanceKind:'minimum',source:'mapa interno',estimated:true};
    }
    return {...result,fee:feeForDistance(city,result.distanceMeters)};
  }
  root.CASA_DELIVERY_ROUTES = Object.freeze({reference,tiers,feeForDistance,quote,provider});
})(typeof window === 'undefined' ? globalThis : window);

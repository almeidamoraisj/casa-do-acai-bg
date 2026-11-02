(function(root){
 'use strict';
 const R=6371000, radians=x=>x*Math.PI/180;
 function meters(a,b){const dlat=radians(b[0]-a[0]),dlon=radians(b[1]-a[1]);return 2*R*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(radians(a[0]))*Math.cos(radians(b[0]))*Math.sin(dlon/2)**2)));}
 class Heap {
  constructor(){this.a=[];}
  push(value){let i=this.a.length;this.a.push(value);while(i){const p=(i-1)>>1;if(this.a[p][0]<=value[0])break;this.a[i]=this.a[p];i=p;}this.a[i]=value;}
  pop(){const out=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length&&this.a[c+1][0]<this.a[c][0])c++;if(this.a[c][0]>=last[0])break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return out;}
 }
 function create(data){
  if(!Array.isArray(data.nodes)||!data.nodes.length||!Array.isArray(data.segments)||!data.segments.length)throw Error('Rede de ruas inválida');
  const nodes=data.nodes,out=nodes.map(()=>[]),incoming=nodes.map(()=>[]),edges=[],restrictions=new Map();
  const xScale=R*Math.cos(radians(data.reference[0]))*Math.PI/180,yScale=R*Math.PI/180;
  function add(a,b,length,way,segment){const id=edges.length;edges.push({a,b,length,way,segment});out[a].push(id);incoming[b].push(id);return id;}
  const segmentEdges=data.segments.map(([a,b,length,direction,way],segment)=>{
   const ids=[];if(direction!==-1)ids.push(add(a,b,length,way,segment));if(direction!==1)ids.push(add(b,a,length,way,segment));return ids;
  });
  for(const restriction of data.restrictions||[]){if(!restrictions.has(restriction[0]))restrictions.set(restriction[0],[]);restrictions.get(restriction[0]).push(restriction);}
  function allowed(previous,next){
   for(const [,from,to,type] of restrictions.get(previous.b)||[]){
    if(previous.way!==from)continue;
    if(type.startsWith('only_')&&next.way!==to)return false;
    if(type.startsWith('no_')&&next.way===to){
     if(type==='no_u_turn'&&from===to&&next.b!==previous.a)continue;
     return false;
    }
   }return true;
  }
  function snap(point,maxMeters=160){
   let best=null;
   data.segments.forEach(([a,b,length,direction,way],index)=>{
    const ax=(nodes[a][1]-point[1])*xScale,ay=(nodes[a][0]-point[0])*yScale;
    const dx=(nodes[b][1]-nodes[a][1])*xScale,dy=(nodes[b][0]-nodes[a][0])*yScale;
    const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
    const offset=Math.hypot(ax+t*dx,ay+t*dy);
    if(!best||offset<best.offset)best={index,a,b,length,direction,way,t,offset};
   });
   if(!best||best.offset>maxMeters)throw Error('Ponto distante das ruas mapeadas. Confira o ponto da entrega.');
   return best;
  }
  const origin=snap(data.reference),dist=new Float64Array(edges.length).fill(Infinity),heap=new Heap();
  for(const id of segmentEdges[origin.index]){
   const edge=edges[id],fraction=edge.a===origin.a?1-origin.t:origin.t;
   const cost=origin.offset+edge.length*fraction;dist[id]=cost;heap.push([cost,id]);
  }
  while(heap.a.length){
   const [cost,id]=heap.pop();if(cost!==dist[id])continue;const edge=edges[id];
   for(const nextId of out[edge.b]){
    const next=edges[nextId];if(!allowed(edge,next))continue;const nextCost=cost+next.length;
    if(nextCost<dist[nextId]){dist[nextId]=nextCost;heap.push([nextCost,nextId]);}
   }
  }
  function route(location){
   const point=[location.latitude,location.longitude];
   if(!point.every(Number.isFinite)||Math.abs(point[0])>90||Math.abs(point[1])>180)throw Error('Localização inválida');
   if(meters(point,data.reference)<.01)return {distanceMeters:0,snapMeters:0,source:'mapa interno',estimated:true};
   const target=snap(point);let best=Infinity;
   if(target.t<1e-9)for(const id of incoming[target.a])best=Math.min(best,dist[id]+target.offset);
   if(target.t>1-1e-9)for(const id of incoming[target.b])best=Math.min(best,dist[id]+target.offset);
   for(const id of segmentEdges[target.index]){
    const connector=edges[id],fraction=connector.a===target.a?target.t:1-target.t;
    for(const previousId of incoming[connector.a])if(allowed(edges[previousId],connector))best=Math.min(best,dist[previousId]+connector.length*fraction+target.offset);
   }
   if(target.index===origin.index){
    if(target.t>=origin.t&&origin.direction!==-1)best=Math.min(best,(target.t-origin.t)*origin.length+origin.offset+target.offset);
    if(target.t<=origin.t&&origin.direction!==1)best=Math.min(best,(origin.t-target.t)*origin.length+origin.offset+target.offset);
   }
   if(!Number.isFinite(best))throw Error('As ruas deste ponto não estão conectadas ao percurso da praça no mapa local.');
   return {distanceMeters:Math.round(best*100)/100,snapMeters:Math.round(target.offset),source:'mapa interno',estimated:true};
  }
  return {data,route,meters};
 }
 let loaded;
 async function load(){
  if(!loaded)loaded=fetch('assets/entrega/ruas-pontal-aragarcas.json?v=20261102').then(response=>{if(!response.ok)throw Error('Não foi possível carregar as ruas');return response.json();}).then(create).catch(error=>{loaded=null;throw error;});
  return loaded;
 }
 root.CASA_INTERNAL_ROUTING={create,load,meters};
})(typeof window==='undefined'?globalThis:window);

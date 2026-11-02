"""Gera a rede viária local a partir de extratos .osm da API pública OpenStreetMap.
Uso: python3 tools/build-internal-roads.py arquivo.osm [outro.osm ...]
"""
from pathlib import Path
import sys,json,math,xml.etree.ElementTree as ET
nodes={};ways={};relations={}
for filename in sys.argv[1:]:
 for e in ET.parse(filename).getroot():
  target={'node':nodes,'way':ways,'relation':relations}.get(e.tag)
  if target is not None:
   old=target.get(e.get('id'))
   if old is None or int(e.get('version','0'))>=int(old.get('version','0')):target[e.get('id')]=e

def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
blocked=set()
for k,e in nodes.items():
 t=tags(e);access=next((t[x] for x in ['motorcar','motor_vehicle','vehicle','access'] if x in t),'')
 if access in ['no','private'] or (t.get('barrier') in ['bollard','block','cycle_barrier','stile','kissing_gate'] and access not in ['yes','permissive','designated']):blocked.add(k)
allowed={'motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','residential','unclassified','living_street','service','track','road'}
raw=[];used=set();way_ids=set();names={}
def distance(a,b):
 la,lo=map(math.radians,a);lb,lob=map(math.radians,b);h=math.sin((lb-la)/2)**2+math.cos(la)*math.cos(lb)*math.sin((lob-lo)/2)**2
 return 6371000*2*math.asin(min(1,math.sqrt(h)))
for wid,e in ways.items():
 t=tags(e)
 if t.get('highway') not in allowed:continue
 access=next((t[x] for x in ['motorcar','motor_vehicle','vehicle','access'] if x in t),'')
 if access in ['no','private','agricultural','forestry']:continue
 oneway=next((t[x] for x in ['oneway:motorcar','oneway:motor_vehicle','oneway'] if x in t),'yes' if t.get('junction')=='roundabout' or t.get('highway')=='motorway' else 'no')
 if oneway in ['reversible','alternating']:continue
 direction=-1 if oneway=='-1' else 1 if oneway in ['yes','true','1'] else 0
 nd=[x.get('ref') for x in e.findall('nd')]
 for a,b in zip(nd,nd[1:]):
  if a not in nodes or b not in nodes or a in blocked or b in blocked or a==b:continue
  pa=[float(nodes[a].get('lat')),float(nodes[a].get('lon'))];pb=[float(nodes[b].get('lat')),float(nodes[b].get('lon'))]
  raw.append([a,b,round(distance(pa,pb),2),direction,int(wid)]);used.update([a,b]);way_ids.add(int(wid))
 if t.get('name'):names[wid]=t['name']
ids=sorted(used,key=int);index={n:i for i,n in enumerate(ids)}
restrictions=[];skipped=0
for rel in relations.values():
 t=tags(rel)
 if t.get('type')!='restriction' or 'motorcar' in t.get('except','').split(';'):continue
 kind=t.get('restriction:motorcar',t.get('restriction',''))
 members={m.get('role'):(m.get('type'),m.get('ref')) for m in rel.findall('member')}
 if not all(x in members for x in ['from','to','via']):continue
 if members['via'][0]!='node':skipped+=1;continue
 via=members['via'][1];f=int(members['from'][1]);to=int(members['to'][1])
 if via in index and f in way_ids and to in way_ids:restrictions.append([index[via],f,to,kind])
data={'version':'2026-11-02','source':'© OpenStreetMap contributors','license':'ODbL-1.0','licenseUrl':'https://www.openstreetmap.org/copyright','downloadUrls':['https://api.openstreetmap.org/api/0.6/map?bbox=-52.275,-15.955,-52.205,-15.886','https://api.openstreetmap.org/api/0.6/map?bbox=-52.275,-15.886,-52.205,-15.85'],'bounds':[-15.955,-52.275,-15.85,-52.205],'reference':[-15.8941042,-52.2581299],'nodes':[[float(nodes[n].get('lat')),float(nodes[n].get('lon'))] for n in ids],'segments':[[index[a],index[b],length,direction,wid] for a,b,length,direction,wid in raw],'restrictions':restrictions,'wayNames':names,'unsupportedViaWayRestrictions':skipped}
p=Path(__file__).resolve().parents[1]/'assets/entrega/ruas-pontal-aragarcas.json';p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');print('Rede local:',len(ids),'nós,',len(raw),'segmentos,',len(restrictions),'restrições;',p.stat().st_size,'bytes')

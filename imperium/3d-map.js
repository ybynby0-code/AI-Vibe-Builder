import * as THREE from 'https://esm.sh/three@0.180.0';
export class Imperium3DMap{
 constructor(canvas,onSelect){
  this.canvas=canvas;this.onSelect=onSelect;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#102532');this.scene.fog=new THREE.Fog('#102532',28,70);
  this.camera=new THREE.PerspectiveCamera(34,1,.1,120);this.camera.position.set(17,23,25);this.target=new THREE.Vector3(0,0,0);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.scene.add(new THREE.HemisphereLight('#c5e4ed','#263b34',2.0));
  const sun=new THREE.DirectionalLight('#ffe4b5',3.1);sun.position.set(-12,24,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;this.scene.add(sun);
  const fill=new THREE.DirectionalLight('#6fa5c8',1.1);fill.position.set(16,12,-18);this.scene.add(fill);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#123b50',roughness:.72,metalness:.12}));sea.rotation.x=-Math.PI/2;sea.position.y=-.55;sea.receiveShadow=true;this.scene.add(sea);
  this.world=new THREE.Group();this.scene.add(this.world);this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.tiles=[];this.drag=null;this.activePointers=new Map();this.pinchDistance=0;this.yaw=.18;this.pitch=.72;this.distance=27;this.mode='political';this.provinces=[];this.nations=[];this.selected=null;
  this.bind();this.resize();this.animate();
 }
 bind(){
  this.canvas.addEventListener('pointerdown',e=>{this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture?.(e.pointerId);if(this.activePointers.size===1)this.drag={x:e.clientX,y:e.clientY,moved:false};if(this.activePointers.size===2){const a=[...this.activePointers.values()];this.pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);this.drag=null}});
  this.canvas.addEventListener('pointermove',e=>{if(!this.activePointers.has(e.pointerId))return;const prev=this.activePointers.get(e.pointerId);this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.activePointers.size>=2){const a=[...this.activePointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(this.pinchDistance>0){this.distance=Math.max(14,Math.min(58,this.distance-(d-this.pinchDistance)*.07));this.updateCamera()}this.pinchDistance=d;return}if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>3)this.drag.moved=true;if(this.drag.moved){this.yaw-=dx*.006;this.pitch=Math.max(.25,Math.min(1.25,this.pitch+dy*.004));this.drag.x=e.clientX;this.drag.y=e.clientY;this.updateCamera()}});
  const endPointer=e=>{if(this.activePointers.size===1&&this.drag&&!this.drag.moved)this.pick(e);this.activePointers.delete(e.pointerId);this.drag=null;this.pinchDistance=0};
  this.canvas.addEventListener('pointerup',endPointer);this.canvas.addEventListener('pointercancel',endPointer);
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(14,Math.min(58,this.distance+e.deltaY*.035));this.updateCamera()},{passive:false});
  this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('resize',()=>this.resize());
 }
 updateCamera(){const cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);this.camera.position.set(this.target.x+Math.sin(this.yaw)*this.distance*cp,this.target.y+this.distance*sp,this.target.z+Math.cos(this.yaw)*this.distance*cp);this.camera.lookAt(this.target)}
 resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix()}
 color(hex){try{return new THREE.Color(hex||'#657f72')}catch{return new THREE.Color('#657f72')}}
 terrainColor(t){return ({plains:'#849b70',forest:'#386b55',hills:'#9b8b65',coast:'#4c8790',mountain:'#9da5a7',river:'#4d8fa6',desert:'#b89b69'}[t]||'#718b79')}
 scaleColor(value,max,low,high){const t=Math.max(0,Math.min(1,Number(value||0)/Math.max(1,Number(max||1))));const a=new THREE.Color(low),b=new THREE.Color(high);return a.lerp(b,t)}
 provinceColor(p,n,mode){
  if(mode==='terrain'||mode==='relief')return this.color(this.terrainColor(p.terrain));
  if(mode==='population')return this.scaleColor(p.population,160000,'#233e58','#f3d17b');
  if(mode==='development')return this.scaleColor(p.development,10,'#344e5a','#f0c36b');
  if(mode==='fort')return this.scaleColor(p.fort_level,5,'#34434b','#e47c58');
  if(mode==='resources'){const r=p.resources||{},v=Number(r.food||0)+Number(r.iron||0)*1.5+Number(r.oil||0)*2;return this.scaleColor(v,220,'#354b56','#83d4a0')}
  if(mode==='military'){const stationed=this.armies?.filter(a=>String(a.province_id)===String(p.id)).reduce((v,a)=>v+Number(a.infantry||0)+Number(a.armor||0)*8+Number(a.artillery||0)*4,0)||0;return this.scaleColor(stationed,900,'#354b56','#f06e58')}
  return this.color(n?.color||'#718b79')
 }
 makeLabel(text,color='#f3e4bd'){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 28px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#07131dcc';x.fillRect(12,8,232,48);x.fillStyle=color;x.fillText(String(text).slice(0,18),128,32);const tex=new THREE.CanvasTexture(c);const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));m.scale.set(2.2,.55,1);return m}
 update(provinces,nations,armies,mode,selected,zoom=1){
  this.provinces=provinces||[];this.nations=nations||[];this.armies=armies||[];this.mode=mode;this.selected=selected;
  this.world.traverse(o=>{o.geometry?.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.map?.dispose();m.dispose()})}});this.world.clear();
  this.tiles=[];const nationById=new Map(this.nations.map(n=>[String(n.id),n]));
  const items=this.provinces.map(p=>({p,n:nationById.get(String(p.nation_id))})).sort((a,b)=>Number(a.p.province_no)-Number(b.p.province_no));
  // 48 land cells arranged as a recognizable simplified world projection.
  const landRows=['.###....####..','#####..#####..','#####..#####..','.####.####....','..###.####....','...##.##......','..........##..'];
  const landCells=[];for(let row=0;row<landRows.length;row++)for(let col=0;col<landRows[row].length;col++)if(landRows[row][col]==='#')landCells.push({x:col-6.5,z:row-3});
  const displayPos=new Map(items.map(({p},i)=>[String(p.id),landCells[i]||{x:Number(p.x)/2,z:Number(p.y)/2}]));
  const xs=landCells.map(v=>v.x),zs=landCells.map(v=>v.z),cx=0,cz=0;
  const hex=new THREE.Shape();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,x=Math.cos(a)*.91,z=Math.sin(a)*.91;i?hex.lineTo(x,z):hex.moveTo(x,z)}hex.closePath();
  const geometry=new THREE.ExtrudeGeometry(hex,{depth:.23,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.045,bevelThickness:.045});geometry.rotateX(-Math.PI/2);
  for(const {p,n} of items){
   const terrain=p.terrain||'plains',isSelected=String(selected)===String(p.id);const base=this.provinceColor(p,n,mode);
   const mat=new THREE.MeshStandardMaterial({color:this.color(base),roughness:.86,metalness:.02,emissive:isSelected?'#a77b3a':'#000000',emissiveIntensity:isSelected ? 0.28 : 0});
   const point=displayPos.get(String(p.id))||{x:Number(p.x)/2,z:Number(p.y)/2};const x=point.x*1.72,z=point.z*1.72;const height=.18+Math.min(1.15,Number(p.development||1)*.09)+(terrain==='mountain'?.35:terrain==='hills'?.15:0);
   const tile=new THREE.Mesh(geometry,mat);tile.position.set(x,height,z);tile.castShadow=true;tile.receiveShadow=true;tile.userData.province=p;this.world.add(tile);this.tiles.push(tile);
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:isSelected?'#fff0ba':'#d7e3d8',transparent:true,opacity:isSelected ? 0.95 : 0.25}));edge.position.copy(tile.position);this.world.add(edge);
   if(terrain==='mountain'||terrain==='hills'){
    const count=terrain==='mountain'?3:2;for(let k=0;k<count;k++){const h=(terrain==='mountain'?1.0:.48)+((k%2)*.2);const rock=new THREE.Mesh(new THREE.ConeGeometry(terrain==='mountain'?.32:.27,h,5),new THREE.MeshStandardMaterial({color:terrain==='mountain'?'#aab2b4':'#988c72',roughness:1}));rock.position.set(x+(k-1)*.36,height+.24+h/2,z+(k%2-.5)*.26);rock.castShadow=true;this.world.add(rock)}
   }else if(terrain==='forest'){
    for(let k=0;k<4;k++){const tree=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.28,5),new THREE.MeshStandardMaterial({color:'#614a35'}));trunk.position.y=.14;tree.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(.22,.62,5),new THREE.MeshStandardMaterial({color:k%2?'#285b48':'#397253'}));crown.position.y=.52;tree.add(crown);tree.position.set(x+(k%2?-.38:.34),height+.23,z+(k<2?-.3:.34));tree.traverse(o=>{if(o.isMesh)o.castShadow=true});this.world.add(tree)}
   }
   const capital=n&&String(n.capital_province_id||'')===String(p.id);if(capital||Number(p.development)>=4){
    const city=new THREE.Group();const baseCity=new THREE.Mesh(new THREE.CylinderGeometry(.31,.38,.12,8),new THREE.MeshStandardMaterial({color:'#c3a56c',metalness:.35,roughness:.45}));baseCity.position.y=.12;city.add(baseCity);
    for(let b=0;b<(capital?5:3);b++){const bh=.25+(b%3)*.13;const building=new THREE.Mesh(new THREE.BoxGeometry(.16,bh,.16),new THREE.MeshStandardMaterial({color:capital?'#d8c69e':'#aab9b8',roughness:.62}));building.position.set((b%3-1)*.18,.2+bh/2,Math.floor(b/3)*.16-.08);building.castShadow=true;city.add(building)}
    city.position.set(x,height+.28,z);this.world.add(city);
    if(capital){const label=this.makeLabel(n.tag||'CAPITAL');label.position.set(x,height+1.35,z);this.world.add(label)}
   }
   if(isSelected){const ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.035,6,32),new THREE.MeshBasicMaterial({color:'#ffe2a0'}));ring.rotation.x=-Math.PI/2;ring.position.set(x,height+.43,z);this.world.add(ring)}
  }
  const provincePos=new Map(items.map(({p})=>{const q=displayPos.get(String(p.id))||{x:Number(p.x)/2,z:Number(p.y)/2};return [String(p.id),{x:q.x*1.72,z:q.z*1.72}]}));
  const armyGroups=new Map();for(const army of (armies||[])){const pos=provincePos.get(String(army.province_id));if(!pos)continue;const nation=nationById.get(String(army.nation_id));const group=new THREE.Group();const nationColor=nation?.color||'#d9bd7a';
   const chassis=new THREE.Mesh(new THREE.BoxGeometry(.52,.17,.32),new THREE.MeshStandardMaterial({color:'#56645d',metalness:.35,roughness:.65}));chassis.position.y=.12;group.add(chassis);
   const turret=new THREE.Mesh(new THREE.BoxGeometry(.24,.14,.22),new THREE.MeshStandardMaterial({color:'#77877a',metalness:.25,roughness:.6}));turret.position.set(.03,.25,0);group.add(turret);
   const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.32,6),new THREE.MeshStandardMaterial({color:'#303b3b',metalness:.55}));barrel.rotation.z=-Math.PI/2;barrel.position.set(.27,.26,0);group.add(barrel);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.65,5),new THREE.MeshStandardMaterial({color:'#c6b58d'}));pole.position.set(-.25,.42,-.18);group.add(pole);
   const flag=new THREE.Mesh(new THREE.PlaneGeometry(.28,.16),new THREE.MeshStandardMaterial({color:nationColor,side:THREE.DoubleSide,roughness:.8}));flag.position.set(-.12,.61,-.18);group.add(flag);
   group.position.set(pos.x+.38,pos.y+.42,pos.z+.28);group.traverse(o=>{if(o.isMesh)o.castShadow=true});this.world.add(group);
   const total=Number(army.infantry||0)+Number(army.armor||0)*10+Number(army.artillery||0)*5;const label=this.makeLabel((army.name||'ARMY')+' · '+Math.round(total));label.scale.set(2.5,.62,1);label.position.set(pos.x+.38,pos.y+1.25,pos.z+.28);this.world.add(label);
  }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,18),new THREE.MeshStandardMaterial({color:'#234c4e',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.42;ground.receiveShadow=true;this.world.add(ground);
  this.world.scale.setScalar(Math.max(.85,Math.min(2.2,zoom)));this.updateCamera();
 }
 pick(e){const r=this.canvas.getBoundingClientRect();this.pointer.x=((e.clientX-r.left)/r.width)*2-1;this.pointer.y=-((e.clientY-r.top)/r.height)*2+1;this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.tiles,false)[0];if(hit?.object?.userData?.province)this.onSelect?.(hit.object.userData.province)}
 animate(){this.frame=requestAnimationFrame(()=>this.animate());this.renderer.render(this.scene,this.camera)}
 dispose(){cancelAnimationFrame(this.frame);this.renderer.dispose()}
}

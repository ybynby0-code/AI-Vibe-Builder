import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
const scene=new THREE.Scene();scene.background=new THREE.Color(0x080d19);scene.fog=new THREE.Fog(0x080d19,24,90);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,140);camera.position.set(0,1.7,12);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.querySelector("#game").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9bdcff,0x10101d,2));const sun=new THREE.DirectionalLight(0xffffff,2.8);sun.position.set(8,16,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const V='varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vP=p.xyz;gl_Position=projectionMatrix*p;}';
const F='varying vec3 vN;varying vec3 vP;uniform vec3 color;void main(){vec3 n=normalize(vN);vec3 l=normalize(vec3(.4,.9,.5));float d=max(dot(n,l),0.0);float bands=floor(d*4.0)/3.0;float rim=pow(1.0-max(dot(n,normalize(-vP)),0.0),3.0);gl_FragColor=vec4(color*(.38+bands*.62)+rim*vec3(.08,.55,.72),1.0);}';
const mat=c=>new THREE.ShaderMaterial({vertexShader:V,fragmentShader:F,uniforms:{color:{value:new THREE.Color(c)}},side:THREE.DoubleSide});
const assets=[];function mesh(g,c,parent=scene){const m=new THREE.Mesh(g,mat(c));m.castShadow=true;m.receiveShadow=true;parent.add(m);assets.push(m);return m}
function box(w,h,d,c,p){const m=mesh(new THREE.BoxGeometry(w,h,d),c);m.position.set(...p);return m}
const palette=[0x18283d,0x253a55,0x374f68,0x6b2c52,0x143d45,0x4b315e];
for(let i=0;i<24;i++){let x=(i%6-2.5)*7,z=(Math.floor(i/6)-1.5)*7;box(6,.34,6,palette[i%6],[x,-.2,z]);if(i%2===0)box(.5,3,6,palette[(i+1)%6],[x-2.5,1.3,z])}
for(let i=0;i<18;i++){let a=i*Math.PI*2/18;box(.8,1.8,.8,0x63f5ff,[Math.cos(a)*12,.9,Math.sin(a)*12])}
for(let i=0;i<18;i++){let x=(i%6-2.5)*4.5,z=8+Math.floor(i/6)*3;box(.55,.55,2.4,[0xff496c,0x63f5ff,0xffd166][i%3],[x,.8,z])}
for(let i=0;i<12;i++){let x=(i%4-1.5)*5,z=(Math.floor(i/4)-1)*6;box(3,.8,.5,0x1b2b42,[x,.6,z])}
for(let i=0;i<10;i++){let a=i*.62;const m=mesh(new THREE.TorusGeometry(.38,.055,6,12),0x63f5ff);m.position.set(Math.cos(a)*4,1.1,Math.sin(a)*4)}
for(let i=0;i<8;i++){const g=new THREE.Group();mesh(new THREE.CylinderGeometry(.32,.26,1.2,8),i%2?0xff496c:0x62e7ff,g).position.y=.1;mesh(new THREE.CylinderGeometry(.18,.18,.7,8),0xffffff,g).position.y=.9;g.position.set(-10+i*2.8,1,-5);scene.add(g)}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x101827,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);
console.assert(assets.length>=90,"90+ procedural scene meshes");
/* First-person weapon view model */
const weapon=new THREE.Group();camera.add(weapon);scene.add(camera);weapon.position.set(.34,-.3,-.62);
mesh(new THREE.BoxGeometry(.18,.2,.72),0x26384d,weapon).position.set(0,0,0);
mesh(new THREE.BoxGeometry(.13,.16,.32),0x63ddec,weapon).position.set(0,.11,-.08);
mesh(new THREE.BoxGeometry(.12,.28,.16),0x172335,weapon).position.set(0,-.19,.12);
mesh(new THREE.CylinderGeometry(.045,.045,.34,8),0x10151e,weapon).rotation.x=Math.PI/2;
const enemies=[];let kills=0,round=1,ammo=30,reserve=90,hp=100,started=false,reloading=false,damageTimer=0,shotFlash=0,yaw=0,pitch=0,vy=0;const keys={};
function spawnEnemy(i){const g=new THREE.Group();const body=mesh(new THREE.CapsuleGeometry(.38,.92,5,8),i%2?0xff496c:0x63f5ff,g);body.position.y=1.02;const head=mesh(new THREE.SphereGeometry(.25,10,8),0xffd2ae,g);head.position.y=1.78;const pack=mesh(new THREE.BoxGeometry(.48,.5,.22),0x18283d,g);pack.position.set(0,1.05,.28);g.position.set((i%5-2)*4,0,-11-(i%2)*8);g.userData={hp:100,dir:i%2?1:-1,attack:0,base:i};scene.add(g);enemies.push(g)}
for(let i=0;i<5;i++)spawnEnemy(i);
const $=id=>document.getElementById(id);
function hud(){ $("hp").textContent=hp;$("ammo").textContent=ammo+" / "+reserve;$("round").textContent=round;$("blue").textContent=kills;$("red").textContent=Math.max(0,round*5-kills)}
function start(){started=true;$("menu").style.display="none";$("hud").classList.add("on");$("mobile").classList.add("on");renderer.domElement.requestPointerLock?.();hud()}
function reload(){if(reloading||ammo===30||reserve<=0)return;reloading=true;setTimeout(()=>{const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloading=false;hud()},1100)}
function shoot(){if(!started||reloading||ammo<=0)return;if(performance.now()-lastShot<135)return;lastShot=performance.now();ammo--;weapon.position.z=-.52;weapon.rotation.x=-.08;shotFlash=.06;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);const targets=enemies.filter(e=>e.visible);const hit=ray.intersectObjects(targets,true)[0];if(hit){let e=hit.object;while(e.parent&&!e.userData.hp)e=e.parent;if(e.userData.hp){e.userData.hp-=34;if(e.userData.hp<=0){e.visible=false;kills++;if(kills%5===0){round++;reserve=Math.min(180,reserve+30);const fallen=enemies.filter(x=>!x.visible).slice(0,5);fallen.forEach((dead,i)=>{dead.visible=true;dead.userData.hp=100;dead.position.set((i-2)*4,0,-14-(i%2)*5)})}}}}hud()}
let lastShot=0;
function hurt(){if(damageTimer>0)return;damageTimer=.7;hp=Math.max(0,hp-8);if(hp===0){hp=100;camera.position.set(0,1.7,12);yaw=0;pitch=0}hud()}
addEventListener("keydown",e=>{keys[e.code]=1;if(e.code==="KeyR")reload();if(e.code==="Space"&&camera.position.y<=1.71)vy=6});addEventListener("keyup",e=>keys[e.code]=0);
addEventListener("mousedown",e=>{if(e.button===0)shoot()});addEventListener("mousemove",e=>{if(document.pointerLockElement){yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=THREE.MathUtils.clamp(pitch,-1.2,1.2)}});
$("start").onclick=start;$("how").onclick=()=>$("help").classList.toggle("show");$("fire").ontouchstart=e=>{e.preventDefault();shoot()};$("reload").ontouchstart=e=>{e.preventDefault();reload()};$("jump").ontouchstart=e=>{e.preventDefault();if(camera.position.y<=1.71)vy=6};
let stick={x:0,y:0,on:false};const st=$("stick");st.ontouchstart=e=>{const q=e.touches[0];stick={x:q.clientX,y:q.clientY,on:true}};st.ontouchmove=e=>{if(!stick.on)return;const q=e.touches[0],dx=(q.clientX-stick.x)/45,dy=(q.clientY-stick.y)/45;keys.KeyW=dy<-.2;keys.KeyS=dy>.2;keys.KeyA=dx<-.2;keys.KeyD=dx>.2};st.ontouchend=()=>{stick.on=false;["KeyW","KeyS","KeyA","KeyD"].forEach(k=>keys[k]=0)};
let look={x:0,y:0};$("look").ontouchmove=e=>{const q=e.touches[0];if(look.x){yaw-=(q.clientX-look.x)*.006;pitch=THREE.MathUtils.clamp(pitch-(q.clientY-look.y)*.006,-1.2,1.2)}look={x:q.clientX,y:q.clientY}};$("look").ontouchend=()=>look={x:0,y:0};
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);if(started){damageTimer=Math.max(0,damageTimer-dt);weapon.position.z=THREE.MathUtils.lerp(weapon.position.z,-.62,dt*18);weapon.rotation.x=THREE.MathUtils.lerp(weapon.rotation.x,0,dt*15);const v=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(v.length()){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);camera.position.addScaledVector(v,dt*5.5)}vy-=16*dt;camera.position.y+=vy*dt;if(camera.position.y<1.7){camera.position.y=1.7;vy=0}camera.rotation.set(pitch,yaw,0,"YXZ");for(const e of enemies)if(e.visible){e.lookAt(camera.position.x,0,camera.position.z);const d=e.position.distanceTo(camera.position);if(d>2.2)e.translateZ(e.userData.dir*dt*.55);else hurt();e.position.x+=Math.sin(clock.elapsedTime+e.userData.base)*dt*.22}}renderer.render(scene,camera)}loop();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

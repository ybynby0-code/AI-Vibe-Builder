import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* NEON STRIKE — mobile-first tactical FPS prototype */
const $=id=>document.getElementById(id);
const ui={overlay:$("overlay"),menuShell:document.querySelector(".menu-shell"),briefing:$("briefing"),hud:$("hud"),mobile:$("mobile"),pause:$("pause"),result:$("result"),rotate:$("rotateNotice"),controls:$("controlsPanel")};
const isTouch=()=>matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0;
const clamp=THREE.MathUtils.clamp;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101c2b);
scene.fog=new THREE.Fog(0x101c2b,34,92);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.06,130);
camera.position.set(0,1.72,13);
const renderer=new THREE.WebGLRenderer({antialias:!isTouch(),alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch()?1.35:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=!isTouch();
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$("game").appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa9e8ff,0x18202b,2.1));
const sun=new THREE.DirectionalLight(0xffe6c7,3.2);sun.position.set(-12,24,10);sun.castShadow=!isTouch();sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
const fill=new THREE.PointLight(0x38dcd2,24,34);fill.position.set(0,7,-10);scene.add(fill);
const pink=new THREE.PointLight(0xff496d,18,25);pink.position.set(15,5,-2);scene.add(pink);

const toonVertex=`varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*mv;}`;
const toonFragment=`uniform vec3 uColor;uniform vec3 uRim;varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-.45,.82,.36));float d=max(dot(n,l),0.0);float band=d>.72?1.0:(d>.34?.72:.43);float rim=pow(1.0-max(dot(n,normalize(vView)),0.0),2.5);vec3 c=uColor*band+uRim*rim*.72;gl_FragColor=vec4(c,1.0);}`;
function toon(color,rim=0x55e7dc){return new THREE.ShaderMaterial({vertexShader:toonVertex,fragmentShader:toonFragment,uniforms:{uColor:{value:new THREE.Color(color)},uRim:{value:new THREE.Color(rim)}},side:THREE.DoubleSide});}
const mats={
floor:new THREE.MeshStandardMaterial({color:0x26313b,roughness:.92}),
dark:new THREE.MeshStandardMaterial({color:0x111c29,roughness:.8}),
wall:new THREE.MeshStandardMaterial({color:0x354452,roughness:.85}),
concrete:new THREE.MeshStandardMaterial({color:0x59636a,roughness:.9}),
cyan:new THREE.MeshStandardMaterial({color:0x42d9d0,emissive:0x126a68,emissiveIntensity:.8}),
pink:new THREE.MeshStandardMaterial({color:0xff4e70,emissive:0x5b1228,emissiveIntensity:.8}),
gold:new THREE.MeshStandardMaterial({color:0xe8b86e,metalness:.25,roughness:.5})
};
const envMeshes=[];
function addMesh(geo,material,pos,parent=scene,rot=null){const m=new THREE.Mesh(geo,material);m.position.set(...pos);if(rot)m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);envMeshes.push(m);return m;}
function block(w,h,d,mat,x,y,z,parent=scene){return addMesh(new THREE.BoxGeometry(w,h,d),mat,[x,y,z],parent);}
function cylinder(rt,rb,h,mat,x,y,z,parent=scene,segments=10){return addMesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat,[x,y,z],parent);}
function buildMap(){
 const ground=addMesh(new THREE.PlaneGeometry(100,100),mats.floor,[0,-.08,0],scene,[-Math.PI/2,0,0]);ground.receiveShadow=true;
 // Arena perimeter and layered skyline.
 for(let i=0;i<24;i++){const x=(i-11.5)*3.6;block(3.45,5.5,.65,i%3?mats.wall:mats.dark,x,2.7,-27);block(3.45,4.8,.65,mats.dark,x,2.3,27);}
 for(let i=0;i<14;i++){const z=(i-6.5)*3.8;block(.7,5.4,3.7,i%2?mats.wall:mats.dark,-43,2.6,z);block(.7,5.4,3.7,i%2?mats.dark:mats.wall,43,2.6,z);}
 // Tall facade blocks and emissive strips.
 for(let side of [-1,1])for(let i=0;i<5;i++){const x=side*(17+i%2*2),z=-20+i*9;block(7,7,6,i%2?mats.dark:mats.wall,x,3.4,z);block(7.1,.12,6.1,side<0?mats.cyan:mats.pink,x,5.8,z);for(let w=0;w<3;w++)block(.12,2.1,.14,mats.cyan,x-2+w*2,3.3,z+3.08);}
 // Cover blocks, barrels and crates form three lanes.
 for(let i=0;i<24;i++){const lane=i%3, row=Math.floor(i/3);const x=(lane-1)*10+(row%2?2:-2),z=-20+row*5.2;const h=1.15+(i%4)*.18;block(2.5,h,2.1,i%4===0?mats.gold:(i%2?mats.wall:mats.dark),x,h/2,z);block(2.55,.1,2.15,i%2?mats.cyan:mats.pink,x,h+.04,z);}
 // Tactical light pylons, vents, rails, floor markings.
 for(let i=0;i<16;i++){const x=(i%4-1.5)*8,z=12+Math.floor(i/4)*-8;cylinder(.18,.24,2.8,mats.dark,x,1.4,z);cylinder(.25,.25,.14,i%2?mats.cyan:mats.pink,x,2.65,z);}
 for(let i=0;i<20;i++){const x=(i-9.5)*3.5;block(.12,.025,9,mats.cyan,x,.005,0);}
 for(let i=0;i<10;i++){const z=-23+i*5;block(18,.035,.1,mats.gold,0,.012,z);}
 // Detailed machinery and corner objects.
 for(let i=0;i<12;i++){const side=i%2?1:-1,x=side*(7+(i%3)*2),z=-24+Math.floor(i/2)*8;block(.7,1.6,.7,mats.dark,x,.8,z);block(.9,.12,.9,i%3?mats.cyan:mats.pink,x,1.65,z);cylinder(.22,.22,.3,mats.gold,x,1.9,z);}
 for(let i=0;i<12;i++){const x=(i%4-1.5)*6,z=19+Math.floor(i/4)*-4;block(1.4,.35,1.4,mats.dark,x,.2,z);block(1.25,.12,1.25,mats.concrete,x,.44,z);}
 // Scatter stylized rocks / bollards.
 for(let i=0;i<18;i++){const x=Math.sin(i*12.4)*20,z=Math.cos(i*8.7)*22;const r=.3+(i%3)*.15;addMesh(new THREE.DodecahedronGeometry(r,0),i%2?mats.concrete:mats.dark,[x,r*.65,z]);}
 // Spawn point markings.
 for(let i=0;i<6;i++){const x=(i-2.5)*1.5;block(.08,.03,3,mats.cyan,x,.02,18);}
}
buildMap();

const player={hp:100,armor:50,kills:0,shots:0,hits:0,round:1,ammo:25,reserve:100,weapon:0,alive:true};
const weapons=[
 {name:"VANDAL-X",type:"ASSAULT RIFLE",mag:25,damage:42,rate:125,reload:1250,spread:.006},
 {name:"PHANTOM-9",type:"BURST SMG",mag:36,damage:24,rate:75,reload:1050,spread:.012}
];
let gameState="menu",training=false,paused=false,fireHeld=false,reloading=false,lastShot=0,lastDamage=0,roundStart=0,elapsed=0,shotsThisRound=0,hitThisRound=0;
let yaw=0,pitch=0,verticalVelocity=0,grounded=true,dashCooldown=0,fireCooldown=0;
const keys={};const clock=new THREE.Clock();const raycaster=new THREE.Raycaster();raycaster.far=70;
const enemies=[],effects=[],projectiles=[];
const worldBounds={x:20,z:24};
const weaponRig=new THREE.Group();camera.add(weaponRig);scene.add(camera);
function weaponPart(geo,color,pos,scale=null){const m=addMesh(geo,toon(color,0x48e7df),pos,weaponRig);if(scale)m.scale.set(...scale);return m;}
function makeViewWeapon(){weaponRig.clear();weaponRig.position.set(.38,-.32,-.62);weaponRig.rotation.set(0,0,0);
 weaponPart(new THREE.BoxGeometry(.19,.2,.68),0x23374a,[0,0,0]);
 weaponPart(new THREE.BoxGeometry(.15,.13,.34),0x4adbd3,[0,.12,-.1]);
 weaponPart(new THREE.BoxGeometry(.12,.27,.17),0x172431,[0,-.19,.13]);
 weaponPart(new THREE.CylinderGeometry(.045,.045,.4,10),0x111820,[0,.01,-.48]).rotation.x=Math.PI/2;
 weaponPart(new THREE.BoxGeometry(.045,.12,.22),0xd4e4df,[.08,.12,-.18]);
 weaponPart(new THREE.BoxGeometry(.12,.08,.15),0x101b25,[0,-.08,.23]);
}
makeViewWeapon();

function makeAgent(team="red"){
 const root=new THREE.Group();root.userData.hp=100;root.userData.team=team;root.userData.speed=1.4+Math.random()*.5;root.userData.attackTimer=.8+Math.random();root.userData.phase=Math.random()*6;
 const suit=toon(team==="red"?0xc33e59:0x277c84,team==="red"?0xff7890:0x66fff2);
 const dark=toon(0x1b2938,0x68cfc8),skin=toon(0xe6b99b,0xffd4bd),visor= new THREE.MeshStandardMaterial({color:0x152b3b,metalness:.65,roughness:.22,emissive:team==="red"?0x5e1426:0x063f42,emissiveIntensity:.7});
 const torso=addMesh(new THREE.BoxGeometry(.72,.82,.38),suit,[0,1.12,0],root);
 addMesh(new THREE.BoxGeometry(.78,.16,.42),dark,[0,1.53,0],root);
 const chest=addMesh(new THREE.BoxGeometry(.38,.26,.405),dark,[0,1.18,-.015],root);
 addMesh(new THREE.BoxGeometry(.12,.1,.43),team==="red"?mats.pink:mats.cyan,[0,1.2,-.22],root);
 const headGroup=new THREE.Group();headGroup.position.set(0,1.78,0);root.add(headGroup);
 const headMesh=addMesh(new THREE.SphereGeometry(.235,12,10),skin,[0,0,0],headGroup);headMesh.userData.isHead=true;
 addMesh(new THREE.SphereGeometry(.26,10,8,0,Math.PI*2,0,Math.PI*.53),dark,[0,.04,0],headGroup);
 addMesh(new THREE.BoxGeometry(.32,.09,.25),visor,[0,.015,-.208],headGroup);
 const shoulderL=addMesh(new THREE.SphereGeometry(.19,9,8),suit,[-.47,1.43,0],root);
 const shoulderR=addMesh(new THREE.SphereGeometry(.19,9,8),suit,[.47,1.43,0],root);
 const armL=addMesh(new THREE.CapsuleGeometry(.105,.48,4,7),dark,[-.48,1.1,0],root);
 const armR=addMesh(new THREE.CapsuleGeometry(.105,.48,4,7),dark,[.48,1.1,0],root);
 const legL=new THREE.Group();legL.position.set(-.2,.72,0);root.add(legL);addMesh(new THREE.CapsuleGeometry(.13,.48,4,7),dark,[0,-.28,0],legL);addMesh(new THREE.BoxGeometry(.28,.13,.43),suit,[0,-.54,-.08],legL);
 const legR=new THREE.Group();legR.position.set(.2,.72,0);root.add(legR);addMesh(new THREE.CapsuleGeometry(.13,.48,4,7),dark,[0,-.28,0],legR);addMesh(new THREE.BoxGeometry(.28,.13,.43),suit,[0,-.54,-.08],legR);
 addMesh(new THREE.BoxGeometry(.48,.52,.23),dark,[0,1.08,.29],root);
 const ring=addMesh(new THREE.TorusGeometry(.47,.035,5,18),team==="red"?mats.pink:mats.cyan,[0,.045,0],root);ring.rotation.x=Math.PI/2;
 root.userData={...root.userData,head:headGroup,legs:[legL,legR],arms:[armL,armR],ring,phase:Math.random()*6,attackTimer:1+Math.random(),speed:1.1+Math.random()*.65,dead:false};
 return root;
}
function spawnEnemy(i,stationary=false){
 const e=makeAgent("red");const slots=[[-12,-14],[-5,-21],[5,-22],[13,-14],[-14,-5],[14,-5],[-8,1],[8,1]];
 const p=slots[i%slots.length];e.position.set(p[0],0,p[1]);e.userData.stationary=stationary;e.userData.hp=100;e.userData.maxHp=100;e.userData.dead=false;
 scene.add(e);enemies.push(e);return e;
}
function clearEnemies(){for(const e of enemies)scene.remove(e);enemies.length=0;}
function spawnWave(){clearEnemies();const count=training?8:Math.min(4+player.round*2,14);for(let i=0;i<count;i++)spawnEnemy(i,training);player.ammo=weapons[player.weapon].mag;player.reserve=Math.min(240,player.reserve+Math.max(20,player.round*8));reloading=false;updateHUD();showToast(training?"TRAINING LIVE":"ROUND "+String(player.round).padStart(2,"0"));}
function updateHUD(){
 $("round").textContent=String(player.round).padStart(2,"0");$("kills").textContent=String(player.kills).padStart(2,"0");$("wave").textContent=String(enemies.filter(e=>!e.userData.dead).length).padStart(2,"0");
 $("hp").textContent=player.hp;$("armor").textContent=player.armor;$("hpbar").style.width=player.hp+"%";
 $("ammo").textContent=player.ammo;$("reserve").textContent=player.reserve;$("weaponName").textContent=weapons[player.weapon].name;$("weaponType").textContent=weapons[player.weapon].type;
}
function showToast(text){const t=$("toast");t.textContent=text;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),1150);}
function feed(text){const f=document.createElement("div");f.className="feed-item";f.textContent=text;$("killfeed").prepend(f);while($("killfeed").children.length>4)$("killfeed").lastChild.remove();setTimeout(()=>f.remove(),4200);}
function showHit(){const h=$("hitmarker");h.classList.add("show");clearTimeout(showHit.timer);showHit.timer=setTimeout(()=>h.classList.remove("show"),105);}
function spawnTracer(from,to,color=0x8afff4){const geo=new THREE.BufferGeometry().setFromPoints([from,to]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));scene.add(line);effects.push({obj:line,life:.075,max:.075});}
function impact(point,head=false){const m=new THREE.Mesh(new THREE.SphereGeometry(head?.13:.08,8,6),new THREE.MeshBasicMaterial({color:head?0xffdf8b:0x6bfff0}));m.position.copy(point);scene.add(m);effects.push({obj:m,life:.16,max:.16});}
function muzzle(){const flash=new THREE.Mesh(new THREE.SphereGeometry(.09,7,6),new THREE.MeshBasicMaterial({color:0xffe2a0}));const p=new THREE.Vector3(.02,-.01,-.56);weaponRig.localToWorld(p);flash.position.copy(p);scene.add(flash);effects.push({obj:flash,life:.06,max:.06});}
function hitEnemy(hit){
 let obj=hit.object;while(obj&&!obj.userData.team)obj=obj.parent;if(!obj||obj.userData.dead)return;
 const head=!!hit.object.parent?.userData?.isHead||hit.object.userData.isHead;
 const dmg=head?100:weapons[player.weapon].damage;obj.userData.hp-=dmg;player.hits++;hitThisRound++;showHit();impact(hit.point,head);
 if(obj.userData.hp<=0){obj.userData.dead=true;obj.visible=false;player.kills++;feed(head?"HEADSHOT // ENEMY DOWN":"ELIMINATION // ENEMY DOWN");if(player.kills%5===0){player.armor=Math.min(100,player.armor+10);player.reserve=Math.min(240,player.reserve+20);}updateHUD();}
}
function shoot(){
 if(gameState!=="playing"||reloading||player.ammo<=0)return;
 const w=weapons[player.weapon],now=performance.now();if(now-lastShot<w.rate)return;lastShot=now;player.ammo--;player.shots++;shotsThisRound++;
 weaponRig.position.z=-.52;weaponRig.rotation.x=-.055;muzzle();
 camera.updateMatrixWorld();raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 const targets=[];for(const e of enemies)if(!e.userData.dead)targets.push(e);
 const hits=raycaster.intersectObjects(targets,true);
 const origin=new THREE.Vector3();camera.getWorldPosition(origin);
 const dir=new THREE.Vector3();camera.getWorldDirection(dir);
 const end=hits.length?hits[0].point:origin.clone().addScaledVector(dir,55);
 spawnTracer(origin.clone().add(new THREE.Vector3(.22,-.18,0)),end);
 if(hits.length)hitEnemy(hits[0]);updateHUD();
 if(player.ammo===0&&player.reserve>0)showToast("RELOAD");
}
function reload(){
 if(gameState!=="playing"||reloading||player.ammo===weapons[player.weapon].mag||player.reserve<=0)return;
 reloading=true;showToast("RELOADING");const duration=weapons[player.weapon].reload;
 setTimeout(()=>{if(gameState!=="playing"){reloading=false;return;}const need=weapons[player.weapon].mag-player.ammo;const take=Math.min(need,player.reserve);player.ammo+=take;player.reserve-=take;reloading=false;updateHUD();},duration);
}
function switchWeapon(){if(gameState!=="playing")return;player.weapon=1-player.weapon;player.ammo=Math.min(player.ammo,weapons[player.weapon].mag);makeViewWeapon();updateHUD();showToast(weapons[player.weapon].name);}
function dash(){if(gameState!=="playing"||dashCooldown>0)return;const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();camera.position.addScaledVector(dir,3.3);dashCooldown=5;showToast("DASH");}
function damagePlayer(amount){if(performance.now()-lastDamage<750||gameState!=="playing")return;lastDamage=performance.now();let d=amount;if(player.armor>0){const absorbed=Math.min(player.armor,Math.ceil(d*.55));player.armor-=absorbed;d-=absorbed;}player.hp=Math.max(0,player.hp-d);$("damageFlash").classList.add("show");setTimeout(()=>$("damageFlash").classList.remove("show"),140);updateHUD();if(player.hp<=0)finish(false);}
function finish(win){gameState="result";fireHeld=false;const secs=Math.floor((performance.now()-roundStart)/1000);$("resultEyebrow").textContent=win?"MISSION COMPLETE":"MISSION FAILED";$("resultTitle").textContent=win?"ROUND CLEAR":"OPERATOR DOWN";$("resultKills").textContent=player.kills;$("resultAccuracy").textContent=(player.shots?Math.round(player.hits/player.shots*100):0)+"%";$("resultTime").textContent=String(Math.floor(secs/60)).padStart(2,"0")+":"+String(secs%60).padStart(2,"0");$("nextBtn").textContent=win?"다음 라운드 →":"다시 도전 →";ui.result.classList.remove("hidden");}
function enterFullscreen(){if(!isTouch())return;const p=document.documentElement.requestFullscreen?.();if(p&&typeof p.then==="function")p.then(()=>{const lock=screen.orientation?.lock?.("landscape");lock?.catch?.(()=>{});}).catch(()=>{});}
function startGame(isTraining=false){
 enterFullscreen();training=isTraining;player.hp=100;player.armor=50;player.kills=0;player.round=1;player.weapon=0;player.ammo=25;player.reserve=100;player.shots=0;player.hits=0;shotsThisRound=0;hitThisRound=0;yaw=0;pitch=0;camera.position.set(0,1.72,13);camera.rotation.set(0,0,0);makeViewWeapon();spawnWave();roundStart=performance.now();gameState="playing";paused=false;ui.overlay.classList.add("hidden");ui.pause.classList.add("hidden");ui.result.classList.add("hidden");ui.hud.classList.remove("hidden");if(isTouch())ui.mobile.classList.remove("hidden");else renderer.domElement.requestPointerLock?.();if(isTouch()&&innerWidth<innerHeight){ui.rotate.classList.remove("hidden");ui.rotate.classList.add("show");}}
function nextRound(){player.round++;player.hp=100;player.armor=Math.min(100,player.armor+15);camera.position.set(0,1.72,13);spawnWave();roundStart=performance.now();gameState="playing";ui.result.classList.add("hidden");}
function backToMenu(){gameState="menu";clearEnemies();ui.hud.classList.add("hidden");ui.mobile.classList.add("hidden");ui.pause.classList.add("hidden");ui.controls.classList.add("hidden");ui.result.classList.add("hidden");ui.overlay.classList.remove("hidden");ui.menuShell.classList.remove("hidden");ui.briefing.classList.add("hidden");document.exitPointerLock?.();}
function pauseGame(){if(gameState!=="playing")return;gameState="paused";fireHeld=false;ui.pause.classList.remove("hidden");}
function resumeGame(){if(gameState!=="paused")return;gameState="playing";ui.pause.classList.add("hidden");if(!isTouch())renderer.domElement.requestPointerLock?.();}
$("playBtn").onclick=()=>{ui.menuShell.classList.add("hidden");ui.briefing.classList.remove("hidden");$("briefTitle").textContent="작전 투입";$("briefText").textContent="적 요원을 제거하고 라운드를 돌파하십시오. 머리를 정확히 맞히면 한 발로 제압할 수 있습니다.";};
$("deployBtn").onclick=()=>{ui.briefing.classList.add("hidden");startGame(false);};
$("trainingBtn").onclick=()=>startGame(true);
$("resumeBtn").onclick=resumeGame;$("restartBtn").onclick=()=>startGame(training);$("menuBtn").onclick=backToMenu;
$("nextBtn").onclick=()=>{if(player.hp<=0)startGame(training);else nextRound();};$("resultMenuBtn").onclick=backToMenu;
$("rotateContinue").onclick=()=>{ui.rotate.classList.remove("show");ui.rotate.classList.add("hidden");};
$("btnReload").onclick=reload;$("btnSwitch").onclick=switchWeapon;$("btnSkill").onclick=dash;
$("btnJump").onclick=()=>{if(grounded&&gameState==="playing"){verticalVelocity=6.3;grounded=false;}};
$("btnFire").addEventListener("pointerdown",e=>{e.preventDefault();fireHeld=true;shoot();$("btnFire").setPointerCapture(e.pointerId);});
const stopFire=()=>fireHeld=false;$("btnFire").addEventListener("pointerup",stopFire);$("btnFire").addEventListener("pointercancel",stopFire);$("btnFire").addEventListener("lostpointercapture",stopFire);
$("controlsBtn").onclick=()=>ui.controls.classList.remove("hidden");$("closeControls").onclick=()=>ui.controls.classList.add("hidden");$("btnPause").onclick=pauseGame;

addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Escape"){if(gameState==="playing")pauseGame();else if(gameState==="paused")resumeGame();}if(e.code==="KeyR")reload();if(e.code==="KeyQ")dash();if(e.code==="Digit1")switchWeapon();if(e.code==="Space"&&grounded&&gameState==="playing"){verticalVelocity=6.3;grounded=false;}});
addEventListener("keyup",e=>keys[e.code]=false);
renderer.domElement.addEventListener("click",()=>{if(!isTouch()&&gameState==="playing"&&!document.pointerLockElement)renderer.domElement.requestPointerLock?.();});
addEventListener("mousemove",e=>{if(document.pointerLockElement&&gameState==="playing"){yaw-=e.movementX*.0022;pitch=clamp(pitch-e.movementY*.0022,-1.18,1.18);}});
addEventListener("mousedown",e=>{if(e.button===0&&gameState==="playing"&&!isTouch()){fireHeld=true;shoot();}});
addEventListener("mouseup",()=>{if(!isTouch())fireHeld=false;});

const joystick=$("joystick"),knob=joystick.querySelector(".joy-knob");
let joyPointer=null,joyOrigin={x:0,y:0},moveInput={x:0,y:0};
joystick.addEventListener("pointerdown",e=>{e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);const r=joystick.getBoundingClientRect();joyOrigin={x:r.left+r.width/2,y:r.top+r.height/2};updateJoy(e);});
function updateJoy(e){const dx=e.clientX-joyOrigin.x,dy=e.clientY-joyOrigin.y,len=Math.hypot(dx,dy),max=43,k=Math.min(1,max/(len||1));const x=dx*k,y=dy*k;knob.style.left="calc(50% + "+x+"px)";knob.style.top="calc(50% + "+y+"px)";moveInput={x:x/max,y:y/max};}
joystick.addEventListener("pointermove",e=>{if(e.pointerId===joyPointer)updateJoy(e);});
function endJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;moveInput={x:0,y:0};knob.style.left="50%";knob.style.top="50%";}
joystick.addEventListener("pointerup",endJoy);joystick.addEventListener("pointercancel",endJoy);joystick.addEventListener("lostpointercapture",endJoy);
const lookZone=$("lookZone");let lookPointer=null,lastLook={x:0,y:0};
lookZone.addEventListener("pointerdown",e=>{if(gameState!=="playing"||lookPointer!==null)return;lookPointer=e.pointerId;lookZone.setPointerCapture(e.pointerId);lastLook={x:e.clientX,y:e.clientY};});
lookZone.addEventListener("pointermove",e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lastLook.x,dy=e.clientY-lastLook.y;yaw-=dx*.0042;pitch=clamp(pitch-dy*.0042,-1.18,1.18);lastLook={x:e.clientX,y:e.clientY};});
function endLook(e){if(e.pointerId===lookPointer)lookPointer=null;}
lookZone.addEventListener("pointerup",endLook);lookZone.addEventListener("pointercancel",endLook);lookZone.addEventListener("lostpointercapture",endLook);

function updateEnemies(dt,time){
 let living=0;
 for(const e of enemies){if(e.userData.dead)continue;living++;const delta=new THREE.Vector3(camera.position.x-e.position.x,0,camera.position.z-e.position.z);const dist=delta.length();if(!e.userData.stationary&&dist>5){delta.normalize();e.position.addScaledVector(delta,e.userData.speed*dt);}e.lookAt(camera.position.x,0,camera.position.z);const moving=dist>5&&!e.userData.stationary;const swing=Math.sin(time*7+e.userData.phase)*.55*(moving?1:.12);e.userData.legs[0].rotation.x=swing;e.userData.legs[1].rotation.x=-swing;e.userData.arms[0].rotation.x=-.25+swing*.35;e.userData.arms[1].rotation.x=-.25-swing*.35;
  e.userData.attackTimer-=dt;if(e.userData.attackTimer<=0&&dist<19){e.userData.attackTimer=1.5+Math.random()*.8;const chance=dist<8?.5:.22;if(Math.random()<chance)damagePlayer(dist<8?10:6);}
 }
 $("wave").textContent=String(living).padStart(2,"0");
 if(living===0&&gameState==="playing"){if(training){spawnWave();}else{gameState="roundclear";setTimeout(()=>{if(gameState==="roundclear")finish(true);},650);}}
}
function updatePlayer(dt){
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 let x=moveInput.x+(keys.KeyD?1:0)-(keys.KeyA?1:0),z=-moveInput.y+(keys.KeyW?1:0)-(keys.KeyS?1:0);
 const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
 const speed=(keys.ShiftLeft||keys.ShiftRight)?8.2:5.2;
 camera.position.addScaledVector(right,x*speed*dt);camera.position.addScaledVector(forward,z*speed*dt);
 camera.position.x=clamp(camera.position.x,-worldBounds.x,worldBounds.x);camera.position.z=clamp(camera.position.z,-worldBounds.z,worldBounds.z);
 verticalVelocity-=17*dt;camera.position.y+=verticalVelocity*dt;if(camera.position.y<=1.72){camera.position.y=1.72;verticalVelocity=0;grounded=true;}
 camera.rotation.order="YXZ";camera.rotation.set(pitch,yaw,0);
 const moving=len>.08;weaponRig.position.x=THREE.MathUtils.lerp(weaponRig.position.x,.38+(moving?Math.sin(performance.now()*.012)*.012:0),dt*9);
 weaponRig.position.y=THREE.MathUtils.lerp(weaponRig.position.y,-.32+(moving?Math.abs(Math.sin(performance.now()*.012))*.012:0),dt*9);
 weaponRig.position.z=THREE.MathUtils.lerp(weaponRig.position.z,-.62,dt*15);weaponRig.rotation.x=THREE.MathUtils.lerp(weaponRig.rotation.x,0,dt*13);
 dashCooldown=Math.max(0,dashCooldown-dt);
}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){scene.remove(e.obj);e.obj.geometry?.dispose();e.obj.material?.dispose();effects.splice(i,1);}else if(e.obj.material)e.obj.material.opacity=e.life/e.max;}}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;
 if(gameState==="playing"){updatePlayer(dt);updateEnemies(dt,time);if(fireHeld)shoot();}
 updateEffects(dt);
 if(fill){fill.intensity=22+Math.sin(time*1.4)*3;}
 renderer.render(scene,camera);
}
animate();
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch()?1.35:1.75));renderer.setSize(innerWidth,innerHeight);if(isTouch()&&gameState==="playing"&&innerWidth>innerHeight){ui.rotate.classList.remove("show");ui.rotate.classList.add("hidden");}}
addEventListener("resize",resize);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&gameState==="playing")pauseGame();});
document.addEventListener("contextmenu",e=>e.preventDefault());
document.addEventListener("gesturestart",e=>e.preventDefault());
console.info("NEON STRIKE ready | procedural environment meshes:",envMeshes.length);

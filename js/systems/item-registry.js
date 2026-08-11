import * as THREE from "../../vendor/three.module.min.js";
import {localizeItem} from "./item-localization.js";

const registry=new Map();

export function registerItem(id,factory){if(typeof id!=="string"||!id.trim())throw new TypeError("L’objet doit avoir un identifiant.");if(typeof factory!=="function")throw new TypeError(`Fabrique invalide pour ${id}.`);if(registry.has(id))throw new Error(`Objet déjà enregistré : ${id}`);registry.set(id,factory);}
export function hasItem(id){return registry.has(id);}
export function listItemTypes(){return[...registry.keys()];}
export function createItem(id,overrides={}){const factory=registry.get(id);if(!factory)throw new Error(`Type d’objet inconnu : ${id}`);const object=factory(overrides);object.userData={interactable:true,type:id,id,...object.userData,...overrides.userData};return localizeItem(object);}

export function expandObjectRules(entries=[]){
  const expanded=[];
  for(const rule of entries){
    const quantity=Math.max(0,Math.floor(rule.quantity??1)),placement=rule.placement??rule,from=Number(placement.from??placement.progress??.5),to=Number(placement.to??placement.progress??from),laterals=Array.isArray(placement.lateral)?placement.lateral:[Number(placement.lateral??0)];
    for(let index=0;index<quantity;index++){const ratio=quantity===1?0:index/(quantity-1),progress=Number.isFinite(from)&&Number.isFinite(to)?from+(to-from)*ratio:.5,lateral=Number(laterals[index%laterals.length]??0),height=Number(placement.height??rule.height??.05);expanded.push(Object.freeze({type:rule.id,index,instanceId:`${rule.id}:${index}`,strategy:placement.strategy??"route",progress:Math.max(0,Math.min(1,progress)),lateral:Number.isFinite(lateral)?lateral:0,height:Number.isFinite(height)?height:.05,rotation:Number(placement.rotation??progress*Math.PI)||0}));}
  }
  return expanded;
}

function rabbit(){const group=new THREE.Group(),fur=new THREE.MeshStandardMaterial({color:0xcc9977,roughness:1}),dark=new THREE.MeshStandardMaterial({color:0x17120f}),body=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),fur),head=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),fur),ear1=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.13,6,8),fur),ear2=ear1.clone(),eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,8),dark);body.scale.set(.9,1.15,.8);body.position.y=.13;head.position.y=.3;ear1.position.set(-.04,.45,0);ear1.rotation.z=.2;ear2.position.set(.045,.43,0);ear2.rotation.z=-.45;eye.position.set(-.03,.32,.082);group.add(body,head,ear1,ear2,eye);group.scale.setScalar(1.15);group.rotation.y=.25;group.userData={icon:"🐰",powered:false,fried:false};return group;}
function battery(){const object=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.27,16),new THREE.MeshStandardMaterial({color:0xe3cf36,metalness:.75,roughness:.28,emissive:0x332b00}));object.rotation.z=Math.PI/2;object.userData={icon:"🔋"};return object;}
function book(color){return()=>{const object=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.4),new THREE.MeshStandardMaterial({color,roughness:.9}));object.userData={icon:"📖"};return object;};}
function bottle(sips){return()=>{const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:sips>2?0x2979ff:0x66ccff,transparent:true,opacity:.58,roughness:.15,metalness:.55}),body=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.18,16),material),neck=new THREE.Mesh(new THREE.CylinderGeometry(.015,.04,.05,16),material),cap=new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,.02,16),new THREE.MeshStandardMaterial({color:0x090909}));neck.position.y=.115;cap.position.y=.15;group.add(body,neck,cap);group.rotation.z=Math.PI/2;group.userData={icon:"💧",sips};return group;};}
function artifact(){const object=new THREE.Mesh(new THREE.TetrahedronGeometry(.13),new THREE.MeshStandardMaterial({color:0x111111,metalness:1,roughness:.2,emissive:0xffdf35,emissiveIntensity:1.2}));object.add(new THREE.PointLight(0xffdf35,1.5,3.5));object.userData={icon:"🔮"};return object;}

registerItem("plush",rabbit);
registerItem("battery",battery);
registerItem("book_red",book(0x5a1818));
registerItem("book_green",book(0x185a25));
registerItem("book_blue",book(0x18305a));
registerItem("book_white",book(0xdddddd));
registerItem("water_half",bottle(2));
registerItem("water_full",bottle(4));
registerItem("artifact",artifact);

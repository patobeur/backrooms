import * as THREE from "../../vendor/three.module.min.js";
import {localizeItem} from "./item-localization.js";
import {WATER_BOTTLE_TYPE,createWaterBottleContainer,isWaterBottleType,normalizeWaterBottleData} from "./item-unit-migration.js";
import {MEDICINE_KINDS,createMedicineBlister} from "./consumable-use.js";
import {createMagazine,createPistol} from "./firearm-state.js";

const registry=new Map();

export function registerItem(id,factory){if(typeof id!=="string"||!id.trim())throw new TypeError("L’objet doit avoir un identifiant.");if(typeof factory!=="function")throw new TypeError(`Fabrique invalide pour ${id}.`);if(registry.has(id))throw new Error(`Objet déjà enregistré : ${id}`);registry.set(id,factory);}
export function hasItem(id){return registry.has(id);}
export function listItemTypes(){return[...registry.keys()];}
export function createItem(id,overrides={}){const factory=registry.get(id);if(!factory)throw new Error(`Type d’objet inconnu : ${id}`);const object=factory(overrides),sourceData={interactable:true,type:id,id,...object.userData,...overrides.userData};object.userData=isWaterBottleType(id)?normalizeWaterBottleData(id,sourceData):sourceData;if(object.userData.type===WATER_BOTTLE_TYPE)applyWaterBottleAppearance(object);return localizeItem(object);}

export function expandObjectRules(entries=[]){
  const expanded=[];
  for(const rule of entries){
    const quantity=Math.max(0,Math.floor(rule.quantity??1)),placement=rule.placement??rule,from=Number(placement.from??placement.progress??.5),to=Number(placement.to??placement.progress??from),laterals=Array.isArray(placement.lateral)?placement.lateral:[Number(placement.lateral??0)];
    for(let index=0;index<quantity;index++){const ratio=quantity===1?0:index/(quantity-1),progress=Number.isFinite(from)&&Number.isFinite(to)?from+(to-from)*ratio:.5,lateral=Number(laterals[index%laterals.length]??0),height=Number(placement.height??rule.height??.05),instanceId=rule.instanceId?quantity===1?rule.instanceId:`${rule.instanceId}:${index}`:`${rule.id}:${index}`;expanded.push(Object.freeze({type:rule.id,index,instanceId,strategy:placement.strategy??"route",progress:Math.max(0,Math.min(1,progress)),lateral:Number.isFinite(lateral)?lateral:0,height:Number.isFinite(height)?height:.05,rotation:Number(placement.rotation??progress*Math.PI)||0,userData:Object.freeze({...rule.userData})}));}
  }
  return expanded;
}

function rabbit(){const group=new THREE.Group(),fur=new THREE.MeshStandardMaterial({color:0xcc9977,roughness:1}),dark=new THREE.MeshStandardMaterial({color:0x17120f}),body=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),fur),head=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),fur),ear1=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.13,6,8),fur),ear2=ear1.clone(),eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,8),dark);for(const part of[body,head,ear1,ear2])part.userData.plushPart="fur";eye.userData.plushPart="eye";body.scale.set(.9,1.15,.8);body.position.y=.13;head.position.y=.3;ear1.position.set(-.04,.45,0);ear1.rotation.z=.2;ear2.position.set(.045,.43,0);ear2.rotation.z=-.45;eye.position.set(-.03,.32,.082);group.add(body,head,ear1,ear2,eye);group.scale.setScalar(1.15);group.rotation.y=.25;group.userData={icon:"🐰",powerState:"empty",powered:false,fried:false,batteryExtracted:false,containedBattery:null,guideTriggered:false};return group;}
function battery(){const object=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.27,16),new THREE.MeshStandardMaterial({color:0xe3cf36,metalness:.75,roughness:.28,emissive:0x332b00}));object.rotation.z=Math.PI/2;object.userData={icon:"🔋",energy:{capacity:100,charge:100,unitKind:"electric-charge",rechargeable:false}};return object;}
function book(color){return()=>{const object=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.4),new THREE.MeshStandardMaterial({color,roughness:.9}));object.userData={icon:"📖"};return object;};}
function bottle(){return()=>{const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x2979ff,transparent:true,opacity:.58,roughness:.15,metalness:.55}),body=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.18,16),material),neck=new THREE.Mesh(new THREE.CylinderGeometry(.015,.04,.05,16),material),cap=new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,.02,16),new THREE.MeshStandardMaterial({color:0x090909}));body.userData.bottlePart=true;neck.userData.bottlePart=true;neck.position.y=.115;cap.position.y=.15;group.add(body,neck,cap);group.rotation.z=Math.PI/2;group.userData={icon:"💧",container:createWaterBottleContainer()};return group;};}
export function applyWaterBottleAppearance(object){const units=object?.userData?.container?.units??0,capacity=Math.max(1,object?.userData?.container?.capacity??4),ratio=units/capacity;object.userData.icon=units>0?"💧":"🫙";object.traverse(child=>{if(!child.userData.bottlePart||!child.material)return;child.material.transparent=true;child.material.opacity=units>0?.36+ratio*.22:.15;child.material.color?.setHex(units>0?(ratio>.5?0x2979ff:0x66ccff):0xaaaaaa);});return object;}
function medicineBlister(){const object=new THREE.Mesh(new THREE.BoxGeometry(.22,.025,.38),new THREE.MeshStandardMaterial({color:0xb8bec4,metalness:.7,roughness:.32}));object.rotation.z=.08;object.userData={icon:"💊",medicineKind:MEDICINE_KINDS.ANALGESIC,container:createMedicineBlister({medicineKind:MEDICINE_KINDS.ANALGESIC})};return object;}
function magazine9mm(){const object=new THREE.Mesh(new THREE.BoxGeometry(.12,.27,.07),new THREE.MeshStandardMaterial({color:0x242526,metalness:.82,roughness:.3})),magazine=createMagazine({instanceId:"unassigned-magazine"});object.userData={icon:"▥",caliber:magazine.caliber,container:magazine.container};return object;}
function pistol9mm(overrides={}){const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x292b2c,metalness:.85,roughness:.28}),slide=new THREE.Mesh(new THREE.BoxGeometry(.38,.1,.1),metal),grip=new THREE.Mesh(new THREE.BoxGeometry(.11,.25,.09),metal);grip.position.set(.1,-.15,0);grip.rotation.z=-.18;group.add(slide,grip);group.userData={icon:"◈",firearm:createPistol({instanceId:overrides.userData?.instanceId??"unassigned-pistol"})};return group;}
function artifact(){const object=new THREE.Mesh(new THREE.TetrahedronGeometry(.13),new THREE.MeshStandardMaterial({color:0x111111,metalness:1,roughness:.2,emissive:0xffdf35,emissiveIntensity:1.2}));object.add(new THREE.PointLight(0xffdf35,1.5,3.5));object.userData={icon:"🔮"};return object;}

registerItem("plush",rabbit);
registerItem("battery",battery);
registerItem("book_red",book(0x5a1818));
registerItem("book_green",book(0x185a25));
registerItem("book_blue",book(0x18305a));
registerItem("book_white",book(0xdddddd));
registerItem(WATER_BOTTLE_TYPE,bottle());
registerItem("water_half",bottle());
registerItem("water_full",bottle());
registerItem("water_empty",bottle());
registerItem("medicine_blister",medicineBlister);
registerItem("magazine_9mm",magazine9mm);
registerItem("pistol_9mm",pistol9mm);
registerItem("artifact",artifact);

import * as THREE from "../../vendor/three.module.min.js";
import {createItem} from "./item-registry.js";
import {normalizeBatteryData,normalizePlushPowerData} from "./item-power-state.js";
import {applyFriedPlushAppearance} from "./item-appearance.js";

export function snapshotItem(object){const{name,description,...persistentData}=object.userData;return Object.freeze({type:object.userData.type,userData:Object.freeze(persistentData),position:Object.freeze(object.position.toArray()),rotation:Object.freeze([object.rotation.x,object.rotation.y,object.rotation.z,object.rotation.order]),scale:Object.freeze(object.scale.toArray())});}

export function restoreItem(snapshot){const restoredData=snapshot.type==="plush"?normalizePlushPowerData(snapshot.userData):snapshot.type==="battery"?normalizeBatteryData(snapshot.userData):{...snapshot.userData},object=createItem(snapshot.type,{userData:restoredData});object.position.fromArray(snapshot.position);object.rotation.set(...snapshot.rotation);object.scale.fromArray(snapshot.scale);if(snapshot.type==="plush"&&restoredData.powered){if(restoredData.fried)applyFriedPlushAppearance(object);else{const glow=new THREE.PointLight(0xffd84a,.55,2.4,2);glow.userData.powerIndicator=true;object.add(glow);}}return object;}

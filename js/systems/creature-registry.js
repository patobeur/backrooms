import * as THREE from "../../vendor/three.module.min.js";
import {findMazePath} from "../maze.js";
import {disposeObjectTree} from "./resource-disposal.js";

const registry=new Map();
export function registerCreature(id,factory){if(registry.has(id))throw new Error(`Créature déjà enregistrée : ${id}`);if(typeof factory!=="function")throw new TypeError(`Fabrique invalide pour ${id}`);registry.set(id,factory);}
export function listCreatureTypes(){return[...registry.keys()];}
export function createCreature(id){const factory=registry.get(id);if(!factory)throw new Error(`Type de créature inconnu : ${id}`);const object=factory();object.userData={...object.userData,creatureType:id};return object;}

function watcher(){const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0x010101,fog:true}),body=new THREE.Mesh(new THREE.CapsuleGeometry(.22,1.35,6,10),material),head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),material),armGeometry=new THREE.CapsuleGeometry(.055,1.35,4,8),leftArm=new THREE.Mesh(armGeometry,material),rightArm=leftArm.clone();body.position.y=1.05;body.scale.set(.72,1,.48);head.position.set(0,2.02,0);head.rotation.z=.16;leftArm.position.set(-.28,1.05,0);leftArm.rotation.z=.08;rightArm.position.set(.28,1.05,0);rightArm.rotation.z=-.08;group.add(body,head,leftArm,rightArm);return group;}
registerCreature("watcher",watcher);

export class CreatureManager{
  constructor(scene,{audio=null}={}){this.scene=scene;this.audio=audio;this.instances=[];this.nextSpawn=new Map();this.raycaster=new THREE.Raycaster();this.look=new THREE.Vector3();this.toward=new THREE.Vector3();this.origin=new THREE.Vector3();this.target=new THREE.Vector3();this.direction=new THREE.Vector3();}
  syncLoaded(levelNumbers){const loaded=new Set(levelNumbers);for(let index=this.instances.length-1;index>=0;index--)if(!loaded.has(this.instances[index].level)){this.#remove(index);}for(const level of [...this.nextSpawn.keys()])if(!loaded.has(level))this.nextSpawn.delete(level);}
  #schedule(level,config,now){const spawn=config.spawn??{},minimum=Number(spawn.minDelay??45),maximum=Math.max(minimum,Number(spawn.maxDelay??90));this.nextSpawn.set(level,now+(minimum+Math.random()*(maximum-minimum))*1000);}
  #visible(origin,target,walls){this.origin.copy(origin);this.target.copy(target);this.direction.subVectors(this.target,this.origin);this.raycaster.far=this.direction.length();this.raycaster.set(this.origin,this.direction.normalize());return this.raycaster.intersectObjects(walls,false).length===0;}
  #spawn(level,definition,maze,camera,walls,now){const spawn=definition.spawn??{},route=findMazePath(maze,camera.position.x,camera.position.z),minimum=Number(spawn.minDistance??13),maximum=Number(spawn.maxDistance??29);for(let index=route.length-1;index>=1;index--){const point=route[index],distance=Math.hypot(point.x-camera.position.x,point.z-camera.position.z);if(distance<minimum||distance>maximum)continue;this.origin.set(camera.position.x,1.55,camera.position.z);this.target.set(point.x,1.55,point.z);if(!this.#visible(this.origin,this.target,walls))continue;const object=createCreature(definition.type);object.position.set(point.x,0,point.z);object.lookAt(camera.position.x,1.1,camera.position.z);this.scene.add(object);const instance={level,definition,object,spawnedAt:now,seenAt:0,path:[],waypoint:0};this.instances.push(instance);if(definition.sound)this.audio?.playEvent(definition.sound,{x:point.x,y:1,z:point.z});return instance;}return null;}
  #remove(index){const instance=this.instances[index];instance.object.parent?.remove(instance.object);disposeObjectTree(instance.object);this.instances.splice(index,1);}
  update({now,dt,level,config=[],maze,camera,walls=[]}){
    const definitions=Array.isArray(config)?config:[];if(!this.nextSpawn.has(level))this.#schedule(level,definitions[0]??{},now);
    const active=this.instances.filter(instance=>instance.level===level),due=now>=(this.nextSpawn.get(level)??Infinity);if(due&&definitions.length){const definition=definitions[Math.floor(Math.random()*definitions.length)],count=active.filter(instance=>instance.definition.type===definition.type).length;if(count<(definition.maxAlive??1))this.#spawn(level,definition,maze,camera,walls,now);this.#schedule(level,definition,now);}
    camera.getWorldDirection(this.look);
    for(let index=this.instances.length-1;index>=0;index--){const instance=this.instances[index];if(instance.level!==level)continue;const definition=instance.definition,perception=definition.perception??{},distance=this.toward.copy(instance.object.position).sub(camera.position).length(),alignment=this.look.dot(this.toward.normalize()),watched=alignment>Number(perception.alignment??.965)&&this.#visible(camera.position,instance.object.position,walls);if(watched){if(!instance.seenAt)instance.seenAt=now;if(now-instance.seenAt>Number(perception.watchMs??450)){this.#remove(index);this.#schedule(level,definition,now);continue;}}else instance.seenAt=0;
      if(definition.behavior==="stalker"&&!watched&&definition.speed>0&&distance>Number(perception.stopDistance??2.2)){if(!instance.path.length||instance.waypoint>=instance.path.length)instance.path=findMazePath(maze,instance.object.position.x,instance.object.position.z,camera.position.x,camera.position.z),instance.waypoint=1;const target=instance.path[instance.waypoint];if(target){const dx=target.x-instance.object.position.x,dz=target.z-instance.object.position.z,length=Math.hypot(dx,dz);if(length<.15)instance.waypoint++;else{const step=Math.min(length,definition.speed*dt);instance.object.position.x+=dx/length*step;instance.object.position.z+=dz/length*step;instance.object.lookAt(camera.position.x,1.1,camera.position.z);}}}
      if(now-instance.spawnedAt>Number(definition.spawn?.duration??8)*1000){this.#remove(index);this.#schedule(level,definition,now);}
    }
  }
  clear(){for(let index=this.instances.length-1;index>=0;index--)this.#remove(index);this.nextSpawn.clear();}
}

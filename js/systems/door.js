import * as THREE from "../../vendor/three.module.min.js";

export const HINGE_SIDES=Object.freeze({LEFT:"left",RIGHT:"right"});
export const SWING_DIRECTIONS=Object.freeze({INWARD:"inward",OUTWARD:"outward"});
export const DOOR_ACTIONS=Object.freeze({OPEN:"OUVRIR",CLOSE:"FERMER"});

function positive(value,label){const number=Number(value);if(!Number.isFinite(number)||number<=0)throw new TypeError(`${label} doit être un nombre positif.`);return number;}
function choice(value,values,label){if(!values.includes(value))throw new TypeError(`${label} invalide : ${value}`);return value;}

export function createDoorAssembly({
  width=1.15,
  height=2.2,
  thickness=.09,
  frameThickness=.12,
  frameDepth=.16,
  hingeSide=HINGE_SIDES.LEFT,
  swingDirection=SWING_DIRECTIONS.INWARD,
  frameMaterial,
  panelMaterial,
  threshold=false,
}={}){
  width=positive(width,"width");height=positive(height,"height");thickness=positive(thickness,"thickness");frameThickness=positive(frameThickness,"frameThickness");frameDepth=positive(frameDepth,"frameDepth");
  hingeSide=choice(hingeSide,Object.values(HINGE_SIDES),"hingeSide");swingDirection=choice(swingDirection,Object.values(SWING_DIRECTIONS),"swingDirection");

  const ownsFrameMaterial=!frameMaterial,ownsPanelMaterial=!panelMaterial;
  frameMaterial??=new THREE.MeshStandardMaterial({color:0x3b3428,roughness:.88});
  panelMaterial??=new THREE.MeshStandardMaterial({color:0xe7e3d5,roughness:.82});

  const doorFrame=new THREE.Group();doorFrame.name="doorFrame";
  const uprightGeometry=new THREE.BoxGeometry(frameThickness,height+frameThickness,frameDepth),topGeometry=new THREE.BoxGeometry(width+frameThickness*2,frameThickness,frameDepth);
  const leftPost=new THREE.Mesh(uprightGeometry,frameMaterial),rightPost=new THREE.Mesh(uprightGeometry,frameMaterial),top=new THREE.Mesh(topGeometry,frameMaterial);
  leftPost.name="doorFrameLeft";rightPost.name="doorFrameRight";top.name="doorFrameTop";
  leftPost.position.set(-width/2-frameThickness/2,height/2,0);rightPost.position.set(width/2+frameThickness/2,height/2,0);top.position.set(0,height+frameThickness/2,0);doorFrame.add(leftPost,rightPost,top);

  let thresholdMesh=null;
  if(threshold){thresholdMesh=new THREE.Mesh(topGeometry,frameMaterial);thresholdMesh.name="doorThreshold";thresholdMesh.position.set(0,frameThickness/2,0);doorFrame.add(thresholdMesh);}

  const hinge=new THREE.Group();hinge.name="hinge";hinge.position.set(hingeSide===HINGE_SIDES.LEFT?-width/2:width/2,0,0);doorFrame.add(hinge);
  const doorPanel=new THREE.Mesh(new THREE.BoxGeometry(width,height,thickness),panelMaterial);doorPanel.name="doorPanel";doorPanel.position.set(hingeSide===HINGE_SIDES.LEFT?width/2:-width/2,height/2,0);hinge.add(doorPanel);

  const swingSign=(hingeSide===HINGE_SIDES.LEFT?-1:1)*(swingDirection===SWING_DIRECTIONS.INWARD?1:-1);
  const api={doorFrame,hinge,doorPanel,leftPost,rightPost,top,threshold:thresholdMesh,hingeSide,swingDirection,swingSign,width,height,thickness,frameThickness,frameDepth,setAngle(angle){const value=Number(angle);if(!Number.isFinite(value))throw new TypeError("angle doit être un nombre fini.");hinge.rotation.y=swingSign*value;return hinge.rotation.y;},dispose(){uprightGeometry.dispose();topGeometry.dispose();doorPanel.geometry.dispose();if(ownsFrameMaterial)frameMaterial.dispose();if(ownsPanelMaterial)panelMaterial.dispose();}};
  doorFrame.userData.door=api;
  return api;
}

export class DoorController{
  constructor(assembly,{maxAngle=Math.PI*.52,duration=1250,playerRadius=.32,onHandle=()=>{},onCreak=()=>{},onBlocked=()=>{},onStateChange=()=>{}}={}){
    if(!assembly?.doorPanel||!assembly?.hinge)throw new TypeError("Une porte assemblée est requise.");
    this.assembly=assembly;this.maxAngle=positive(maxAngle,"maxAngle");this.duration=positive(duration,"duration");this.playerRadius=positive(playerRadius,"playerRadius");this.onHandle=onHandle;this.onCreak=onCreak;this.onBlocked=onBlocked;this.onStateChange=onStateChange;this.angle=0;this.startAngle=0;this.targetAngle=0;this.startedAt=0;this.moving=false;this.blocked=false;this.action=null;this._localPoint=new THREE.Vector3();assembly.setAngle(0);
  }
  command(action,now=performance.now()){
    if(!Object.values(DOOR_ACTIONS).includes(action))throw new TypeError(`Action de porte invalide : ${action}`);
    const target=action===DOOR_ACTIONS.OPEN?this.maxAngle:0;if(Math.abs(target-this.angle)<1e-5&&!this.moving)return false;
    this.startAngle=this.angle;this.targetAngle=target;this.startedAt=Number(now);this.moving=true;this.blocked=false;this.action=action;this.onHandle(action);this.onCreak(action);this.onStateChange("moving",this);return true;
  }
  open(now){return this.command(DOOR_ACTIONS.OPEN,now);}
  close(now){return this.command(DOOR_ACTIONS.CLOSE,now);}
  toggle(now){return this.command(this.targetAngle>.001||this.angle>.001?DOOR_ACTIONS.CLOSE:DOOR_ACTIONS.OPEN,now);}
  collides(playerPosition,radius=this.playerRadius){
    if(!playerPosition)return false;this.assembly.doorFrame.updateWorldMatrix(true,true);this._localPoint.set(playerPosition.x,this.assembly.height/2,playerPosition.z);this.assembly.doorPanel.worldToLocal(this._localPoint);
    const dx=Math.max(Math.abs(this._localPoint.x)-this.assembly.width/2,0),dz=Math.max(Math.abs(this._localPoint.z)-this.assembly.thickness/2,0);return dx*dx+dz*dz<radius*radius;
  }
  update(now=performance.now(),playerPosition=null){
    if(!this.moving)return false;const progress=Math.min(1,Math.max(0,(Number(now)-this.startedAt)/this.duration)),eased=progress*progress*(3-2*progress),previous=this.angle,next=THREE.MathUtils.lerp(this.startAngle,this.targetAngle,eased);
    this.assembly.setAngle(next);this.angle=next;
    if(playerPosition&&this.collides(playerPosition)){this.angle=previous;this.assembly.setAngle(previous);this.moving=false;this.blocked=true;this.onBlocked(this.action);this.onStateChange("blocked",this);return false;}
    if(progress>=1){this.angle=this.targetAngle;this.moving=false;this.action=null;this.onStateChange(this.angle>.001?"open":"closed",this);}
    return true;
  }
}

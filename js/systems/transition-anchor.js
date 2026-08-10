const EPSILON=1e-8;

function finite(value,label){const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} doit être un nombre fini.`);return number;}
function positive(value,label){const number=finite(value,label);if(number<=0)throw new RangeError(`${label} doit être supérieur à zéro.`);return number;}

export function anchorKey(level,id){return`${level}:${id}`;}

export function defineAnchor(definition){
  if(!definition||typeof definition!=="object")throw new TypeError("L’ancre doit être un objet.");
  if(!Number.isInteger(definition.level)||definition.level<1)throw new TypeError("anchor.level doit être un entier positif.");
  if(typeof definition.id!=="string"||!definition.id.trim())throw new TypeError("anchor.id doit être un identifiant non vide.");
  const position=Object.freeze({x:finite(definition.position?.x,"position.x"),y:finite(definition.position?.y??0,"position.y"),z:finite(definition.position?.z,"position.z")}),yaw=finite(definition.yaw??0,"yaw"),normalLength=Math.hypot(Math.sin(yaw),Math.cos(yaw));
  if(normalLength<EPSILON)throw new RangeError("L’orientation de l’ancre est invalide.");
  const normal=Object.freeze({x:Math.sin(yaw)/normalLength,z:Math.cos(yaw)/normalLength}),right=Object.freeze({x:normal.z,z:-normal.x});
  return Object.freeze({
    id:definition.id.trim(),
    level:definition.level,
    key:anchorKey(definition.level,definition.id.trim()),
    position,
    yaw,
    normal,
    right,
    width:positive(definition.width??5,"width"),
    height:positive(definition.height??3.25,"height"),
    depth:positive(definition.depth??0.8,"depth"),
    kind:definition.kind??"passage",
    metadata:Object.freeze({...definition.metadata}),
  });
}

export function worldToAnchor(anchor,position){
  const dx=finite(position.x,"position.x")-anchor.position.x,dy=finite(position.y??anchor.position.y,"position.y")-anchor.position.y,dz=finite(position.z,"position.z")-anchor.position.z;
  return Object.freeze({lateral:dx*anchor.right.x+dz*anchor.right.z,vertical:dy,normal:dx*anchor.normal.x+dz*anchor.normal.z});
}

export function anchorToWorld(anchor,local){
  const lateral=finite(local.lateral??0,"local.lateral"),vertical=finite(local.vertical??0,"local.vertical"),normal=finite(local.normal??0,"local.normal");
  return Object.freeze({x:anchor.position.x+anchor.right.x*lateral+anchor.normal.x*normal,y:anchor.position.y+vertical,z:anchor.position.z+anchor.right.z*lateral+anchor.normal.z*normal});
}

export function isInsideAnchor(anchor,position,margin=0){
  const local=worldToAnchor(anchor,position),extra=Math.max(0,finite(margin,"margin"));
  return Math.abs(local.lateral)<=anchor.width/2+extra&&local.vertical>=-extra&&local.vertical<=anchor.height+extra&&Math.abs(local.normal)<=anchor.depth/2+extra;
}

export function crossedAnchor(anchor,previousPosition,currentPosition,margin=0){
  const previous=worldToAnchor(anchor,previousPosition),current=worldToAnchor(anchor,currentPosition),extra=Math.max(0,finite(margin,"margin")),insideSpan=Math.abs(current.lateral)<=anchor.width/2+extra&&current.vertical>=-extra&&current.vertical<=anchor.height+extra,crossed=(previous.normal>0&&current.normal<=0)||(previous.normal<0&&current.normal>=0);
  if(!insideSpan||!crossed||Math.abs(previous.normal)>anchor.depth+extra||Math.abs(current.normal)>anchor.depth+extra)return null;
  return Object.freeze({direction:previous.normal>current.normal?"forward":"backward",previous,current});
}

export function mapThroughAnchors(sourceAnchor,targetAnchor,state,{exitOffset=0.65}={}){
  const local=worldToAnchor(sourceAnchor,state.position),side=local.normal<0?-1:1,mappedPosition=anchorToWorld(targetAnchor,{lateral:local.lateral,vertical:local.vertical,normal:side*Math.max(0.05,finite(exitOffset,"exitOffset"))}),rotationDelta=targetAnchor.yaw-sourceAnchor.yaw,cos=Math.cos(rotationDelta),sin=Math.sin(rotationDelta),velocity=state.velocity??{x:0,y:0,z:0};
  return Object.freeze({
    position:mappedPosition,
    yaw:finite(state.yaw??0,"state.yaw")+rotationDelta,
    pitch:finite(state.pitch??0,"state.pitch"),
    velocity:Object.freeze({x:finite(velocity.x??0,"velocity.x")*cos+finite(velocity.z??0,"velocity.z")*sin,y:finite(velocity.y??0,"velocity.y"),z:-finite(velocity.x??0,"velocity.x")*sin+finite(velocity.z??0,"velocity.z")*cos}),
    rotationDelta,
    localOffset:local,
  });
}

export class AnchorRegistry{
  constructor(){this.anchors=new Map();this.byLevel=new Map();}
  register(definition){const anchor=defineAnchor(definition);if(this.anchors.has(anchor.key))throw new Error(`Ancre déjà enregistrée : ${anchor.key}`);this.anchors.set(anchor.key,anchor);const list=this.byLevel.get(anchor.level)??[];list.push(anchor);this.byLevel.set(anchor.level,list);return anchor;}
  get(level,id){return this.anchors.get(anchorKey(level,id))??null;}
  forLevel(level){return[...(this.byLevel.get(level)??[])];}
  remove(level,id){const key=anchorKey(level,id),anchor=this.anchors.get(key);if(!anchor)return false;this.anchors.delete(key);const list=this.byLevel.get(level)??[],index=list.indexOf(anchor);if(index>=0)list.splice(index,1);if(!list.length)this.byLevel.delete(level);return true;}
  clear(){this.anchors.clear();this.byLevel.clear();}
}

const QUARTER_TURN=Math.PI/2;

function finite(value,label){const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${label} doit être un nombre fini.`);return number;}
function rotate(x,z,angle){const rawCos=Math.cos(angle),rawSin=Math.sin(angle),cos=Math.abs(rawCos)<1e-10?0:rawCos,sin=Math.abs(rawSin)<1e-10?0:rawSin;return{x:x*cos+z*sin,z:-x*sin+z*cos};}

export function boundsOverlap(a,b,clearance=0){
  const gap=Math.max(0,finite(clearance,"clearance"));
  return a.minX<b.maxX+gap&&a.maxX>b.minX-gap&&a.minZ<b.maxZ+gap&&a.maxZ>b.minZ-gap;
}

export function doorPlacementCandidate(sourceAnchor,mazeConfig,rotation=sourceAnchor.yaw){
  const width=Math.max(1,Math.floor(mazeConfig.width)),height=Math.max(1,Math.floor(mazeConfig.height)),cellSize=finite(mazeConfig.cellSize,"cellSize"),worldWidth=width*cellSize,worldLength=height*cellSize,entryColumn=Math.max(0,Math.min(width-1,Math.floor(mazeConfig.entryColumn??width/2))),entryOffsetX=(entryColumn+.5)*cellSize,localOrigin=rotate(-entryOffsetX,0,rotation),originX=sourceAnchor.position.x+localOrigin.x,originZ=sourceAnchor.position.z+localOrigin.z,corners=[[0,0],[worldWidth,0],[0,worldLength],[worldWidth,worldLength]].map(([x,z])=>{const point=rotate(x,z,rotation);return{x:originX+point.x,z:originZ+point.z};}),xs=corners.map(point=>point.x),zs=corners.map(point=>point.z);
  return Object.freeze({originX,originZ,rotation,width,height,cellSize,worldWidth,worldLength,entryColumn,bounds:Object.freeze({minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)})});
}

export class SpatialPlanner{
  constructor(){this.reservations=new Map();}
  reserve(id,bounds,metadata={}){if(this.reservations.has(id))throw new Error(`Espace déjà réservé : ${id}`);const reservation=Object.freeze({id,bounds:Object.freeze({...bounds}),metadata:Object.freeze({...metadata})});this.reservations.set(id,reservation);return reservation;}
  release(id){return this.reservations.delete(id);}
  conflicts(bounds,{clearance=0,ignore=[]}={}){const ignored=new Set(ignore);return[...this.reservations.values()].filter(reservation=>!ignored.has(reservation.id)&&boundsOverlap(bounds,reservation.bounds,clearance));}
  findDoorPlacement({sourceAnchor,mazeConfig,sourceLevel,targetLevel,clearance=0,orientations}={}){
    const angles=orientations??[sourceAnchor.yaw,sourceAnchor.yaw+QUARTER_TURN,sourceAnchor.yaw+Math.PI,sourceAnchor.yaw-QUARTER_TURN];
    for(const rotation of angles){const candidate=doorPlacementCandidate(sourceAnchor,mazeConfig,rotation),conflicts=this.conflicts(candidate.bounds,{clearance,ignore:[`level:${targetLevel}`]});if(!conflicts.length)return Object.freeze({...candidate,sourceLevel,targetLevel,conflicts:Object.freeze([])});}
    return null;
  }
  clear(){this.reservations.clear();}
}

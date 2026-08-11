import * as THREE from "../../vendor/three.module.min.js";

export const LIGHTING_MODES=Object.freeze({UNIFORM:"uniform",FLICKER:"flicker",ZONES:"zones",DARK:"dark"});
const VALID_MODES=new Set(Object.values(LIGHTING_MODES));

function inZone(x,y,zones,width,height){if(!zones.length)return true;return zones.some(zone=>{const minX=(zone.x??0)*width,minY=(zone.y??0)*height,maxX=minX+(zone.width??1)*width,maxY=minY+(zone.height??1)*height;return x>=minX&&x<=maxX&&y>=minY&&y<=maxY;});}

function occupiedByColumn(maze,x,y){return (maze.features??[]).some(feature=>feature.type==="column"&&feature.x===x&&feature.y===y);}

export function createLevelLighting(maze,config={},appearance={},seed=1){
  const mode=config.enabled===false?LIGHTING_MODES.DARK:(config.mode??LIGHTING_MODES.UNIFORM);if(!VALID_MODES.has(mode))throw new TypeError(`Mode d’éclairage inconnu : ${mode}`);
  const group=new THREE.Group();group.name=`levelLighting:${maze.index+1}`;const lights=[],panels=[],spacing=Math.max(1,Math.floor(config.spacing??4)),intensity=Math.max(0,Number(config.intensity??2.7)),distance=Math.max(0,Number(config.distance??13)),color=new THREE.Color(config.color??appearance.light??0xffef9b),panelMaterial=new THREE.MeshBasicMaterial({color:config.panelColor??appearance.lightPanel??0xfff6bc}),panelWidth=Math.max(.6,Math.min(2.7,maze.cellSize*.65)),panelDepth=Math.max(.22,Math.min(.42,maze.cellSize*.12)),panelGeometry=new THREE.BoxGeometry(panelWidth,.035,panelDepth),zones=Array.isArray(config.zones)?config.zones:[];
  if(mode!==LIGHTING_MODES.DARK)for(let y=2;y<maze.height;y+=spacing)for(let x=2;x<maze.width;x+=spacing){if(mode===LIGHTING_MODES.ZONES&&!inZone(x+.5,y+.5,zones,maze.width,maze.height)||occupiedByColumn(maze,x,y))continue;const light=new THREE.SpotLight(color,intensity,distance,Math.min(1.02,Math.atan(maze.cellSize*.78/3)),.52,2),target=new THREE.Object3D(),panel=new THREE.Mesh(panelGeometry,panelMaterial),phase=((seed+maze.index*977+x*37+y*71)%997)/997*Math.PI*2,worldX=maze.originX+(x+.5)*maze.cellSize,worldZ=maze.originZ+(y+.5)*maze.cellSize;light.position.set(worldX,3.04,worldZ);target.position.set(worldX,.05,worldZ);light.target=target;light.userData={baseIntensity:intensity,phase,flicker:mode===LIGHTING_MODES.FLICKER,cellX:x,cellY:y};panel.position.set(worldX,3.21,worldZ);panel.userData={cellX:x,cellY:y};group.add(light,target,panel);lights.push(light);panels.push(panel);}
  return{group,mode,lights,panels,update(now){if(mode!==LIGHTING_MODES.FLICKER)return;for(const light of lights){const wave=Math.sin(now*.006+light.userData.phase),drop=Math.sin(now*.021+light.userData.phase*3)>.94?.08:1,variation=.82+Math.max(0,wave)*.18;light.intensity=light.userData.baseIntensity*variation*drop;}},dispose(){panelGeometry.dispose();panelMaterial.dispose();lights.length=0;panels.length=0;}};
}

import {distanceToMeshBox} from "./collision.js";

export function wallVisibilityThresholds({distance=50,margin=20,hysteresis=5}={}){
  const guaranteed=Math.max(0,Number(distance)||0),safeMargin=Math.max(0,Number(margin)||0),band=Math.min(safeMargin,Math.max(0,Number(hysteresis)||0));
  return Object.freeze({guaranteed,showDistance:guaranteed+safeMargin-band,hideDistance:guaranteed+safeMargin});
}

export function updateWallVisibility(walls,x,z,options={}){
  const thresholds=wallVisibilityThresholds(options);let visibleCount=0;
  for(const wall of walls){
    const distance=distanceToMeshBox(x,z,wall),limit=wall.visible===false?thresholds.showDistance:thresholds.hideDistance;
    wall.visible=distance<=limit;
    if(wall.visible)visibleCount++;
  }
  return Object.freeze({...thresholds,visibleCount,total:walls.length});
}

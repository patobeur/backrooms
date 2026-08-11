export function findSafeGuideSpawn(origin,{collides,contains=()=>true,minDistance=1.1,maxDistance=3.2,ringStep=.35,samples=24,startAngle=0}={}){
  if(!origin||!Number.isFinite(origin.x)||!Number.isFinite(origin.z)||typeof collides!=="function")throw new TypeError("Origine ou collision invalide.");
  for(let radius=minDistance;radius<=maxDistance+1e-9;radius+=ringStep)for(let index=0;index<samples;index++){
    const angle=startAngle+index/samples*Math.PI*2,x=origin.x+Math.cos(angle)*radius,z=origin.z+Math.sin(angle)*radius;
    if(contains(x,z)&&!collides(x,z))return Object.freeze({x,z});
  }
  return null;
}

export function calculateInteractionLayout(actionCount,viewportHeight,{compact=false}={}){
  const count=Math.max(0,Math.floor(Number(actionCount)||0)),height=Math.max(240,Number(viewportHeight)||0),cardHeight=compact?70:76,preferred=count<=1?60:count===2?74:count===3?84:96,maxRadius=Math.max(52,height/2-cardHeight/2-72),radius=Math.min(preferred,maxRadius),gap=14;
  return Object.freeze({radius,labelOffset:radius+cardHeight/2+gap,cardHeight,gap});
}

export function shouldShowInteractionLabel({objectAvailable=false,inventoryOpen=false}={}){
  return Boolean(objectAvailable&&!inventoryOpen);
}

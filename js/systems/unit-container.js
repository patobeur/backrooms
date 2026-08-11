export const UNIT_KINDS=Object.freeze({WATER_DOSE:"water-dose",MEDICINE_TABLET:"medicine-tablet",AMMUNITION:"ammunition",AMMUNITION_9MM:"ammunition-9mm"});
export const CONTAINER_KINDS=Object.freeze({BOTTLE:"bottle",BLISTER:"blister",MAGAZINE:"magazine",GENERIC:"generic"});

const integer=(value,fallback=0)=>Number.isFinite(Number(value))?Math.floor(Number(value)):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createUnitContainer({capacity=1,units=capacity,unitKind="generic-unit",reloadable=false,containerKind=CONTAINER_KINDS.GENERIC}={}){
  const normalizedCapacity=Math.max(1,integer(capacity,1));
  return Object.freeze({capacity:normalizedCapacity,units:clamp(integer(units,normalizedCapacity),0,normalizedCapacity),unitKind:String(unitKind||"generic-unit"),reloadable:Boolean(reloadable),containerKind:String(containerKind||CONTAINER_KINDS.GENERIC)});
}

export function normalizeUnitContainer(value,defaults={}){return createUnitContainer({...defaults,...value});}
export function hasUnits(container,amount=1){const state=normalizeUnitContainer(container),requested=Math.max(1,integer(amount,1));return state.units>=requested;}

export function removeUnits(container,amount=1){
  const state=normalizeUnitContainer(container),requested=Math.max(0,integer(amount,0));if(requested<=0)return Object.freeze({changed:false,reason:"invalid-amount",removed:0,container:state});
  const removed=Math.min(requested,state.units);return Object.freeze({changed:removed>0,reason:removed>0?"removed":"empty",removed,container:createUnitContainer({...state,units:state.units-removed})});
}

export function consumeUnits(container,amount=1){const result=removeUnits(container,amount);return Object.freeze({...result,reason:result.changed?"consumed":result.reason,consumed:result.removed});}

export function addUnits(container,amount=1){
  const state=normalizeUnitContainer(container),requested=Math.max(0,integer(amount,0));if(!state.reloadable)return Object.freeze({changed:false,reason:"not-reloadable",added:0,container:state});if(requested<=0)return Object.freeze({changed:false,reason:"invalid-amount",added:0,container:state});
  const added=Math.min(requested,state.capacity-state.units);return Object.freeze({changed:added>0,reason:added>0?"added":"full",added,container:createUnitContainer({...state,units:state.units+added})});
}

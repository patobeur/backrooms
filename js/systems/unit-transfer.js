import {normalizeUnitContainer} from "./unit-container.js";

const integer=value=>Number.isFinite(Number(value))?Math.floor(Number(value)):0;
const result=(reason,source,target,transferred=0)=>Object.freeze({changed:reason==="transferred",reason,transferred,source,target});

export function unitKindsCompatible(source,target){
  const from=normalizeUnitContainer(source),to=normalizeUnitContainer(target);
  return from.unitKind===to.unitKind;
}

export function inspectUnitTransfer(source,target,amount=1,{sourceId=null,targetId=null}={}){
  const from=normalizeUnitContainer(source),to=normalizeUnitContainer(target),requested=integer(amount);
  if(source===target||sourceId!=null&&targetId!=null&&sourceId===targetId)return result("same-container",from,to);
  if(requested<=0)return result("invalid-amount",from,to);
  if(!to.reloadable)return result("not-reloadable",from,to);
  if(!unitKindsCompatible(from,to))return result("incompatible",from,to);
  if(from.units<requested)return result("insufficient-units",from,to);
  if(to.units+requested>to.capacity)return result("capacity-exceeded",from,to);
  return result("ready",from,to);
}

export function transferUnits(source,target,amount=1,identity={}){
  const inspection=inspectUnitTransfer(source,target,amount,identity);
  if(inspection.reason!=="ready")return inspection;
  const transferred=integer(amount),from=normalizeUnitContainer({...inspection.source,units:inspection.source.units-transferred}),to=normalizeUnitContainer({...inspection.target,units:inspection.target.units+transferred});
  return result("transferred",from,to,transferred);
}

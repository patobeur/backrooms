import {CONTAINER_KINDS,UNIT_KINDS,consumeUnits,createUnitContainer,normalizeUnitContainer} from "./unit-container.js";

export const DEFAULT_CALIBER="9mm";
export const ammunitionUnitKind=caliber=>`ammunition-${String(caliber||DEFAULT_CALIBER).toLowerCase()}`;
const freezeMagazine=magazine=>Object.freeze({...magazine,container:normalizeUnitContainer(magazine.container)});
const freezeFirearm=firearm=>Object.freeze({...firearm,magazine:firearm.magazine?freezeMagazine(firearm.magazine):null});
const SUCCESS_REASONS=new Set(["magazine-inserted","magazine-removed","magazine-replaced","round-chambered","fired"]);
const result=(reason,firearm,extra={})=>Object.freeze({changed:SUCCESS_REASONS.has(reason),reason,firearm:freezeFirearm(firearm),...extra});

export function createMagazine({instanceId="magazine",caliber=DEFAULT_CALIBER,capacity=12,rounds=capacity}={}){
  return freezeMagazine({type:"magazine",instanceId:String(instanceId),caliber:String(caliber),container:createUnitContainer({capacity,units:rounds,unitKind:ammunitionUnitKind(caliber),reloadable:true,containerKind:CONTAINER_KINDS.MAGAZINE})});
}

export function createPistol({instanceId="pistol",caliber=DEFAULT_CALIBER,magazine=null,chambered=false}={}){
  const compatible=magazine?.container?.unitKind===ammunitionUnitKind(caliber);
  return freezeFirearm({type:"pistol",instanceId:String(instanceId),caliber:String(caliber),magazine:compatible?magazine:null,chambered:Boolean(chambered)});
}

export function insertMagazine(firearm,magazine){
  const state=freezeFirearm(firearm),candidate=freezeMagazine(magazine);
  if(state.magazine)return result("occupied",state,{magazine:candidate});
  if(candidate.container.unitKind!==ammunitionUnitKind(state.caliber))return result("incompatible-magazine",state,{magazine:candidate});
  return result("magazine-inserted",{...state,magazine:candidate});
}

export function removeMagazine(firearm){
  const state=freezeFirearm(firearm);if(!state.magazine)return result("missing-magazine",state,{magazine:null});
  return result("magazine-removed",{...state,magazine:null},{magazine:state.magazine});
}

export function reloadPistol(firearm,magazine){
  const state=freezeFirearm(firearm),candidate=freezeMagazine(magazine);
  if(candidate.container.unitKind!==ammunitionUnitKind(state.caliber))return result("incompatible-magazine",state,{magazine:candidate,ejectedMagazine:null});
  return result(state.magazine?"magazine-replaced":"magazine-inserted",{...state,magazine:candidate},{ejectedMagazine:state.magazine});
}

export function chamberRound(firearm){
  const state=freezeFirearm(firearm);if(state.chambered)return result("already-chambered",state);
  if(!state.magazine)return result("missing-magazine",state);
  const loaded=consumeUnits(state.magazine.container,1);if(!loaded.changed)return result("empty",state);
  return result("round-chambered",{...state,chambered:true,magazine:{...state.magazine,container:loaded.container}});
}

export function firePistol(firearm){
  const state=freezeFirearm(firearm);if(!state.chambered)return result("not-chambered",state,{fired:false,autoChambered:false});
  let magazine=state.magazine,autoChambered=false;if(magazine){const loaded=consumeUnits(magazine.container,1);if(loaded.changed){magazine={...magazine,container:loaded.container};autoChambered=true;}}
  return result("fired",{...state,chambered:autoChambered,magazine},{fired:true,autoChambered});
}

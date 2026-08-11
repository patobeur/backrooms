import {CONTAINER_KINDS,UNIT_KINDS,consumeUnits,createUnitContainer,normalizeUnitContainer} from "./unit-container.js";

export const MEDICINE_KINDS=Object.freeze({ANALGESIC:"analgesic",GENERIC:"generic"});
export const medicineUnitKind=kind=>`${UNIT_KINDS.MEDICINE_TABLET}:${String(kind||MEDICINE_KINDS.GENERIC)}`;

export function createMedicineBlister({capacity=8,tablets=capacity,medicineKind=MEDICINE_KINDS.GENERIC}={}){
  return createUnitContainer({capacity,units:tablets,unitKind:medicineUnitKind(medicineKind),reloadable:false,containerKind:CONTAINER_KINDS.BLISTER});
}

export function drinkWaterDose(container,{thirst=0,relief=15}={}){
  const state=normalizeUnitContainer(container),currentThirst=Math.max(0,Math.min(100,Number(thirst)||0));
  if(state.unitKind!==UNIT_KINDS.WATER_DOSE)return Object.freeze({changed:false,reason:"not-water",consumed:0,container:state,thirst:currentThirst});
  const use=consumeUnits(state,1);if(!use.changed)return Object.freeze({changed:false,reason:use.reason,consumed:0,container:use.container,thirst:currentThirst});
  return Object.freeze({changed:true,reason:"drank",consumed:1,container:use.container,thirst:Math.max(0,currentThirst-Math.max(0,Number(relief)||0))});
}

export function takeMedicineDose(container){
  const state=normalizeUnitContainer(container);
  if(!state.unitKind.startsWith(`${UNIT_KINDS.MEDICINE_TABLET}:`))return Object.freeze({changed:false,reason:"not-medicine",consumed:0,container:state});
  const use=consumeUnits(state,1);return Object.freeze({...use,reason:use.changed?"medicine-taken":use.reason});
}

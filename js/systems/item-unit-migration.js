import {CONTAINER_KINDS,UNIT_KINDS,createUnitContainer} from "./unit-container.js";

export const WATER_BOTTLE_TYPE="water_bottle";
export const LEGACY_WATER_BOTTLE_TYPES=Object.freeze(["water_full","water_half","water_empty"]);

export function createWaterBottleContainer(units=4,capacity=4){
  return createUnitContainer({capacity,units,unitKind:UNIT_KINDS.WATER_DOSE,reloadable:true,containerKind:CONTAINER_KINDS.BOTTLE});
}

export function isWaterBottleType(type){return type===WATER_BOTTLE_TYPE||LEGACY_WATER_BOTTLE_TYPES.includes(type);}

export function normalizeWaterBottleData(type,data={}){
  const legacyDefault=type==="water_half"?2:type==="water_empty"?0:4;
  const units=Number.isFinite(Number(data.sips))?Number(data.sips):Number.isFinite(Number(data.container?.units))?Number(data.container.units):legacyDefault;
  const capacity=Number.isFinite(Number(data.container?.capacity))?Number(data.container.capacity):4;
  const{sips,...rest}=data;
  return{...rest,type:WATER_BOTTLE_TYPE,id:WATER_BOTTLE_TYPE,container:createWaterBottleContainer(units,capacity)};
}

export function waterBottleUnits(data={}){return normalizeWaterBottleData(data.type??WATER_BOTTLE_TYPE,data).container.units;}

function normalizeSnapshot(snapshot){
  if(!isWaterBottleType(snapshot?.type)&&!isWaterBottleType(snapshot?.userData?.type))return false;
  const sourceType=snapshot.type??snapshot.userData.type;
  snapshot.type=WATER_BOTTLE_TYPE;
  snapshot.userData=normalizeWaterBottleData(sourceType,snapshot.userData);
  return true;
}

export function reconcileUnitContainers(save){
  const migrated=structuredClone(save);if(!migrated||typeof migrated!=="object")return Object.freeze({save:migrated,diagnostics:Object.freeze({normalized:0})});
  const collections=[migrated.inventory,...Object.values(migrated.levels??{}).map(level=>level?.objects)].filter(Array.isArray);let normalized=0;
  for(const collection of collections)for(const item of collection)if(normalizeSnapshot(item))normalized++;
  return Object.freeze({save:migrated,diagnostics:Object.freeze({normalized})});
}

import {normalizeBatteryData,normalizePlushPowerData} from "./item-power-state.js";

const itemId=item=>item?.userData?.instanceId??null;

export function reconcilePowerItems(save){
  const migrated=structuredClone(save),collections=[migrated.inventory,...Object.values(migrated.levels??{}).map(level=>level.objects)],seen=new Set();let normalized=0,duplicatesRemoved=0;
  for(const collection of collections)for(const item of collection){if(item?.type==="plush"){item.userData=normalizePlushPowerData(item.userData);normalized++;}else if(item?.type==="battery"){item.userData=normalizeBatteryData(item.userData);normalized++;}}
  const containedIds=new Set(collections.flat().filter(item=>item?.type==="plush"&&item.userData?.containedBattery&&!item.userData.batteryExtracted).map(item=>item.userData.containedBattery.instanceId));
  for(const collection of collections){const filtered=[];for(const item of collection){const id=itemId(item),embeddedDuplicate=item?.type==="battery"&&id&&containedIds.has(id),objectDuplicate=id&&seen.has(id);if(embeddedDuplicate||objectDuplicate){duplicatesRemoved++;continue;}if(id)seen.add(id);filtered.push(item);}collection.splice(0,collection.length,...filtered);}
  const hasPlush=collections.some(collection=>collection.some(item=>item?.type==="plush")),guideResolved=Boolean(migrated.progress?.guide||migrated.progress?.exitOpened),legacyMissingPlush=guideResolved&&!hasPlush;
  return Object.freeze({save:migrated,diagnostics:Object.freeze({normalized,duplicatesRemoved,legacyMissingPlush,policy:legacyMissingPlush?"preserve-absence":"normalized"})});
}

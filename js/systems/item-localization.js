import {translate} from "./i18n.js";
import {isWaterBottleType,normalizeWaterBottleData} from "./item-unit-migration.js";

const ITEM_KEYS=Object.freeze({
  plush:["item.plush.name","item.plush.description"],
  battery:["item.battery.name","item.battery.description"],
  book_red:["item.bookRed.name","item.bookRed.description"],
  book_green:["item.bookGreen.name","item.bookGreen.description"],
  book_blue:["item.bookBlue.name","item.bookBlue.description"],
  book_white:["item.bookWhite.name","item.bookWhite.description"],
  water_half:["item.water.halfName","item.water.description"],
  water_full:["item.water.fullName","item.water.description"],
  water_bottle:["item.water.fullName","item.water.description"],
  medicine_blister:["item.medicineBlister.name","item.medicineBlister.description"],
  magazine_9mm:["item.magazine9mm.name","item.magazine9mm.description"],
  pistol_9mm:["item.pistol9mm.name","item.pistol9mm.description"],
  artifact:["item.artifact.name","item.artifact.description"],
});

export function itemTranslationKeys(type){return ITEM_KEYS[type]??null;}

export function resolveItemTranslation(type,data={}){
  let keys=ITEM_KEYS[type]??(data.nameKey&&data.descriptionKey?[data.nameKey,data.descriptionKey]:null),parameters={};
  if(type==="plush")keys=data.fried?["item.plush.friedName",data.batteryExtracted||!data.containedBattery?"item.plush.friedEmptyDescription":"item.plush.friedDescription"]:data.powered?["item.plush.poweredName","item.plush.poweredDescription"]:ITEM_KEYS.plush;
  if(type==="battery"&&data.recoveredFromPlush)keys=["item.battery.name","item.battery.recoveredDescription"];
  if(isWaterBottleType(type)){
    const container=normalizeWaterBottleData(type,data).container,sips=container.units;parameters={sips};
    keys=sips===0?["item.water.emptyName","item.water.emptyDescription"]:sips===container.capacity?["item.water.fullName","item.water.description"]:sips===1?["item.water.almostEmptyName","item.water.description"]:sips===2?["item.water.halfName","item.water.description"]:["item.water.openName","item.water.description"];
  }
  if(type==="medicine_blister")parameters={doses:Math.max(0,Number(data.container?.units)||0)};
  if(type==="magazine_9mm")parameters={rounds:Math.max(0,Number(data.container?.units)||0)};
  if(type==="pistol_9mm")parameters={rounds:Math.max(0,Number(data.firearm?.magazine?.container?.units)||0),chambered:data.firearm?.chambered?1:0};
  return keys?Object.freeze({nameKey:keys[0],descriptionKey:keys[1],parameters:Object.freeze(parameters)}):null;
}

export function localizeItem(object){
  const data=object?.userData;if(!data)return object;const resolved=resolveItemTranslation(data.type,data);if(!resolved)return object;
  data.nameKey=resolved.nameKey;data.descriptionKey=resolved.descriptionKey;data.name=translate(resolved.nameKey,resolved.parameters);data.description=translate(resolved.descriptionKey,resolved.parameters);return object;
}

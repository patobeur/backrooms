import {translate} from "./i18n.js";

const ITEM_KEYS=Object.freeze({
  plush:["item.plush.name","item.plush.description"],
  battery:["item.battery.name","item.battery.description"],
  book_red:["item.bookRed.name","item.bookRed.description"],
  book_green:["item.bookGreen.name","item.bookGreen.description"],
  book_blue:["item.bookBlue.name","item.bookBlue.description"],
  book_white:["item.bookWhite.name","item.bookWhite.description"],
  water_half:["item.water.halfName","item.water.description"],
  water_full:["item.water.fullName","item.water.description"],
  artifact:["item.artifact.name","item.artifact.description"],
});

export function itemTranslationKeys(type){return ITEM_KEYS[type]??null;}

export function localizeItem(object){
  const data=object?.userData;if(!data)return object;
  let keys=ITEM_KEYS[data.type]??(data.nameKey&&data.descriptionKey?[data.nameKey,data.descriptionKey]:null),parameters={};
  if(data.type==="plush")keys=data.fried?["item.plush.friedName","item.plush.friedDescription"]:data.powered?["item.plush.poweredName","item.plush.poweredDescription"]:ITEM_KEYS.plush;
  if(data.type==="water_half"||data.type==="water_full"){
    const sips=Math.max(0,Number(data.sips)||0);parameters={sips};
    keys=sips===0?["item.water.emptyName","item.water.emptyDescription"]:sips===1?["item.water.almostEmptyName","item.water.description"]:sips===2?["item.water.halfName","item.water.description"]:["item.water.openName","item.water.description"];
  }
  if(!keys)return object;
  data.nameKey=keys[0];data.descriptionKey=keys[1];data.name=translate(keys[0],parameters);data.description=translate(keys[1],parameters);return object;
}

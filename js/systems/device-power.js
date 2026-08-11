export const POWER_SOURCE_KINDS=Object.freeze({AA_BATTERY:"battery-aa"});
export const POWER_LEVELS=Object.freeze({EMPTY:"empty",WEAK:"weak",USABLE:"usable"});

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function normalizePowerSource(data={},defaults={}){
  const raw=data.powerSource??data.energy??data,capacity=Math.max(1,finite(raw.capacity,defaults.capacity??100)),charge=clamp(finite(raw.charge,defaults.charge??capacity),0,capacity);
  return{kind:String(raw.kind??defaults.kind??POWER_SOURCE_KINDS.AA_BATTERY),instanceId:String(raw.instanceId??data.instanceId??defaults.instanceId??"unknown-power-source"),itemType:String(raw.itemType??data.type??defaults.itemType??"battery"),capacity,charge,rechargeable:Boolean(raw.rechargeable??defaults.rechargeable)};
}

export function createPowerSlot({acceptedKinds=[POWER_SOURCE_KINDS.AA_BATTERY],removable=true,source=null}={}){
  return{acceptedKinds:[...new Set(acceptedKinds.map(String))],removable:Boolean(removable),source:source?normalizePowerSource(source):null};
}

export function canInstallPowerSource(slot,source){const normalized=normalizePowerSource(source);return Boolean(slot)&&!slot.source&&slot.acceptedKinds?.includes(normalized.kind);}

export function installPowerSource(slot,source){
  const target=createPowerSlot(slot),normalized=normalizePowerSource(source);if(target.source)return{changed:false,reason:"occupied",slot:target};if(!target.acceptedKinds.includes(normalized.kind))return{changed:false,reason:"incompatible",slot:target};
  return{changed:true,reason:"installed",slot:{...target,source:normalized}};
}

export function consumePowerSource(slot,amount){
  const target=createPowerSlot(slot),requested=Math.max(0,finite(amount,0));if(!target.source)return{changed:false,reason:"empty-slot",consumed:0,slot:target};if(requested<=0)return{changed:false,reason:"invalid-amount",consumed:0,slot:target};
  const consumed=Math.min(requested,target.source.charge),source={...target.source,charge:target.source.charge-consumed};return{changed:consumed>0,reason:consumed>0?"consumed":"depleted",consumed,slot:{...target,source}};
}

export function removePowerSource(slot){
  const target=createPowerSlot(slot);if(!target.source)return{changed:false,reason:"empty-slot",source:null,slot:target};if(!target.removable)return{changed:false,reason:"fixed",source:null,slot:target};
  return{changed:true,reason:"removed",source:{...target.source},slot:{...target,source:null}};
}

export function powerLevel(source){const normalized=normalizePowerSource(source),ratio=normalized.charge/normalized.capacity;return ratio<=0?POWER_LEVELS.EMPTY:ratio<=.25?POWER_LEVELS.WEAK:POWER_LEVELS.USABLE;}

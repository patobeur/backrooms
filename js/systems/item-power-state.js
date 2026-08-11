import {POWER_SOURCE_KINDS,consumePowerSource,createPowerSlot,installPowerSource,normalizePowerSource,removePowerSource} from "./device-power.js";

export const PLUSH_POWER_STATES=Object.freeze({EMPTY:"empty",BATTERY_INSTALLED:"battery-installed",POWERED:"powered",FRIED:"fried"});
export const BATTERY_DEFAULT_CAPACITY=100;
export const PLUSH_ACTIVATION_COST=35;

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;

export function normalizeBatteryData(data={}){
  const powerSource=normalizePowerSource(data,{kind:POWER_SOURCE_KINDS.AA_BATTERY,capacity:BATTERY_DEFAULT_CAPACITY,itemType:"battery"});
  return{...data,powerSource,energy:{capacity:powerSource.capacity,charge:powerSource.charge,unitKind:"electric-charge",rechargeable:powerSource.rechargeable}};
}

function embeddedBattery(data,plushId){
  const instanceId=String(data.instanceId??data.powerSource?.instanceId??`embedded-battery:${plushId??"legacy"}`),normalized=normalizeBatteryData({...data,instanceId}),powerSource=normalizePowerSource({...normalized.powerSource,instanceId});
  return{type:"battery",instanceId,powerSource,energy:{capacity:powerSource.capacity,charge:powerSource.charge,unitKind:"electric-charge",rechargeable:powerSource.rechargeable}};
}

export function normalizePlushPowerData(data={}){
  const explicit=Object.values(PLUSH_POWER_STATES).includes(data.powerState)?data.powerState:null,legacyState=data.fried?PLUSH_POWER_STATES.FRIED:data.powered?PLUSH_POWER_STATES.BATTERY_INSTALLED:PLUSH_POWER_STATES.EMPTY,state=data.fried?PLUSH_POWER_STATES.FRIED:data.powered&&(!explicit||explicit===PLUSH_POWER_STATES.EMPTY)?PLUSH_POWER_STATES.BATTERY_INSTALLED:explicit??legacyState,extracted=Boolean(data.batteryExtracted),requiresBattery=state!==PLUSH_POWER_STATES.EMPTY&&!extracted,legacyBattery=data.containedBattery?embeddedBattery(data.containedBattery,data.instanceId):requiresBattery?embeddedBattery({},data.instanceId):null,powerSlot=createPowerSlot({acceptedKinds:[POWER_SOURCE_KINDS.AA_BATTERY],removable:true,source:data.powerSlot?.source??legacyBattery?.powerSource??null}),containedBattery=powerSlot.source?embeddedBattery(powerSlot.source,data.instanceId):null;
  return{...data,powerState:state,powered:Boolean(containedBattery)&&state!==PLUSH_POWER_STATES.EMPTY,fried:state===PLUSH_POWER_STATES.FRIED,batteryExtracted:extracted,powerSlot,containedBattery};
}

export function installBatteryInPlush(plushData,batteryData){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.EMPTY||plush.containedBattery)throw new Error("Le compartiment du lapin n’est pas vide.");
  const installed=installPowerSource(plush.powerSlot,normalizeBatteryData(batteryData));if(!installed.changed)throw new Error("La source d’énergie n’est pas compatible avec le lapin.");
  return{...plush,powerState:PLUSH_POWER_STATES.BATTERY_INSTALLED,powered:true,fried:false,batteryExtracted:false,powerSlot:installed.slot,containedBattery:embeddedBattery(installed.slot.source,plush.instanceId)};
}

export function powerPlush(plushData){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.BATTERY_INSTALLED||!plush.containedBattery||plush.containedBattery.energy.charge<=0)return{changed:false,data:plush};
  return{changed:true,data:{...plush,powerState:PLUSH_POWER_STATES.POWERED,powered:true,fried:false}};
}

export function burnOutPlush(plushData,cost=PLUSH_ACTIVATION_COST){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.POWERED||!plush.containedBattery)return{changed:false,data:plush};
  const consumed=consumePowerSource(plush.powerSlot,Math.max(0,finite(cost,PLUSH_ACTIVATION_COST)));if(!consumed.changed)return{changed:false,data:plush};const battery=embeddedBattery(consumed.slot.source,plush.instanceId);
  return{changed:true,remainingCharge:battery.energy.charge,data:{...plush,powerState:PLUSH_POWER_STATES.FRIED,powered:true,fried:true,batteryExtracted:false,powerSlot:consumed.slot,containedBattery:battery}};
}

export function extractBatteryFromPlush(plushData){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.FRIED||plush.batteryExtracted||!plush.containedBattery)return{changed:false,data:plush,battery:null};
  const removed=removePowerSource(plush.powerSlot);if(!removed.changed)return{changed:false,data:plush,battery:null};const battery=embeddedBattery(removed.source,plush.instanceId);
  return{changed:true,battery,data:{...plush,powered:false,fried:true,batteryExtracted:true,powerSlot:removed.slot,containedBattery:null}};
}

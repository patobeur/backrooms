export const PLUSH_POWER_STATES=Object.freeze({EMPTY:"empty",BATTERY_INSTALLED:"battery-installed",POWERED:"powered",FRIED:"fried"});
export const BATTERY_DEFAULT_CAPACITY=100;
export const PLUSH_ACTIVATION_COST=35;

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function normalizeBatteryData(data={}){
  const source=data.energy??{},capacity=Math.max(1,finite(source.capacity,BATTERY_DEFAULT_CAPACITY)),charge=clamp(finite(source.charge,capacity),0,capacity);
  return{...data,energy:{capacity,charge,unitKind:"electric-charge",rechargeable:Boolean(source.rechargeable)}};
}

function embeddedBattery(data,plushId){
  const normalized=normalizeBatteryData(data);
  return{type:"battery",instanceId:String(normalized.instanceId??`embedded-battery:${plushId??"legacy"}`),energy:{...normalized.energy}};
}

export function normalizePlushPowerData(data={}){
  const explicit=Object.values(PLUSH_POWER_STATES).includes(data.powerState)?data.powerState:null,legacyState=data.fried?PLUSH_POWER_STATES.FRIED:data.powered?PLUSH_POWER_STATES.BATTERY_INSTALLED:PLUSH_POWER_STATES.EMPTY,state=data.fried?PLUSH_POWER_STATES.FRIED:data.powered&&(!explicit||explicit===PLUSH_POWER_STATES.EMPTY)?PLUSH_POWER_STATES.BATTERY_INSTALLED:explicit??legacyState,requiresBattery=state!==PLUSH_POWER_STATES.EMPTY&&!data.batteryExtracted;
  return{...data,powerState:state,powered:state!==PLUSH_POWER_STATES.EMPTY,fried:state===PLUSH_POWER_STATES.FRIED,batteryExtracted:Boolean(data.batteryExtracted),containedBattery:data.containedBattery?embeddedBattery(data.containedBattery,data.instanceId):requiresBattery?embeddedBattery({},data.instanceId):null};
}

export function installBatteryInPlush(plushData,batteryData){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.EMPTY||plush.containedBattery)throw new Error("Le compartiment du lapin n’est pas vide.");
  return{...plush,powerState:PLUSH_POWER_STATES.BATTERY_INSTALLED,powered:true,fried:false,batteryExtracted:false,containedBattery:embeddedBattery(batteryData,plush.instanceId)};
}

export function powerPlush(plushData){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.BATTERY_INSTALLED||!plush.containedBattery||plush.containedBattery.energy.charge<=0)return{changed:false,data:plush};
  return{changed:true,data:{...plush,powerState:PLUSH_POWER_STATES.POWERED,powered:true,fried:false}};
}

export function burnOutPlush(plushData,cost=PLUSH_ACTIVATION_COST){
  const plush=normalizePlushPowerData(plushData);if(plush.powerState!==PLUSH_POWER_STATES.POWERED||!plush.containedBattery)return{changed:false,data:plush};
  const battery=embeddedBattery(plush.containedBattery,plush.instanceId),spent=Math.max(0,finite(cost,PLUSH_ACTIVATION_COST));battery.energy.charge=clamp(battery.energy.charge-spent,0,battery.energy.capacity);
  return{changed:true,remainingCharge:battery.energy.charge,data:{...plush,powerState:PLUSH_POWER_STATES.FRIED,powered:true,fried:true,batteryExtracted:false,containedBattery:battery}};
}

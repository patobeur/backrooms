import {resolveItemTranslation} from "./item-localization.js";
import {createExplorationSaveStorage} from "./save-storage.js";
import {validateExplorationSave} from "./save-schema.js";
import {reconcileUnitContainers} from "./item-unit-migration.js";

const freezeArray=value=>Object.freeze(value.map(entry=>Object.freeze(entry)));

function inventoryReport(inventory){
  const seen=new Set(),entries=[];
  for(let index=0;index<inventory.length;index++){
    const snapshot=inventory[index],data=snapshot.userData??{},instanceId=data.instanceId??`${snapshot.type}:${index}`;
    if(seen.has(instanceId))continue;seen.add(instanceId);
    const translation=resolveItemTranslation(snapshot.type,data);
    entries.push({instanceId,type:snapshot.type,level:Number(data.level)||null,nameKey:translation?.nameKey??data.nameKey??null,descriptionKey:translation?.descriptionKey??data.descriptionKey??null,parameters:translation?.parameters??Object.freeze({}),state:Object.freeze({powered:Boolean(data.powered),fried:Boolean(data.fried),container:data.container?Object.freeze({...data.container}):null,guideReward:Boolean(data.guideReward)})});
  }
  return freezeArray(entries);
}

function milestoneReport(save,inventory){
  const milestones=[],seen=new Set();for(const entry of save.journal?.milestones??[]){const id=entry?.id;if(!id||seen.has(id))continue;seen.add(id);milestones.push({...entry,confidence:"confirmed"});}const completed=new Set(save.progress.guide?.completedLevels??[]);
  for(const level of [...completed].filter(Number.isInteger).sort((a,b)=>a-b)){const id=`guide-complete:${level}`;if(!seen.has(id)){seen.add(id);milestones.push({id,type:"guide-complete",level,confidence:"confirmed"});}}
  if(save.progress.exitOpened&&!seen.has("exit-opened:1")){seen.add("exit-opened:1");milestones.push({id:"exit-opened:1",type:"exit-opened",level:1,confidence:"confirmed"});}
  for(const item of inventory)if(item.type==="artifact"){const id=`artifact-held:${item.instanceId}`;if(!seen.has(id)){seen.add(id);milestones.push({id,type:"artifact-held",level:item.level,instanceId:item.instanceId,confidence:"confirmed"});}}
  return freezeArray(milestones);
}

function resourceReport(inventory,needs,journal){
  const carried={};let waterSips=0,artifacts=0;
  for(const item of inventory){carried[item.type]=(carried[item.type]??0)+1;if(item.type==="water_bottle"&&Number.isFinite(item.state.container?.units))waterSips+=Math.max(0,item.state.container.units);if(item.type==="artifact")artifacts++;}
  return Object.freeze({carried:Object.freeze(carried),waterSips,artifacts,thirst:needs.thirst,hunger:needs.hunger,history:Object.freeze({...journal?.resources}),historyCoverage:journal?.coverage==="complete"?"confirmed":"partial"});
}

export function buildSaveReport(save){
  save=reconcileUnitContainers(save).save;
  const validation=validateExplorationSave(save);if(!validation.valid)return null;
  const inventory=inventoryReport(save.inventory),milestones=milestoneReport(save,inventory),doors=freezeArray(save.progress.doors.map((door,index)=>({id:`door:${door.sourceLevel??"unknown"}:${door.targetLevel??"unknown"}:${index}`,sourceLevel:door.sourceLevel??null,targetLevel:door.targetLevel??null,state:Number(door.angle)>0?"open":"closed",confidence:"confirmed"})));
  const journal=save.journal,route=freezeArray((journal?.visitedLevels?.length?journal.visitedLevels:[{level:save.world.level,firstVisitedAt:save.world.elapsed,entries:1}]).map(entry=>({id:`level:${entry.level}`,level:entry.level,type:entry.level===save.world.level?"current-level":"visited-level",firstVisitedAt:entry.firstVisitedAt,entries:entry.entries,confidence:"confirmed"}))),transitions=freezeArray((journal?.transitions??[]).map((entry,index)=>({id:entry.id??`transition:${index}`,...entry,confidence:"confirmed"}))),encounters=freezeArray(Object.entries(journal?.encounters??{}).map(([type,state])=>({type,...state,confidence:"confirmed"})));
  const resources=resourceReport(inventory,save.player.needs,journal),coverage=journal?.coverage??"partial",unavailable=coverage==="complete"?[]:["route-history","encounter-history","resource-history"];
  return Object.freeze({status:"active",coverage,schemaVersion:save.version,subject:Object.freeze({level:save.world.level,seed:save.world.seed,elapsed:save.world.elapsed,createdAt:save.meta.createdAt,updatedAt:save.meta.updatedAt,needs:Object.freeze({...save.player.needs})}),inventory,route,transitions,milestones,doors,encounters,resources,sections:Object.freeze({subject:true,inventory:inventory.length>0,route:route.length>0,milestones:milestones.length>0,encounters:encounters.length>0,resources:true}),unavailable:Object.freeze(unavailable)});
}

export function readSaveReport(storage=createExplorationSaveStorage()){
  const result=storage.read();if(!result.ok||!result.save)return Object.freeze({available:false,status:result.status,report:null});
  const report=buildSaveReport(result.save);return report?Object.freeze({available:true,status:result.status,report}):Object.freeze({available:false,status:"invalid",report:null});
}

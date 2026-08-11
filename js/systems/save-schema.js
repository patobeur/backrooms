export const SAVE_SCHEMA_KIND="backrooms-exploration";
export const SAVE_SCHEMA_VERSION=2;
export const SAVE_STORAGE_KEY=`backrooms.save.v${SAVE_SCHEMA_VERSION}`;
export const LEGACY_SAVE_STORAGE_KEYS=Object.freeze(["backrooms.save.v1"]);
export const JOURNAL_LIMITS=Object.freeze({visitedLevels:128,transitions:256,milestones:256,resourceTypes:128,encounterTypes:64});

const isObject=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const finite=value=>typeof value==="number"&&Number.isFinite(value);
const integer=value=>Number.isInteger(value);

function inspectSerializable(value,path,errors,seen){
  if(value===null||typeof value==="string"||typeof value==="boolean")return;
  if(typeof value==="number"){if(!Number.isFinite(value))errors.push(`${path} doit contenir un nombre fini.`);return;}
  if(typeof value!=="object"){errors.push(`${path} contient une valeur non sérialisable.`);return;}
  if(seen.has(value)){errors.push(`${path} contient une référence circulaire.`);return;}
  const prototype=Object.getPrototypeOf(value);
  if(!Array.isArray(value)&&prototype!==Object.prototype&&prototype!==null){errors.push(`${path} doit être un objet JavaScript simple.`);return;}
  seen.add(value);
  if(Array.isArray(value))value.forEach((entry,index)=>inspectSerializable(entry,`${path}[${index}]`,errors,seen));
  else for(const[key,entry]of Object.entries(value))inspectSerializable(entry,`${path}.${key}`,errors,seen);
  seen.delete(value);
}

function itemValid(item){
  return isObject(item)&&typeof item.type==="string"&&item.type.length>0&&isObject(item.userData)&&Array.isArray(item.position)&&item.position.length===3&&item.position.every(finite)&&Array.isArray(item.rotation)&&item.rotation.length===4&&item.rotation.slice(0,3).every(finite)&&typeof item.rotation[3]==="string"&&Array.isArray(item.scale)&&item.scale.length===3&&item.scale.every(finite);
}

export function createEmptyLevelSave(){return{objects:[],consumed:[],artifacts:[],doors:[],transitions:[],guide:null,creatures:[],events:[],custom:{}};}
const limitedRecord=(record,limit)=>Object.fromEntries(Object.entries(structuredClone(record)).slice(-limit));
export function createExplorationJournal({coverage="partial",coverageStartedAt=0,level=1,visitedLevels,transitions=[],milestones=[],resources={},encounters={}}={}){return{coverage:coverage==="complete"?"complete":"partial",coverageStartedAt:Math.max(0,Number(coverageStartedAt)||0),visitedLevels:structuredClone(visitedLevels??[{level:Math.max(1,Math.floor(Number(level)||1)),firstVisitedAt:Math.max(0,Number(coverageStartedAt)||0),entries:1}]).slice(0,JOURNAL_LIMITS.visitedLevels),transitions:structuredClone(transitions).slice(-JOURNAL_LIMITS.transitions),milestones:structuredClone(milestones).slice(-JOURNAL_LIMITS.milestones),resources:limitedRecord(resources,JOURNAL_LIMITS.resourceTypes),encounters:limitedRecord(encounters,JOURNAL_LIMITS.encounterTypes)};}

function journalValid(journal){if(!isObject(journal)||!["partial","complete"].includes(journal.coverage)||!finite(journal.coverageStartedAt)||journal.coverageStartedAt<0||!Array.isArray(journal.visitedLevels)||journal.visitedLevels.length>JOURNAL_LIMITS.visitedLevels||!Array.isArray(journal.transitions)||journal.transitions.length>JOURNAL_LIMITS.transitions||!Array.isArray(journal.milestones)||journal.milestones.length>JOURNAL_LIMITS.milestones||!isObject(journal.resources)||Object.keys(journal.resources).length>JOURNAL_LIMITS.resourceTypes||!isObject(journal.encounters)||Object.keys(journal.encounters).length>JOURNAL_LIMITS.encounterTypes)return false;return journal.visitedLevels.every(entry=>isObject(entry)&&integer(entry.level)&&entry.level>0&&finite(entry.firstVisitedAt)&&entry.firstVisitedAt>=0&&integer(entry.entries)&&entry.entries>0);}

export function validateExplorationSave(save){
  const errors=[];
  if(!isObject(save))return Object.freeze({valid:false,errors:Object.freeze(["La sauvegarde doit être un objet."])});
  if(save.kind!==SAVE_SCHEMA_KIND)errors.push("Type de sauvegarde inconnu.");
  if(save.version!==SAVE_SCHEMA_VERSION)errors.push(`Version de sauvegarde non prise en charge : ${save.version}.`);
  if(!isObject(save.meta)||!finite(save.meta.createdAt)||!finite(save.meta.updatedAt))errors.push("Métadonnées temporelles invalides.");
  if(!isObject(save.world)||!integer(save.world.seed)||!integer(save.world.level)||save.world.level<1||!finite(save.world.elapsed)||save.world.elapsed<0)errors.push("État du monde invalide.");
  const player=save.player;
  if(!isObject(player)||!Array.isArray(player.position)||player.position.length!==3||!player.position.every(finite)||!isObject(player.orientation)||!finite(player.orientation.yaw)||!finite(player.orientation.pitch)||!isObject(player.needs)||!finite(player.needs.thirst)||!finite(player.needs.hunger)||player.needs.thirst<0||player.needs.thirst>100||player.needs.hunger<0||player.needs.hunger>100)errors.push("État du joueur invalide.");
  if(!Array.isArray(save.inventory)||!save.inventory.every(itemValid))errors.push("Inventaire invalide.");
  if(!isObject(save.progress)||typeof save.progress.exitOpened!=="boolean"||!Array.isArray(save.progress.doors)||!Array.isArray(save.progress.transitions)||!Array.isArray(save.progress.artifacts)||!(save.progress.guide===null||isObject(save.progress.guide)))errors.push("Progression globale invalide.");
  if(!journalValid(save.journal))errors.push("Journal d’exploration invalide.");
  if(!isObject(save.levels))errors.push("États des niveaux invalides.");else for(const[level,state]of Object.entries(save.levels)){if(!/^[1-9]\d*$/.test(level)||!isObject(state)||!Array.isArray(state.objects)||!state.objects.every(itemValid)||!Array.isArray(state.consumed)||!Array.isArray(state.artifacts)||!Array.isArray(state.doors)||!Array.isArray(state.transitions)||!Array.isArray(state.creatures)||!Array.isArray(state.events)||!isObject(state.custom))errors.push(`État invalide pour le niveau ${level}.`);}
  inspectSerializable(save,"save",errors,new Set());
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function createExplorationSave({seed,level=1,elapsed=0,position=[0,1.7,0],yaw=0,pitch=0,thirst=0,hunger=0,inventory=[],progress={},levels={},journal,createdAt=Date.now(),updatedAt=createdAt}={}){
  const save={kind:SAVE_SCHEMA_KIND,version:SAVE_SCHEMA_VERSION,meta:{createdAt,updatedAt},world:{seed,level,elapsed},player:{position:[...position],orientation:{yaw,pitch},needs:{thirst,hunger}},inventory:structuredClone(inventory),progress:{exitOpened:Boolean(progress.exitOpened),doors:structuredClone(progress.doors??[]),transitions:structuredClone(progress.transitions??[]),guide:progress.guide==null?null:structuredClone(progress.guide),artifacts:structuredClone(progress.artifacts??[])},levels:structuredClone(levels),journal:createExplorationJournal(journal??{coverage:"partial",coverageStartedAt:elapsed,level})};
  const validation=validateExplorationSave(save);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));return save;
}

export function serializeExplorationSave(save){const validation=validateExplorationSave(save);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));return JSON.stringify(save);}
export function parseExplorationSave(text){let parsed;try{parsed=JSON.parse(text);}catch{throw new TypeError("Sauvegarde JSON illisible.");}const validation=validateExplorationSave(parsed);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));return parsed;}

export const SAVE_MIGRATIONS=Object.freeze({
  0(legacy){
    const player=legacy?.player??{};
    return createExplorationSave({seed:legacy?.seed,level:legacy?.level??1,elapsed:legacy?.elapsed??0,position:player.position??[0,1.7,0],yaw:player.yaw??0,pitch:player.pitch??0,thirst:player.thirst??0,hunger:player.hunger??0,inventory:legacy?.inventory??[],progress:legacy?.progress??{},levels:legacy?.levels??{},createdAt:legacy?.createdAt??legacy?.savedAt??Date.now(),updatedAt:legacy?.updatedAt??legacy?.savedAt??Date.now()});
  },
  1(legacy){
    const completed=[...new Set(legacy?.progress?.guide?.completedLevels??[])].filter(level=>Number.isInteger(level)&&level>0).sort((a,b)=>a-b),milestones=completed.map(level=>({id:`guide-complete:${level}`,type:"guide-complete",level,elapsed:null}));if(legacy?.progress?.exitOpened)milestones.push({id:"exit-opened:1",type:"exit-opened",level:1,elapsed:null});
    return createExplorationSave({seed:legacy.world.seed,level:legacy.world.level,elapsed:legacy.world.elapsed,position:legacy.player.position,yaw:legacy.player.orientation.yaw,pitch:legacy.player.orientation.pitch,thirst:legacy.player.needs.thirst,hunger:legacy.player.needs.hunger,inventory:legacy.inventory,progress:legacy.progress,levels:legacy.levels,journal:{coverage:"partial",coverageStartedAt:legacy.world.elapsed,visitedLevels:[{level:legacy.world.level,firstVisitedAt:legacy.world.elapsed,entries:1}],transitions:[],milestones,resources:{},encounters:{}},createdAt:legacy.meta.createdAt,updatedAt:legacy.meta.updatedAt});
  },
});
export function migrateExplorationSave(save){if(save?.version===SAVE_SCHEMA_VERSION)return parseExplorationSave(JSON.stringify(save));const migration=SAVE_MIGRATIONS[save?.version];if(!migration)throw new TypeError(`Aucune migration disponible depuis la version ${save?.version}.`);return migrateExplorationSave(migration(save));}

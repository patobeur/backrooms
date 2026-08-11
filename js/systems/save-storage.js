import {LEGACY_SAVE_STORAGE_KEYS,SAVE_SCHEMA_VERSION,SAVE_STORAGE_KEY,migrateExplorationSave,parseExplorationSave,serializeExplorationSave} from "./save-schema.js";

export const SAVE_BACKUP_KEY="backrooms.save.backup";

function resolveStorage(storage){if(storage)return storage;try{return globalThis.localStorage??null;}catch{return null;}}

export function createExplorationSaveStorage({storage}={}){
  const target=resolveStorage(storage);
  return Object.freeze({
    read(){if(!target)return{ok:false,status:"unavailable",save:null};let raw,sourceKey=SAVE_STORAGE_KEY;try{raw=target.getItem(SAVE_STORAGE_KEY);if(!raw)for(const legacyKey of LEGACY_SAVE_STORAGE_KEYS){raw=target.getItem(legacyKey);if(raw){sourceKey=legacyKey;break;}}if(!raw)return{ok:true,status:"empty",save:null};let parsed;try{parsed=JSON.parse(raw);}catch(error){return{ok:false,status:"invalid",save:null,error,sourceKey};}if(parsed?.version===SAVE_SCHEMA_VERSION)return{ok:true,status:"loaded",save:parseExplorationSave(raw),sourceKey};let migrated;try{migrated=migrateExplorationSave(parsed);}catch(error){return{ok:false,status:"incompatible",save:null,error,version:parsed?.version,sourceKey};}try{target.setItem(SAVE_BACKUP_KEY,raw);target.setItem(SAVE_STORAGE_KEY,serializeExplorationSave(migrated));}catch(error){return{ok:false,status:"migration-write-failed",save:null,error,sourceKey};}return{ok:true,status:"migrated",save:migrated,fromVersion:parsed.version,sourceKey,backupKey:SAVE_BACKUP_KEY};}catch(error){return{ok:false,status:"invalid",save:null,error,sourceKey};}},
    write(save){if(!target)return{ok:false,status:"unavailable"};try{target.setItem(SAVE_STORAGE_KEY,serializeExplorationSave(save));return{ok:true,status:"saved",updatedAt:save.meta.updatedAt};}catch(error){return{ok:false,status:"write-failed",error};}},
    remove(){if(!target)return{ok:false,status:"unavailable"};try{target.removeItem(SAVE_STORAGE_KEY);for(const legacyKey of LEGACY_SAVE_STORAGE_KEYS)target.removeItem(legacyKey);return{ok:true,status:"removed"};}catch(error){return{ok:false,status:"remove-failed",error};}},
    readBackup(){if(!target)return{ok:false,status:"unavailable",raw:null};try{const raw=target.getItem(SAVE_BACKUP_KEY);return{ok:true,status:raw?"backup":"empty",raw};}catch(error){return{ok:false,status:"backup-read-failed",raw:null,error};}},
  });
}

export class AutosaveController{
  constructor({snapshot,storage=createExplorationSaveStorage(),intervalMs=15000,setIntervalFn=globalThis.setInterval?.bind(globalThis),clearIntervalFn=globalThis.clearInterval?.bind(globalThis)}={}){
    if(typeof snapshot!=="function")throw new TypeError("Une fonction d’instantané est requise.");
    this.snapshot=snapshot;this.storage=storage;this.intervalMs=Math.max(5000,Number(intervalMs)||15000);this.setIntervalFn=setIntervalFn;this.clearIntervalFn=clearIntervalFn;this.timer=null;this.dirty=false;this.ready=false;this.saving=false;this.lastResult=null;
  }
  start(){if(this.ready)return false;this.ready=true;this.dirty=true;if(this.setIntervalFn)this.timer=this.setIntervalFn(()=>this.flush("interval"),this.intervalMs);return true;}
  markDirty({immediate=false,reason="change"}={}){this.dirty=true;return immediate?this.flush(reason):null;}
  flush(reason="manual"){if(!this.ready||!this.dirty||this.saving)return{ok:false,status:!this.ready?"not-ready":this.saving?"busy":"clean"};this.saving=true;try{const result=this.storage.write(this.snapshot());this.lastResult={...result,reason};if(result.ok)this.dirty=false;return this.lastResult;}catch(error){this.lastResult={ok:false,status:"snapshot-failed",reason,error};return this.lastResult;}finally{this.saving=false;}}
  stop({flush=false}={}){if(flush)this.flush("stop");if(this.timer!=null&&this.clearIntervalFn)this.clearIntervalFn(this.timer);this.timer=null;this.ready=false;return this.lastResult;}
}

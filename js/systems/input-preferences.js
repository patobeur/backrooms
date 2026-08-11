import {DEFAULT_INPUT_PROFILE,INPUT_CATALOG,INPUT_PROFILES,RESERVED_INPUT_CODES,cloneInputBindings,validateInputBindings} from "./input-bindings.js";
import {translate} from "./i18n.js";

export const INPUT_PREFERENCES_VERSION=3;
export const INPUT_STORAGE_KEY=`backrooms.controls.v${INPUT_PREFERENCES_VERSION}`;

const actionIds=new Set(INPUT_CATALOG.map(action=>action.id)),reservedCodes=new Set(RESERVED_INPUT_CODES);

function availableStorage(storage){if(storage)return storage;try{return globalThis.localStorage??null;}catch{return null;}}
function snapshot(profile,bindings,{source="memory",recovered=false,layout=profile==="qwerty"?"qwerty":"azerty"}={}){return Object.freeze({version:INPUT_PREFERENCES_VERSION,profile,layout,bindings:Object.freeze(Object.fromEntries(Object.entries(bindings).map(([action,codes])=>[action,Object.freeze([...codes])]))),source,recovered});}

export function createInputPreferences(profile=DEFAULT_INPUT_PROFILE){if(!INPUT_PROFILES[profile])throw new TypeError(translate("input.error.unknownProfile",{profile}));return snapshot(profile,cloneInputBindings(profile),{source:"default"});}

export function saveInputPreferences(preferences,storage){const target=availableStorage(storage),validation=validateInputBindings(preferences?.bindings);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));const profile=preferences.profile==="custom"?"custom":INPUT_PROFILES[preferences.profile]?preferences.profile:DEFAULT_INPUT_PROFILE,layout=preferences.layout==="qwerty"?"qwerty":"azerty",payload={version:INPUT_PREFERENCES_VERSION,profile,layout,bindings:cloneInputBindings(preferences.bindings)};let saved=false;try{if(target){target.setItem(INPUT_STORAGE_KEY,JSON.stringify(payload));saved=true;}}catch{}return snapshot(profile,payload.bindings,{source:saved?"storage":"memory",layout});}

export function loadInputPreferences(storage){const target=availableStorage(storage),fallback=createInputPreferences();if(!target)return fallback;try{const raw=target.getItem(INPUT_STORAGE_KEY);if(!raw)return fallback;const parsed=JSON.parse(raw);if(parsed?.version!==INPUT_PREFERENCES_VERSION||!validateInputBindings(parsed.bindings).valid)return snapshot(fallback.profile,fallback.bindings,{source:"default",recovered:true});const profile=parsed.profile==="custom"?"custom":INPUT_PROFILES[parsed.profile]?parsed.profile:DEFAULT_INPUT_PROFILE,layout=parsed.layout==="qwerty"?"qwerty":parsed.profile==="qwerty"?"qwerty":"azerty";return snapshot(profile,parsed.bindings,{source:"storage",layout});}catch{return snapshot(fallback.profile,fallback.bindings,{source:"default",recovered:true});}}

export function selectInputProfile(profile,storage){return saveInputPreferences(createInputPreferences(profile),storage);}
export function resetInputPreferences(profile=DEFAULT_INPUT_PROFILE,storage){return selectInputProfile(profile,storage);}

export function remapInputBinding(preferences,action,code,{slot=0,replaceConflict=false,storage}={}){
  if(!actionIds.has(action))throw new TypeError(translate("input.error.unknownAction",{action}));if(typeof code!=="string"||!code)throw new TypeError(translate("input.error.invalidBinding",{action}));if(reservedCodes.has(code))throw new TypeError(translate("input.error.reservedBinding",{code}));
  const bindings=cloneInputBindings(preferences?.bindings??DEFAULT_INPUT_PROFILE),targetCodes=bindings[action],index=Math.max(0,Math.min(targetCodes.length-1,Math.floor(Number(slot)||0))),previousCode=targetCodes[index],conflict=Object.entries(bindings).find(([other,codes])=>other!==action&&codes.includes(code));
  if(conflict&&!replaceConflict)return Object.freeze({changed:false,conflict:Object.freeze({code,action:conflict[0]}),preferences:snapshot(preferences?.profile??DEFAULT_INPUT_PROFILE,bindings,{layout:preferences?.layout})});
  if(conflict){const[other,codes]=conflict,conflictIndex=codes.indexOf(code);codes[conflictIndex]=previousCode;}
  targetCodes[index]=code;const validation=validateInputBindings(bindings);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));const updated=saveInputPreferences({profile:"custom",layout:preferences?.layout,bindings},storage);return Object.freeze({changed:true,conflict:conflict?Object.freeze({code,action:conflict[0]}):null,preferences:updated});
}

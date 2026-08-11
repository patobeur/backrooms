export const INPUT_ACTIONS=Object.freeze({
  MOVE_FORWARD:"move-forward",
  MOVE_BACKWARD:"move-backward",
  MOVE_LEFT:"move-left",
  MOVE_RIGHT:"move-right",
  RUN:"run",
  INVENTORY:"inventory",
  INTERACT:"interact",
  EXAMINE:"examine",
  COMBINE:"combine",
  POWER_PLUSH:"power-plush",
  DROP:"drop",
  DRINK:"drink",
});

export const INPUT_CATEGORIES=Object.freeze({MOVEMENT:"movement",INTERACTION:"interaction",INVENTORY:"inventory"});
export const INPUT_BEHAVIORS=Object.freeze({HOLD:"hold",PRESS:"press"});

export const INPUT_CATALOG=Object.freeze([
  {id:INPUT_ACTIONS.MOVE_FORWARD,label:"AVANCER",category:INPUT_CATEGORIES.MOVEMENT,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.MOVE_BACKWARD,label:"RECULER",category:INPUT_CATEGORIES.MOVEMENT,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.MOVE_LEFT,label:"ALLER À GAUCHE",category:INPUT_CATEGORIES.MOVEMENT,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.MOVE_RIGHT,label:"ALLER À DROITE",category:INPUT_CATEGORIES.MOVEMENT,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.RUN,label:"COURIR",category:INPUT_CATEGORIES.MOVEMENT,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.INVENTORY,label:"INVENTAIRE",category:INPUT_CATEGORIES.INVENTORY,behavior:INPUT_BEHAVIORS.HOLD},
  {id:INPUT_ACTIONS.INTERACT,label:"INTERAGIR / PRENDRE",category:INPUT_CATEGORIES.INTERACTION,behavior:INPUT_BEHAVIORS.PRESS},
  {id:INPUT_ACTIONS.EXAMINE,label:"EXAMINER",category:INPUT_CATEGORIES.INTERACTION,behavior:INPUT_BEHAVIORS.PRESS},
  {id:INPUT_ACTIONS.COMBINE,label:"COMBINER",category:INPUT_CATEGORIES.INVENTORY,behavior:INPUT_BEHAVIORS.PRESS},
  {id:INPUT_ACTIONS.POWER_PLUSH,label:"ALLUMER LE LAPIN",category:INPUT_CATEGORIES.INVENTORY,behavior:INPUT_BEHAVIORS.PRESS},
  {id:INPUT_ACTIONS.DROP,label:"DÉPOSER",category:INPUT_CATEGORIES.INVENTORY,behavior:INPUT_BEHAVIORS.PRESS},
  {id:INPUT_ACTIONS.DRINK,label:"BOIRE",category:INPUT_CATEGORIES.INVENTORY,behavior:INPUT_BEHAVIORS.PRESS},
].map(action=>Object.freeze({...action,labelKey:`input.action.${action.id}`,categoryKey:`input.category.${action.category}`,required:true,remappable:true})));

const azerty={
  [INPUT_ACTIONS.MOVE_FORWARD]:["KeyZ","ArrowUp"],
  [INPUT_ACTIONS.MOVE_BACKWARD]:["KeyS","ArrowDown"],
  [INPUT_ACTIONS.MOVE_LEFT]:["KeyQ","ArrowLeft"],
  [INPUT_ACTIONS.MOVE_RIGHT]:["KeyD","ArrowRight"],
  [INPUT_ACTIONS.RUN]:["ControlLeft"],
  [INPUT_ACTIONS.INVENTORY]:["Tab"],
  [INPUT_ACTIONS.INTERACT]:["KeyE"],
  [INPUT_ACTIONS.EXAMINE]:["KeyF"],
  [INPUT_ACTIONS.COMBINE]:["KeyC"],
  [INPUT_ACTIONS.POWER_PLUSH]:["KeyH"],
  [INPUT_ACTIONS.DROP]:["KeyG"],
  [INPUT_ACTIONS.DRINK]:["KeyR"],
};
const qwerty={...azerty,[INPUT_ACTIONS.MOVE_FORWARD]:["KeyW","ArrowUp"],[INPUT_ACTIONS.MOVE_LEFT]:["KeyA","ArrowLeft"]};

function freezeProfile(profile){return Object.freeze(Object.fromEntries(Object.entries(profile).map(([action,codes])=>[action,Object.freeze([...codes])])));}

export const INPUT_PROFILES=Object.freeze({azerty:freezeProfile(azerty),qwerty:freezeProfile(qwerty)});
export const DEFAULT_INPUT_PROFILE="azerty";
export const RESERVED_INPUT_CODES=Object.freeze(["Escape","F2","F5","F11","F12"]);
export const INPUT_CONFLICT_POLICY=Object.freeze({allowSharedCodes:false,resolution:"confirm-replace",ignoreModifiedBrowserShortcuts:true});

const actionIds=new Set(INPUT_CATALOG.map(action=>action.id)),reservedCodes=new Set(RESERVED_INPUT_CODES);

export function cloneInputBindings(profile=DEFAULT_INPUT_PROFILE){const source=typeof profile==="string"?INPUT_PROFILES[profile]:profile;if(!source)throw new TypeError(translate("input.error.unknownProfile",{profile}));return Object.fromEntries(Object.entries(source).map(([action,codes])=>[action,[...codes]]));}

export function findInputConflicts(bindings){const owners=new Map(),conflicts=[];for(const[action,codes]of Object.entries(bindings??{}))for(const code of Array.isArray(codes)?codes:[]){if(!owners.has(code))owners.set(code,[]);owners.get(code).push(action);}for(const[code,actions]of owners)if(actions.length>1)conflicts.push(Object.freeze({code,actions:Object.freeze(actions)}));return Object.freeze(conflicts);}

export function validateInputBindings(bindings,{requireAll=true}={}){const errors=[];if(!bindings||typeof bindings!=="object"||Array.isArray(bindings))errors.push(translate("input.error.invalidConfig"));else{for(const action of INPUT_CATALOG){const codes=bindings[action.id];if(requireAll&&(!Array.isArray(codes)||!codes.length))errors.push(translate("input.error.requiredAction",{action:action.id}));}for(const[action,codes]of Object.entries(bindings)){if(!actionIds.has(action)){errors.push(translate("input.error.unknownAction",{action}));continue;}if(!Array.isArray(codes)||!codes.length){errors.push(translate("input.error.noBinding",{action}));continue;}for(const code of codes){if(typeof code!=="string"||!code)errors.push(translate("input.error.invalidBinding",{action}));else if(reservedCodes.has(code))errors.push(translate("input.error.reservedBinding",{code}));}}}const conflicts=findInputConflicts(bindings);if(conflicts.length&&!INPUT_CONFLICT_POLICY.allowSharedCodes)errors.push(...conflicts.map(conflict=>translate("input.error.conflict",{code:conflict.code,actions:conflict.actions.join(", ")})));return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),conflicts});}

const readableCodes=Object.freeze({ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",ControlLeft:"CTRL",ControlRight:"CTRL",ShiftLeft:"input.code.shift",ShiftRight:"input.code.shift",Space:"input.code.space",Tab:"TAB",Enter:"input.code.enter",MouseBack:"input.code.mouseBack",MouseForward:"input.code.mouseForward"});
export function keyboardEventInputCode(event){const key=String(event?.key??"");if(/^.$/u.test(key)&&/^[a-z]$/i.test(key))return `Key${key.toUpperCase()}`;if(/^\d$/.test(key))return `Digit${key}`;return event?.code??"";}
export function pointerEventInputCode(event){return event?.button===3?"MouseBack":event?.button===4?"MouseForward":"";}
export function formatInputCode(code){if(readableCodes[code])return readableCodes[code].startsWith("input.")?translate(readableCodes[code]):readableCodes[code];if(/^Key[A-Z]$/.test(code))return code.slice(3);if(/^Digit\d$/.test(code))return code.slice(5);return String(code??"").toUpperCase();}
import {translate} from "./i18n.js";

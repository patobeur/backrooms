import {AnchorRegistry,crossedAnchor,isInsideAnchor,mapThroughAnchors} from "./transition-anchor.js";

export const TRANSITION_TYPES=Object.freeze({
  WALL:"wall",
  FLOOR:"floor",
  DOOR:"door",
  OBJECT:"object",
  DARKNESS:"darkness",
});

const VALID_TYPES=new Set(Object.values(TRANSITION_TYPES));

function normalizeEndpoint(endpoint,label){
  if(!endpoint||!Number.isInteger(endpoint.level)||endpoint.level<1)throw new TypeError(`${label}.level doit être un entier positif.`);
  if(typeof endpoint.anchor!=="string"||!endpoint.anchor.trim())throw new TypeError(`${label}.anchor doit être un identifiant non vide.`);
  return Object.freeze({level:endpoint.level,anchor:endpoint.anchor.trim()});
}

export function defineTransition(definition){
  if(!definition||typeof definition!=="object")throw new TypeError("La transition doit être un objet.");
  if(typeof definition.id!=="string"||!definition.id.trim())throw new TypeError("La transition doit posséder un id non vide.");
  if(!VALID_TYPES.has(definition.type))throw new TypeError(`Type de transition inconnu : ${definition.type}`);
  const source=normalizeEndpoint(definition.source,"source"),target=normalizeEndpoint(definition.target,"target"),reversible=definition.reversible!==false,physicalConnection=definition.physicalConnection??definition.type===TRANSITION_TYPES.DOOR;
  if(definition.type===TRANSITION_TYPES.DOOR&&!physicalConnection)throw new TypeError("Une porte doit utiliser une connexion physique.");
  return Object.freeze({
    id:definition.id.trim(),
    type:definition.type,
    source,
    target,
    reversible,
    physicalConnection:Boolean(physicalConnection),
    enabledWhen:definition.enabledWhen??"always",
    returnTransitionId:reversible?(definition.returnTransitionId?.trim()||`${definition.id.trim()}:return`):null,
    metadata:Object.freeze({...definition.metadata}),
  });
}

export class TransitionManager{
  constructor(){this.transitions=new Map();this.byLevel=new Map();this.anchors=new AnchorRegistry();this.blockedAnchors=new Set();}

  registerAnchor(definition){return this.anchors.register(definition);}
  getAnchor(level,id){return this.anchors.get(level,id);}

  register(definition){
    const transition=defineTransition(definition);
    if(this.transitions.has(transition.id))throw new Error(`Transition déjà enregistrée : ${transition.id}`);
    if(transition.reversible&&this.transitions.has(transition.returnTransitionId))throw new Error(`Identifiant de retour déjà utilisé : ${transition.returnTransitionId}`);
    this.#store(transition);
    if(transition.reversible)this.#store(Object.freeze({...transition,id:transition.returnTransitionId,source:transition.target,target:transition.source,returnTransitionId:transition.id,metadata:Object.freeze({...transition.metadata,isReturn:true})}));
    return transition;
  }

  #store(transition){this.transitions.set(transition.id,transition);const levelTransitions=this.byLevel.get(transition.source.level)??[];levelTransitions.push(transition);this.byLevel.set(transition.source.level,levelTransitions);}

  get(id){return this.transitions.get(id)??null;}
  forLevel(levelNumber){return[...(this.byLevel.get(levelNumber)??[])];}
  getReturnDescriptor(id){
    const transition=this.get(id);if(!transition?.reversible)return null;
    return this.get(transition.returnTransitionId);
  }

  releaseExitedAnchors(levelNumber,position,margin=0.35){for(const key of [...this.blockedAnchors]){const anchor=this.anchors.anchors.get(key);if(anchor&&anchor.level===levelNumber&&!isInsideAnchor(anchor,position,margin))this.blockedAnchors.delete(key);}}

  tryCrossing({levelNumber,previousPosition,currentPosition,yaw=0,pitch=0,velocity={x:0,y:0,z:0},isEnabled=()=>true,exitOffset=0.65}){
    this.releaseExitedAnchors(levelNumber,currentPosition);
    for(const transition of this.forLevel(levelNumber)){
      const source=this.getAnchor(transition.source.level,transition.source.anchor),target=this.getAnchor(transition.target.level,transition.target.anchor);
      if(!source||!target||this.blockedAnchors.has(source.key)||!isEnabled(transition))continue;
      const crossing=crossedAnchor(source,previousPosition,currentPosition);if(!crossing)continue;
      const mapped=mapThroughAnchors(source,target,{position:currentPosition,yaw,pitch,velocity},{exitOffset});
      this.blockedAnchors.add(target.key);
      return Object.freeze({transition,crossing,sourceAnchor:source,targetAnchor:target,targetLevel:transition.target.level,...mapped});
    }
    return null;
  }

  clear(){this.transitions.clear();this.byLevel.clear();this.anchors.clear();this.blockedAnchors.clear();}
}

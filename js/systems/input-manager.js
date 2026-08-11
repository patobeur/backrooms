import {DEFAULT_INPUT_PROFILE,INPUT_BEHAVIORS,INPUT_CATALOG,cloneInputBindings,keyboardEventInputCode,pointerEventInputCode,validateInputBindings} from "./input-bindings.js";

const catalogById=new Map(INPUT_CATALOG.map(action=>[action.id,action]));

export class InputManager{
  constructor({target=globalThis,bindings=DEFAULT_INPUT_PROFILE}={}){
    if(!target?.addEventListener||!target?.removeEventListener)throw new TypeError("Une cible d’événements valide est requise.");
    this.target=target;this.activeSources=new Map();this.pressHandlers=new Map();this.releaseHandlers=new Map();this.codeActions=new Map();this.keyboardSources=new Map();this.disposed=false;this.enabled=true;
    this.setBindings(bindings);
    this.onKeyDown=event=>this.#keyDown(event);this.onKeyUp=event=>this.#keyUp(event);this.onMouseDown=event=>this.#mouseDown(event);this.onMouseUp=event=>this.#mouseUp(event);this.onAuxClick=event=>this.#blockSideNavigation(event);this.onBlur=()=>this.releaseAll();
    target.addEventListener("keydown",this.onKeyDown);target.addEventListener("keyup",this.onKeyUp);target.addEventListener("blur",this.onBlur);
    target.addEventListener("mousedown",this.onMouseDown,true);target.addEventListener("mouseup",this.onMouseUp,true);target.addEventListener("auxclick",this.onAuxClick,true);
  }
  setBindings(bindings){const copy=cloneInputBindings(bindings),validation=validateInputBindings(copy);if(!validation.valid)throw new TypeError(validation.errors.join(" | "));this.releaseAll();this.bindings=copy;this.codeActions.clear();for(const[action,codes]of Object.entries(copy))for(const code of codes)this.codeActions.set(code,action);return this;}
  onPress(action,handler){return this.#subscribe(this.pressHandlers,action,handler);}
  onRelease(action,handler){return this.#subscribe(this.releaseHandlers,action,handler);}
  isActive(action){return Boolean(this.activeSources.get(action)?.size);}
  setEnabled(enabled){this.enabled=Boolean(enabled);if(!this.enabled)this.releaseAll();return this.enabled;}
  activate(action,source=`manual:${action}`){this.#assertAction(action);const sources=this.activeSources.get(action)??new Set(),wasActive=sources.size>0;if(sources.has(source))return false;sources.add(source);this.activeSources.set(action,sources);if(!wasActive)this.#emit(this.pressHandlers,action);return true;}
  deactivate(action,source=`manual:${action}`){const sources=this.activeSources.get(action);if(!sources?.delete(source))return false;if(!sources.size){this.activeSources.delete(action);this.#emit(this.releaseHandlers,action);}return true;}
  releaseAll(){for(const[action,sources]of [...this.activeSources])for(const source of [...sources])this.deactivate(action,source);this.keyboardSources.clear();}
  dispose(){if(this.disposed)return;this.disposed=true;this.releaseAll();this.target.removeEventListener("keydown",this.onKeyDown);this.target.removeEventListener("keyup",this.onKeyUp);this.target.removeEventListener("mousedown",this.onMouseDown,true);this.target.removeEventListener("mouseup",this.onMouseUp,true);this.target.removeEventListener("auxclick",this.onAuxClick,true);this.target.removeEventListener("blur",this.onBlur);this.pressHandlers.clear();this.releaseHandlers.clear();}
  #assertAction(action){if(!catalogById.has(action))throw new TypeError(`Action inconnue : ${action}`);}
  #subscribe(registry,action,handler){this.#assertAction(action);if(typeof handler!=="function")throw new TypeError("Le gestionnaire doit être une fonction.");const handlers=registry.get(action)??new Set();handlers.add(handler);registry.set(action,handlers);return()=>{handlers.delete(handler);if(!handlers.size)registry.delete(action);};}
  #emit(registry,action){for(const handler of registry.get(action)??[])handler(action);}
  #modifiedBrowserShortcut(event){return Boolean(event.metaKey||event.altKey||(event.ctrlKey&&!/^Control(Left|Right)$/.test(event.code)));}
  #keyDown(event){if(this.disposed||!this.enabled||this.#modifiedBrowserShortcut(event))return;const inputCode=keyboardEventInputCode(event),action=this.codeActions.get(inputCode);if(!action)return;event.preventDefault?.();if(event.repeat||this.keyboardSources.has(event.code))return;const source=`keyboard:${event.code}`;this.keyboardSources.set(event.code,{action,source});this.activate(action,source);}
  #keyUp(event){const active=this.keyboardSources.get(event.code);if(!active)return;event.preventDefault?.();this.keyboardSources.delete(event.code);this.deactivate(active.action,active.source);}
  #blockSideNavigation(event){if(pointerEventInputCode(event)){event.preventDefault?.();event.stopImmediatePropagation?.();return true;}return false;}
  #mouseDown(event){const code=pointerEventInputCode(event);if(!code)return;this.#blockSideNavigation(event);if(this.disposed||!this.enabled)return;const action=this.codeActions.get(code);if(!action||this.keyboardSources.has(code))return;const source=`mouse:${code}`;this.keyboardSources.set(code,{action,source});this.activate(action,source);}
  #mouseUp(event){const code=pointerEventInputCode(event);if(!code)return;this.#blockSideNavigation(event);const active=this.keyboardSources.get(code);if(!active)return;this.keyboardSources.delete(code);this.deactivate(active.action,active.source);}
}

export function inputActionBehavior(action){return catalogById.get(action)?.behavior??null;}
export function isHoldInputAction(action){return inputActionBehavior(action)===INPUT_BEHAVIORS.HOLD;}

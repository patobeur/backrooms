import {normalizeUnitContainer} from "./unit-container.js";

export const UNIT_INDICATOR_MODES=Object.freeze({CELLS:"cells",BAR:"bar",TEXT:"text"});

export function createUnitIndicatorModel(container,{maxCells=8,barLimit=32}={}){
  const state=normalizeUnitContainer(container),mode=state.capacity<=Math.max(1,maxCells)?UNIT_INDICATOR_MODES.CELLS:state.capacity<=Math.max(maxCells,barLimit)?UNIT_INDICATOR_MODES.BAR:UNIT_INDICATOR_MODES.TEXT;
  return Object.freeze({mode,units:state.units,capacity:state.capacity,ratio:state.units/state.capacity,state:state.units===0?"empty":state.units===state.capacity?"full":"partial",unitKind:state.unitKind});
}

export function renderUnitIndicator(container,{documentRef=globalThis.document,label="",maxCells=8,barLimit=32}={}){
  const model=createUnitIndicatorModel(container,{maxCells,barLimit}),root=documentRef.createElement("span");root.className=`unit-indicator unit-indicator--${model.mode}`;root.setAttribute("role","img");root.setAttribute("aria-label",label||`${model.units}/${model.capacity}`);root.dataset.state=model.state;
  if(model.mode===UNIT_INDICATOR_MODES.CELLS)for(let index=0;index<model.capacity;index++){const cell=documentRef.createElement("i");if(index<model.units)cell.className="filled";root.append(cell);}
  else if(model.mode===UNIT_INDICATOR_MODES.BAR){const track=documentRef.createElement("i"),fill=documentRef.createElement("b"),text=documentRef.createElement("small");track.className="unit-indicator-track";fill.className="unit-indicator-fill";fill.style.width=`${model.ratio*100}%`;track.append(fill);text.textContent=`${model.units}/${model.capacity}`;root.append(track,text);}
  else root.textContent=`${model.units}/${model.capacity}`;
  return root;
}

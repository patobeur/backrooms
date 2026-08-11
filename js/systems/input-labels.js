import {INPUT_ACTIONS,formatInputCode} from "./input-bindings.js";

export function inputActionLabel(preferences,action){
  return formatInputCode(preferences?.bindings?.[action]?.[0]??"");
}

export function movementInputLabel(preferences){
  return [INPUT_ACTIONS.MOVE_FORWARD,INPUT_ACTIONS.MOVE_LEFT,INPUT_ACTIONS.MOVE_BACKWARD,INPUT_ACTIONS.MOVE_RIGHT]
    .map(action=>inputActionLabel(preferences,action)).join("");
}

export function refreshInputLabels(root,preferences){
  if(!root?.querySelectorAll)return;
  for(const node of root.querySelectorAll("[data-input-action]"))node.textContent=inputActionLabel(preferences,node.dataset.inputAction);
  for(const node of root.querySelectorAll("[data-input-movement]"))node.textContent=movementInputLabel(preferences);
}

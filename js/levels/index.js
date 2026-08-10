import {levelDefault} from "./level-default.js";
import {level01} from "./level-01.js";

const levels=new Map([[level01.id,level01]]);

export function getLevelConfig(id) {
  return levels.get(id)||levelDefault;
}

export function hasLevelConfig(id) {
  return levels.has(id);
}

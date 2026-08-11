import {levelDefault} from "./level-default.js";
import {level01} from "./level-01.js";
import {level02} from "./level-02.js";
import {level03} from "./level-03.js";

const levels=new Map([[level01.id,level01],[level02.id,level02],[level03.id,level03]]);

export function getLevelConfig(id) {
  return levels.get(id)||levelDefault;
}

export function hasLevelConfig(id) {
  return levels.has(id);
}

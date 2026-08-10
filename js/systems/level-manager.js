import {generateMazeChunk,nextChunkOriginX} from "../maze.js";
import {getLevelConfig} from "../levels/index.js";

export class LevelManager {
  constructor(worldSeed,{getConfig=getLevelConfig,generate=generateMazeChunk}={}){
    this.worldSeed=worldSeed;
    this.getConfig=getConfig;
    this.generate=generate;
    this.records=new Map();
    this.loaded=new Set();
    this.activeLevel=1;
    this.previousLevel=null;
    this.nextLevel=2;
  }

  ensure(levelNumber){
    const normalized=Math.max(1,Math.floor(levelNumber));
    if(this.records.has(normalized)){
      const existing=this.records.get(normalized);
      if(!existing.maze)existing.maze=this.generate(existing.index,existing.originX,this.worldSeed,existing.config.maze,existing.originZ);
      return existing;
    }
    if(normalized>1)this.ensure(normalized-1);
    const previous=this.records.get(normalized-1),config=this.getConfig(normalized),isolated=config.placement?.mode==="isolated",originX=isolated?Number(config.placement.x):previous?nextChunkOriginX(previous.maze,config.maze):0,originZ=isolated?Number(config.placement.z):previous?previous.bounds.maxZ:0,index=normalized-1,maze=this.generate(index,originX,this.worldSeed,config.maze,originZ),record={levelNumber:normalized,index,config,originX,originZ,maze,bounds:{minX:originX,maxX:originX+maze.worldWidth,minZ:originZ,maxZ:originZ+maze.worldLength}};
    this.records.set(normalized,record);
    return record;
  }

  setActive(levelNumber,{previousLevel,nextLevel}={}){
    const normalized=Math.max(1,Math.floor(levelNumber)),oldActive=this.activeLevel;
    if(normalized!==oldActive)this.previousLevel=previousLevel??oldActive;
    else if(previousLevel!==undefined)this.previousLevel=previousLevel;
    this.activeLevel=normalized;
    this.nextLevel=nextLevel??normalized+1;
    this.ensure(this.activeLevel);
    return this.activeLevel;
  }

  prepareNext(levelNumber){this.nextLevel=Math.max(1,Math.floor(levelNumber));return this.ensure(this.nextLevel);}

  getActive(){return this.ensure(this.activeLevel);}

  findByPosition(x,z){
    for(const record of this.records.values())if(x>=record.bounds.minX&&x<record.bounds.maxX&&z>=record.bounds.minZ&&z<record.bounds.maxZ)return record;
    return null;
  }

  streamingWindow(){
    const wanted=new Set([this.previousLevel,this.activeLevel,this.nextLevel].filter(level=>Number.isInteger(level)&&level>=1)),records=[];
    for(const number of wanted){records.push(this.ensure(number));this.loaded.add(number);}
    for(const number of [...this.loaded])if(!wanted.has(number)){this.loaded.delete(number);const record=this.records.get(number);if(record)record.maze=null;}
    return records;
  }

  shouldRemainLoaded(levelNumber){return this.loaded.has(levelNumber);}

  getLoadedRecords(){return[...this.loaded].sort((a,b)=>a-b).map(number=>this.ensure(number));}

  clear(){this.records.clear();this.loaded.clear();this.activeLevel=1;this.previousLevel=null;this.nextLevel=2;}
}

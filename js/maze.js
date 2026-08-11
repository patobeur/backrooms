import {DEFAULT_MAZE} from "./config.js";

export const MAZE_SIZE=DEFAULT_MAZE.width;
export const CELL_SIZE=DEFAULT_MAZE.cellSize;
export const ENTRY_COLUMN=Math.floor(MAZE_SIZE/2);
export const CHUNK_LENGTH=DEFAULT_MAZE.height*CELL_SIZE;

const DIRS=[[0,-1,"n","s"],[1,0,"e","w"],[0,1,"s","n"],[-1,0,"w","e"]];

function normalizeMazeConfig(config={}){
  const width=Math.max(5,Math.floor(config.width??DEFAULT_MAZE.width));
  const height=Math.max(5,Math.floor(config.height??DEFAULT_MAZE.height));
  const cellSize=Math.max(2,Number(config.cellSize??DEFAULT_MAZE.cellSize));
  const roomCount=Math.max(0,Math.floor(config.roomCount??config.roomFractions?.length??DEFAULT_MAZE.roomFractions.length)),roomFractions=config.roomFractions??Array.from({length:roomCount},(_,index)=>(index+1)/(roomCount+1));
  return{
    width,
    height,
    cellSize,
    entryColumn:Math.max(0,Math.min(width-1,Math.floor(config.entryColumn??width/2))),
    generationAttempts:Math.max(1,Math.floor(config.generationAttempts??DEFAULT_MAZE.generationAttempts)),
    roomFractions,
    roomProfile:config.roomProfile??"small",
    roomSize:Array.isArray(config.roomSize)?config.roomSize:null,
    corridorBias:Math.max(0,Math.min(.95,Number(config.corridorBias??.35))),
    wallDensity:Math.max(0,Math.min(1,Number(config.wallDensity??.9))),
    architecture:{columnsChance:Math.max(0,Math.min(1,Number(config.architecture?.columnsChance??0)))},
  };
}

function randomFactory(seed){let value=seed>>>0;return()=>{value+=0x6d2b79f5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function freshCells(width,height){return Array.from({length:height},()=>Array.from({length:width},()=>({n:true,e:true,s:true,w:true,seen:false})));}

function carveMaze(random,config){
  const{width,height,entryColumn,corridorBias}=config,cells=freshCells(width,height),stack=[[entryColumn,0,null]];cells[0][entryColumn].seen=true;
  while(stack.length){const[x,y,previousDirection]=stack[stack.length-1],choices=DIRS.filter(([dx,dy])=>cells[y+dy]?.[x+dx]&&!cells[y+dy][x+dx].seen);if(!choices.length){stack.pop();continue;}const straight=choices.find(choice=>choice[2]===previousDirection),choice=straight&&random()<corridorBias?straight:choices[Math.floor(random()*choices.length)],[dx,dy,from,to]=choice;cells[y][x][from]=false;cells[y+dy][x+dx][to]=false;cells[y+dy][x+dx].seen=true;stack.push([x+dx,y+dy,from]);}
  return cells;
}

function analyze(cells,config){
  const{width,height,entryColumn}=config,distance=Array.from({length:height},()=>Array(width).fill(-1)),previous=new Map(),queue=[[entryColumn,0]];distance[0][entryColumn]=0;previous.set(`${entryColumn},0`,null);
  for(let cursor=0;cursor<queue.length;cursor++){const[x,y]=queue[cursor];for(const[dx,dy,side]of DIRS){if(cells[y][x][side])continue;const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(cells[ny]?.[nx]&&distance[ny][nx]<0){distance[ny][nx]=distance[y][x]+1;previous.set(key,[x,y]);queue.push([nx,ny]);}}}
  let exitColumn=0;for(let x=1;x<width;x++)if(distance[height-1][x]>distance[height-1][exitColumn])exitColumn=x;
  const path=[];let cursor=[exitColumn,height-1];while(cursor){path.push(cursor);cursor=previous.get(`${cursor[0]},${cursor[1]}`);}path.reverse();return{exitColumn,steps:distance[height-1][exitColumn],path};
}

function roomRange(profile,random,size){if(size){const min=Math.max(2,Math.floor(size[0])),max=Math.max(min,Math.floor(size[1]??min));return min+Math.floor(random()*(max-min+1));}if(profile==="large")return 3+Math.floor(random()*3);if(profile==="mixed")return 2+Math.floor(random()*4);return random()>.4?3:2;}
function carveRooms(cells,path,random,config){
  const{width:mazeWidth,height:mazeHeight,roomFractions,roomProfile}=config,rooms=[];
  for(const fraction of roomFractions){const anchor=path[Math.round((path.length-1)*fraction)];if(!anchor)continue;const width=Math.min(mazeWidth-2,roomRange(roomProfile,random,config.roomSize)),height=Math.min(mazeHeight-2,roomRange(roomProfile,random,config.roomSize));if(width<2||height<2)continue;const x=Math.max(1,Math.min(mazeWidth-width-1,anchor[0]-Math.floor(width/2))),y=Math.max(1,Math.min(mazeHeight-height-1,anchor[1]-Math.floor(height/2)));if(rooms.some(room=>x<room.x+room.width+1&&x+width+1>room.x&&y<room.y+room.height+1&&y+height+1>room.y))continue;for(let ry=y;ry<y+height;ry++)for(let rx=x;rx<x+width;rx++){if(rx<x+width-1){cells[ry][rx].e=false;cells[ry][rx+1].w=false;}if(ry<y+height-1){cells[ry][rx].s=false;cells[ry+1][rx].n=false;}}rooms.push({x,y,width,height});}
  return rooms;
}

function carveLoops(cells,random,config){const chance=(1-config.wallDensity)*.42;for(let y=1;y<config.height-1;y++)for(let x=1;x<config.width-1;x++){if(x<config.width-1&&cells[y][x].e&&random()<chance){cells[y][x].e=false;cells[y][x+1].w=false;}if(y<config.height-1&&cells[y][x].s&&random()<chance){cells[y][x].s=false;cells[y+1][x].n=false;}}}
function architectureFeatures(rooms,random,config){const features=[];for(const room of rooms)if(room.width>=3&&room.height>=3&&random()<config.architecture.columnsChance)features.push({type:"column",x:room.x+Math.floor(room.width/2),y:room.y+Math.floor(room.height/2)});return features;}

export function generateMazeChunk(index,originX,worldSeed,mazeConfig=DEFAULT_MAZE,originZ){
  const config=normalizeMazeConfig(mazeConfig);let best=null;
  for(let attempt=0;attempt<config.generationAttempts;attempt++){const random=randomFactory(worldSeed+index*104729+attempt*8191),cells=carveMaze(random,config),first=analyze(cells,config),rooms=carveRooms(cells,first.path,random,config);carveLoops(cells,random,config);const final=analyze(cells,config),features=architectureFeatures(rooms,random,config);if(!best||final.steps>best.steps)best={cells,rooms,features,exitColumn:final.exitColumn,steps:final.steps};}
  const{cells,rooms,features,exitColumn}=best,{width,height,cellSize,entryColumn}=config;cells[0][entryColumn].n=false;cells[height-1][exitColumn].s=false;
  return{index,originX,originZ:originZ??index*height*cellSize,width,height,cellSize,worldWidth:width*cellSize,worldLength:height*cellSize,entryColumn,exitColumn,cells,rooms,features,layout:{roomProfile:config.roomProfile,roomCount:config.roomFractions.length,corridorBias:config.corridorBias,wallDensity:config.wallDensity}};
}

export function nextChunkOriginX(chunk,nextMazeConfig=DEFAULT_MAZE){
  const next=normalizeMazeConfig(nextMazeConfig),exitWorldX=chunk.originX+(chunk.exitColumn+.5)*chunk.cellSize;
  return exitWorldX-(next.entryColumn+.5)*next.cellSize;
}

export function findMazePath(chunk,fromWorldX,fromWorldZ,toWorldX,toWorldZ){
  const width=chunk.width??chunk.cells[0].length,height=chunk.height??chunk.cells.length,cellSize=chunk.cellSize??CELL_SIZE,clampX=value=>Math.max(0,Math.min(width-1,value)),clampY=value=>Math.max(0,Math.min(height-1,value)),fromX=clampX(Math.floor((fromWorldX-chunk.originX)/cellSize)),fromY=clampY(Math.floor((fromWorldZ-chunk.originZ)/cellSize)),toX=toWorldX===undefined?chunk.exitColumn:clampX(Math.floor((toWorldX-chunk.originX)/cellSize)),toY=toWorldZ===undefined?height-1:clampY(Math.floor((toWorldZ-chunk.originZ)/cellSize)),queue=[[fromX,fromY]],previous=new Map([[`${fromX},${fromY}`,null]]);
  for(let cursor=0;cursor<queue.length;cursor++){const[x,y]=queue[cursor];if(x===toX&&y===toY)break;for(const[dx,dy,side]of DIRS){if(chunk.cells[y][x][side])continue;const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(chunk.cells[ny]?.[nx]&&!previous.has(key)){previous.set(key,[x,y]);queue.push([nx,ny]);}}}
  if(!previous.has(`${toX},${toY}`))return[];
  const result=[];let cursor=[toX,toY];while(cursor){result.push(cursor);cursor=previous.get(`${cursor[0]},${cursor[1]}`);}result.reverse();return result.map(([x,y])=>({x:chunk.originX+(x+.5)*cellSize,z:chunk.originZ+(y+.5)*cellSize}));
}

export const MAZE_SIZE = 17;
export const CELL_SIZE = 5;
export const ENTRY_COLUMN = Math.floor(MAZE_SIZE / 2);
export const CHUNK_LENGTH = MAZE_SIZE * CELL_SIZE;

const DIRS = [[0,-1,"n","s"],[1,0,"e","w"],[0,1,"s","n"],[-1,0,"w","e"]];

function randomFactory(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshCells() {
  return Array.from({length: MAZE_SIZE}, () => Array.from({length: MAZE_SIZE}, () => ({n:true,e:true,s:true,w:true,seen:false})));
}

function carveMaze(random) {
  const cells = freshCells();
  const stack = [[ENTRY_COLUMN,0]];
  cells[0][ENTRY_COLUMN].seen=true;
  while (stack.length) {
    const [x,y] = stack[stack.length-1];
    const choices = DIRS.filter(([dx,dy]) => cells[y+dy]?.[x+dx] && !cells[y+dy][x+dx].seen);
    if (!choices.length) { stack.pop(); continue; }
    const [dx,dy,from,to] = choices[Math.floor(random()*choices.length)];
    cells[y][x][from]=false;
    cells[y+dy][x+dx][to]=false;
    cells[y+dy][x+dx].seen=true;
    stack.push([x+dx,y+dy]);
  }
  return cells;
}

function analyze(cells) {
  const distance = Array.from({length:MAZE_SIZE}, () => Array(MAZE_SIZE).fill(-1));
  const previous = new Map();
  const queue = [[ENTRY_COLUMN,0]];
  distance[0][ENTRY_COLUMN] = 0;
  previous.set(`${ENTRY_COLUMN},0`, null);
  for (let cursor=0; cursor<queue.length; cursor++) {
    const [x,y] = queue[cursor];
    for (const [dx,dy,side] of DIRS) {
      if (cells[y][x][side]) continue;
      const nx=x+dx, ny=y+dy, key=`${nx},${ny}`;
      if (cells[ny]?.[nx] && distance[ny][nx] < 0) {
        distance[ny][nx] = distance[y][x] + 1;
        previous.set(key,[x,y]); queue.push([nx,ny]);
      }
    }
  }
  let exitColumn=0;
  for (let x=1;x<MAZE_SIZE;x++) if (distance[MAZE_SIZE-1][x] > distance[MAZE_SIZE-1][exitColumn]) exitColumn=x;
  const path=[];
  let cursor=[exitColumn,MAZE_SIZE-1];
  while(cursor){path.push(cursor);cursor=previous.get(`${cursor[0]},${cursor[1]}`);}
  path.reverse();
  return {exitColumn, steps:distance[MAZE_SIZE-1][exitColumn], path};
}

function carveRooms(cells,path,random) {
  const rooms=[];
  for (const fraction of [.22,.46,.68]) {
    const anchor=path[Math.round((path.length-1)*fraction)];
    if(!anchor)continue;
    const width=random()>.4?3:2,height=random()>.4?3:2;
    const x=Math.max(1,Math.min(MAZE_SIZE-width-1,anchor[0]-Math.floor(width/2)));
    const y=Math.max(1,Math.min(MAZE_SIZE-height-1,anchor[1]-Math.floor(height/2)));
    if(rooms.some(r=>x<r.x+r.width+2&&x+width+2>r.x&&y<r.y+r.height+2&&y+height+2>r.y))continue;
    for(let ry=y;ry<y+height;ry++)for(let rx=x;rx<x+width;rx++){
      if(rx<x+width-1){cells[ry][rx].e=false;cells[ry][rx+1].w=false;}
      if(ry<y+height-1){cells[ry][rx].s=false;cells[ry+1][rx].n=false;}
    }
    rooms.push({x,y,width,height});
  }
  return rooms;
}

export function generateMazeChunk(index, originX, worldSeed) {
  let best=null;
  for(let attempt=0;attempt<20;attempt++){
    const random=randomFactory(worldSeed+index*104729+attempt*8191);
    const cells=carveMaze(random);
    const first=analyze(cells);
    const rooms=carveRooms(cells,first.path,random);
    const final=analyze(cells);
    if(!best||final.steps>best.steps)best={cells,rooms,exitColumn:final.exitColumn,steps:final.steps};
  }
  const {cells,rooms,exitColumn}=best;
  cells[0][ENTRY_COLUMN].n=false;
  cells[MAZE_SIZE-1][exitColumn].s=false;
  return {index,originX,originZ:index*CHUNK_LENGTH,entryColumn:ENTRY_COLUMN,exitColumn,cells,rooms};
}

export function nextChunkOriginX(chunk) {
  return chunk.originX + (chunk.exitColumn-ENTRY_COLUMN)*CELL_SIZE;
}

export function findMazePath(chunk, fromWorldX, fromWorldZ, toWorldX, toWorldZ) {
  const clamp=v=>Math.max(0,Math.min(MAZE_SIZE-1,v));
  const fromX=clamp(Math.floor((fromWorldX-chunk.originX)/CELL_SIZE));
  const fromY=clamp(Math.floor((fromWorldZ-chunk.originZ)/CELL_SIZE));
  const toX=toWorldX===undefined?chunk.exitColumn:clamp(Math.floor((toWorldX-chunk.originX)/CELL_SIZE));
  const toY=toWorldZ===undefined?MAZE_SIZE-1:clamp(Math.floor((toWorldZ-chunk.originZ)/CELL_SIZE));
  const queue=[[fromX,fromY]], previous=new Map([[`${fromX},${fromY}`,null]]);
  for(let cursor=0;cursor<queue.length;cursor++){
    const[x,y]=queue[cursor]; if(x===toX&&y===toY)break;
    for(const[dx,dy,side]of DIRS){if(chunk.cells[y][x][side])continue;const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(chunk.cells[ny]?.[nx]&&!previous.has(key)){previous.set(key,[x,y]);queue.push([nx,ny]);}}
  }
  const result=[]; let cursor=[toX,toY];
  while(cursor){result.push(cursor);cursor=previous.get(`${cursor[0]},${cursor[1]}`);}
  result.reverse();
  return result.map(([x,y])=>({x:chunk.originX+(x+.5)*CELL_SIZE,z:chunk.originZ+(y+.5)*CELL_SIZE}));
}

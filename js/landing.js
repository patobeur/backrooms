import {generateMazeChunk,MAZE_SIZE} from "./maze.js";
import {initI18n,subscribeLocale,translate} from "./systems/i18n.js";

initI18n(document);

let seed=Math.floor(100000+Math.random()*899999);
const canvas=document.querySelector("#maze-map");
const context=canvas.getContext("2d");

function drawMap(value){
  const chunk=generateMazeChunk(0,0,value),pad=22,w=(canvas.width-pad*2)/MAZE_SIZE,h=(canvas.height-pad*2)/MAZE_SIZE;
  context.fillStyle="#111009";context.fillRect(0,0,canvas.width,canvas.height);
  context.strokeStyle="#c8bc5c";context.lineWidth=1.15;context.beginPath();
  chunk.cells.forEach((row,y)=>row.forEach((cell,x)=>{const x0=pad+x*w,y0=pad+y*h,x1=x0+w,y1=y0+h;if(cell.n){context.moveTo(x0,y0);context.lineTo(x1,y0)}if(cell.w){context.moveTo(x0,y0);context.lineTo(x0,y1)}if(x===MAZE_SIZE-1&&cell.e){context.moveTo(x1,y0);context.lineTo(x1,y1)}if(y===MAZE_SIZE-1&&cell.s){context.moveTo(x0,y1);context.lineTo(x1,y1)}}));context.stroke();
  context.fillStyle="#75d472";context.fillRect(pad+(chunk.entryColumn+.3)*w,pad-3,.4*w,6);
  context.fillStyle="#d95745";context.fillRect(pad+(chunk.exitColumn+.3)*w,canvas.height-pad-3,.4*w,6);
  seed=value;
  document.querySelector("#map-document").textContent=translate("map.document",{seed:value});
  document.querySelector("#landing-seed").textContent=value;document.querySelector("#system-seed").textContent=value;
}
drawMap(seed);
document.querySelector("#regenerate-map").addEventListener("click",()=>drawMap(Math.floor(100000+Math.random()*899999)));
subscribeLocale(()=>drawMap(seed));
document.querySelectorAll(".launch-game").forEach(button=>button.addEventListener("click",()=>document.querySelector("#play").click()));
let progress=0;
function updateSignal(){const maximum=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress=Math.min(1,Math.max(0,scrollY/maximum));document.documentElement.style.setProperty("--signal-hue",String(120-progress*120));}
addEventListener("scroll",updateSignal,{passive:true});updateSignal();
setInterval(()=>{const failureChance=.06+progress*.36;if(Math.random()<failureChance){document.documentElement.style.setProperty("--signal-opacity",Math.random()>.3?".08":"0");setTimeout(()=>document.documentElement.style.setProperty("--signal-opacity","1"),80+Math.random()*240)}},420);

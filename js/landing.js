import {generateMazeChunk,MAZE_SIZE} from "./maze.js";
import {getLocale,initI18n,subscribeLocale,translate} from "./systems/i18n.js";
import {readSaveReport} from "./systems/save-report.js";
import {deterministicReportVariant,formatReportDate,formatReportNumber,reportPluralKey} from "./systems/report-presentation.js";

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

const reportSection=document.querySelector("#exploration-report");
const reportElement=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
function formatReportDuration(seconds){const minutes=Math.max(0,Math.floor((Number(seconds)||0)/60)),hours=Math.floor(minutes/60),rest=minutes%60;return hours?translate("game.duration.hours",{hours,minutes:rest}):translate("game.duration.minutes",{minutes});}
function reportList(rows){const list=reportElement("ul","report-list");for(const row of rows){const item=reportElement("li");item.append(reportElement("span","report-list-primary",row.primary));if(row.doses){const meter=reportElement("span","report-dose-meter");meter.setAttribute("role","img");meter.setAttribute("aria-label",translate("report.inventory.doses",{count:row.doses.value,max:row.doses.max}));for(let index=0;index<row.doses.max;index++)meter.append(reportElement("i",index<row.doses.value?"filled":""));item.append(meter);}if(row.secondary)item.append(reportElement("small","",row.secondary));list.append(item);}return list;}
function fillReportSection(name,content){const article=reportSection?.querySelector(`[data-report-section="${name}"]`);if(!article)return;const slot=article.querySelector("[data-report-content]");slot.replaceChildren();article.hidden=!content;if(content)slot.append(content);}
function reportStat(label,value){const node=reportElement("div","report-stat");node.append(reportElement("small","",label),reportElement("strong","",value));return node;}
function renderExplorationReport(){
  if(!reportSection)return;
  const result=readSaveReport();
  if(!result.available){reportSection.hidden=true;return;}
  const report=result.report,summary=reportSection.querySelector("[data-report-summary]"),weak=Math.max(report.subject.needs.thirst,report.subject.needs.hunger)>=65;
  reportSection.hidden=false;
  const locale=getLocale(),narrative=deterministicReportVariant(report.subject.seed,"landing-intro",3);
  reportSection.querySelector("[data-report-intro]").textContent=translate(`report.narrative.${narrative}`,{level:formatReportNumber(report.subject.level,locale),duration:formatReportDuration(report.subject.elapsed)});
  const stamp=reportSection.querySelector("[data-report-coverage]");stamp.textContent=translate(`report.coverage.${report.coverage}`);stamp.classList.toggle("report-partial",report.coverage!=="complete");
  summary.replaceChildren(
    reportStat(translate("report.stat.level"),translate("game.level",{level:report.subject.level})),
    reportStat(translate("report.stat.duration"),formatReportDuration(report.subject.elapsed)),
    reportStat(translate("report.stat.inventory"),formatReportNumber(report.inventory.length,locale)),
    reportStat(translate("report.stat.status"),translate(weak?"report.status.weak":"report.status.stable"))
  );
  fillReportSection("inventory",report.sections.inventory?reportList(report.inventory.map(item=>({primary:item.nameKey?translate(item.nameKey,item.parameters):item.type,doses:item.type==="water_bottle"&&Number.isFinite(item.state.container?.units)?{value:Math.max(0,Math.min(item.state.container.capacity,item.state.container.units)),max:item.state.container.capacity}:null,secondary:item.level?translate("report.inventory.origin",{level:item.level}):""}))):null);
  fillReportSection("route",report.sections.route&&!report.unavailable.includes("route-history")?reportList(report.route.map(entry=>({primary:translate("report.route.entry",{level:formatReportNumber(entry.level,locale)}),secondary:translate(reportPluralKey("report.route.visits",entry.entries,locale),{count:formatReportNumber(entry.entries,locale)})}))):null);
  fillReportSection("milestones",report.sections.milestones?reportList(report.milestones.map(entry=>{const key=`report.milestone.${entry.type}`,translated=translate(key,{level:entry.level??report.subject.level});return{primary:translated===key?translate("report.milestone.generic"):translated};})):null);
  fillReportSection("encounters",report.sections.encounters&&!report.unavailable.includes("encounter-history")?reportList(report.encounters.map(entry=>{const nameKey=`creature.${entry.type}.name`,name=translate(nameKey),observed=entry.observed??0,chased=entry.chased??0;return{primary:translate("report.encounter.name",{name:name===nameKey?entry.type:name}),secondary:`${translate(reportPluralKey("report.encounter.observed",observed,locale),{count:formatReportNumber(observed,locale)})} · ${translate(reportPluralKey("report.encounter.chased",chased,locale),{count:formatReportNumber(chased,locale)})}`};})):null);
  if(report.sections.resources&&!report.unavailable.includes("resource-history")){const resources=reportElement("div","report-resources");for(const[label,value]of[[translate("report.resources.water"),report.resources.waterSips],[translate("report.resources.artifacts"),report.resources.artifacts],[translate("report.resources.thirst"),`${Math.round(report.resources.thirst)}%`],[translate("report.resources.hunger"),`${Math.round(report.resources.hunger)}%`]])resources.append(reportStat(label,value));fillReportSection("resources",resources);}else fillReportSection("resources",null);
  reportSection.querySelector("[data-report-updated]").textContent=translate("report.updated",{date:formatReportDate(report.subject.updatedAt,locale)});
}
renderExplorationReport();
subscribeLocale(()=>{drawMap(seed);renderExplorationReport();});
addEventListener("storage",event=>{if(event.key?.startsWith("backrooms.save."))renderExplorationReport();});
addEventListener("backrooms:save-changed",renderExplorationReport);
document.querySelector("#report-continue")?.addEventListener("click",()=>document.querySelector("#continue-game")?.click());
document.querySelectorAll(".launch-game").forEach(button=>button.addEventListener("click",()=>document.querySelector("#play").click()));
let progress=0;
function updateSignal(){const maximum=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress=Math.min(1,Math.max(0,scrollY/maximum));document.documentElement.style.setProperty("--signal-hue",String(120-progress*120));}
addEventListener("scroll",updateSignal,{passive:true});updateSignal();
setInterval(()=>{const failureChance=.06+progress*.36;if(Math.random()<failureChance){document.documentElement.style.setProperty("--signal-opacity",Math.random()>.3?".08":"0");setTimeout(()=>document.documentElement.style.setProperty("--signal-opacity","1"),80+Math.random()*240)}},420);

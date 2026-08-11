import {defineLevel} from "./level-default.js";

export const level02=defineLevel({
  id:2,
  name:"L’autre côté",
  nameKey:"level.2.name",
  maze:{width:17,height:17,cellSize:5,roomProfile:"small",roomCount:2,roomSize:[2,3],corridorBias:.84,wallDensity:.98,architecture:{columnsChance:.15}},
  placement:{mode:"isolated",x:10000,z:10000},
  objects:[
    {id:"water_full",quantity:2,placement:{strategy:"route",from:.18,to:.64,height:.05,lateral:[-.55,.5]}},
    {id:"book_blue",quantity:1,placement:{strategy:"route",progress:.78,height:.03,lateral:.4}},
  ],
  lighting:{mode:"flicker",spacing:4,intensity:2.45,distance:12,ambientIntensity:.34,color:0xffe082,panelColor:0xffefad},
  audio:{ambience:"unstable-grid",volume:.82,transitionSeconds:1.8,events:[{type:"buzz-drop",minDelay:9,maxDelay:19,spatial:true},{type:"metal-pop",minDelay:16,maxDelay:34,spatial:true}]},
  entrance:{type:"return-wall",graffiti:null},
  exit:{type:"open",lockedUntilGuide:false,opensWhen:null},
  guide:{enabled:true,leavesArtifact:true},
  creatures:[{type:"watcher",behavior:"observed-vanish",maxAlive:1,speed:0,sound:"metal-pop",spawn:{minDelay:15,maxDelay:28,minDistance:13,maxDistance:29,duration:8},perception:{alignment:.965,watchMs:450}}],
  transitions:[{
    id:"level-02-physical-door",
    type:"door",
    source:{level:2,anchor:"south-door"},
    target:{level:3,anchor:"north-door"},
    reversible:true,
    physicalConnection:true,
    enabledWhen:"always",
  }],
});

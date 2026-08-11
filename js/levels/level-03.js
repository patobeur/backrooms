import {defineLevel} from "./level-default.js";

export const level03=defineLevel({
  id:3,
  name:"Derrière la porte",
  maze:{width:17,height:17,cellSize:5,roomProfile:"mixed",roomCount:5,roomSize:[3,6],corridorBias:.2,wallDensity:.64,architecture:{columnsChance:.8}},
  placement:{mode:"physical-door",sourceLevel:2,sourceEdge:"south"},
  objects:[
    {id:"water_half",quantity:1,placement:{strategy:"route",progress:.3,height:.05,lateral:-.45}},
    {id:"book_green",quantity:2,placement:{strategy:"route",from:.5,to:.82,height:.03,lateral:[.55,-.5]}},
  ],
  lighting:{mode:"zones",spacing:3,intensity:2.1,distance:10,ambientIntensity:.12,color:0xffc75a,panelColor:0xffd879,zones:[{x:.05,y:.05,width:.42,height:.9},{x:.7,y:.42,width:.25,height:.48}]},
  audio:{ambience:"hollow-rooms",volume:.58,transitionSeconds:2.4,events:[{type:"distant-step",minDelay:11,maxDelay:24,spatial:true},{type:"metal-pop",minDelay:20,maxDelay:38,spatial:true}]},
  entrance:{type:"physical-door",graffiti:null},
  exit:{type:"open",lockedUntilGuide:false,opensWhen:null},
  guide:{enabled:false,leavesArtifact:false},
  creatures:[{type:"watcher",behavior:"stalker",maxAlive:1,speed:.42,sound:"distant-step",spawn:{minDelay:12,maxDelay:24,minDistance:11,maxDistance:26,duration:14},perception:{alignment:.95,watchMs:700,stopDistance:2.4}}],
});

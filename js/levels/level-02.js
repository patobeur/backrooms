import {defineLevel} from "./level-default.js";

export const level02=defineLevel({
  id:2,
  name:"L’autre côté",
  maze:{width:17,height:17,cellSize:5,roomProfile:"small"},
  placement:{mode:"isolated",x:10000,z:10000},
  entrance:{type:"return-wall",graffiti:null},
  exit:{type:"open",lockedUntilGuide:false,opensWhen:null},
  guide:{enabled:true,leavesArtifact:true},
  silhouettes:{enabled:true,startLevel:2},
});

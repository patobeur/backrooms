import {defineLevel} from "./level-default.js";

export const level01 = defineLevel({
  id: 1,
  name: "Le seuil jaune",
  maze: {
    width: 17,
    height: 17,
    cellSize: 5,
    roomProfile: "small",
  },
  objects: [
    {id:"plush",progress:0.02,height:0.08,lateral:-0.65},
    {id:"water_full",progress:0.035,height:0.05,lateral:0.7},
    {id:"book_red",progress:0.16,height:0.03,lateral:-0.45},
    {id:"water_half",progress:0.28,height:0.05,lateral:0.45},
    {id:"book_green",progress:0.40,height:0.03,lateral:0.45},
    {id:"battery",progress:0.55,height:0.06,lateral:0},
    {id:"book_blue",progress:0.68,height:0.03,lateral:-0.45},
    {id:"book_white",progress:0.82,height:0.03,lateral:0.4},
  ],
  guide: {
    enabled: true,
    leavesArtifact: true,
    activation: "fried-plush-dropped",
  },
  silhouettes: {
    enabled: true,
    startLevel: 2,
  },
  entrance: {
    type: "sealed-wall",
    graffiti: "pending",
  },
  exit: {
    type: "hidden-wall",
    lockedUntilGuide: true,
    opensWhen: "guide-complete",
  },
  transitions: [],
});

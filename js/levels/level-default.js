import {DEFAULT_MAZE} from "../config.js";

export const levelDefault = Object.freeze({
  id: 0,
  name: "Niveau sans nom",
  maze: Object.freeze({
    width: DEFAULT_MAZE.width,
    height: DEFAULT_MAZE.height,
    cellSize: DEFAULT_MAZE.cellSize,
    roomProfile: "small",
  }),
  appearance: Object.freeze({
    background: 0x111009,
    fog: 0x17150b,
    fogDensity: 0.034,
    wall: 0xb7a64f,
    floor: 0x5c5130,
    ceiling: 0xc2b96c,
    light: 0xffef9b,
    lightPanel: 0xfff6bc,
  }),
  lighting: Object.freeze({
    enabled: true,
    spacing: 4,
    intensity: 2.7,
    distance: 13,
  }),
  audio: Object.freeze({
    ambience: "fluorescent-hum",
  }),
  placement: Object.freeze({
    mode: "sequential",
    x: null,
    z: null,
  }),
  objects: Object.freeze([]),
  guide: Object.freeze({
    enabled: false,
    leavesArtifact: false,
  }),
  silhouettes: Object.freeze({
    enabled: false,
    startLevel: Number.POSITIVE_INFINITY,
  }),
  entrance: Object.freeze({
    type: "open",
    graffiti: null,
  }),
  exit: Object.freeze({
    type: "open",
    lockedUntilGuide: false,
    opensWhen: null,
  }),
  transitions: Object.freeze([]),
});

export function defineLevel(overrides) {
  return Object.freeze({
    ...levelDefault,
    ...overrides,
    maze: Object.freeze({...levelDefault.maze,...overrides.maze}),
    appearance: Object.freeze({...levelDefault.appearance,...overrides.appearance}),
    lighting: Object.freeze({...levelDefault.lighting,...overrides.lighting}),
    audio: Object.freeze({...levelDefault.audio,...overrides.audio}),
    placement: Object.freeze({...levelDefault.placement,...overrides.placement}),
    guide: Object.freeze({...levelDefault.guide,...overrides.guide}),
    silhouettes: Object.freeze({...levelDefault.silhouettes,...overrides.silhouettes}),
    entrance: Object.freeze({...levelDefault.entrance,...overrides.entrance}),
    exit: Object.freeze({...levelDefault.exit,...overrides.exit}),
    objects: Object.freeze([...(overrides.objects||levelDefault.objects)]),
    transitions: Object.freeze([...(overrides.transitions||levelDefault.transitions)]),
  });
}

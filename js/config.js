export const DEFAULT_MAZE = Object.freeze({
  width: 17,
  height: 17,
  cellSize: 5,
  generationAttempts: 20,
  roomFractions: Object.freeze([0.22, 0.46, 0.68]),
});

export const PLAYER = Object.freeze({
  height: 1.7,
  collisionRadius: 0.32,
  walkSpeed: 3.8,
  runSpeed: 6.4,
  idleDelay: 3000,
});

export const CAMERA = Object.freeze({
  fieldOfView: 72,
  near: 0.1,
  far: 110,
  mouseSensitivity: 0.0022,
});

export const ARCHITECTURE = Object.freeze({
  wallHeight: 3.25,
  wallThickness: 0.13,
  exitSealDepth: 0.35,
});

export const RENDERING = Object.freeze({
  wallDistance: 50,
  wallSafetyMargin: 20,
  wallHysteresis: 5,
  maxPixelRatio: 1.6,
  interactionRefreshFrames: 3,
});

export const STREAMING = Object.freeze({
  levelsBehind: 1,
  levelsAhead: 1,
});

export const INTERACTION = Object.freeze({
  rayDistance: 4,
  proximityDistance: 3.2,
  proximityAlignment: 0.58,
});

export function resolveRestoredPlayerPosition(position,{levelNumber,findLevel,collides,fallback}){
  if(!Array.isArray(fallback)||fallback.length!==3||!fallback.every(Number.isFinite))throw new TypeError("Position de repli invalide.");
  const fallbackValid=!collides(fallback[0],fallback[2])&&findLevel(fallback[0],fallback[2])?.levelNumber===levelNumber;
  if(!fallbackValid)throw new RangeError("Aucune position de restauration sûre.");
  const requestedValid=Array.isArray(position)&&position.length===3&&position.every(Number.isFinite)&&!collides(position[0],position[2])&&findLevel(position[0],position[2])?.levelNumber===levelNumber;
  return Object.freeze([...(requestedValid?position:fallback)]);
}

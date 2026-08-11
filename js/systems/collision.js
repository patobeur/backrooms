export function distanceToBox(x,z,{x:centerX,z:centerZ,width,depth}){const dx=Math.max(Math.abs(x-centerX)-width/2,0),dz=Math.max(Math.abs(z-centerZ)-depth/2,0);return Math.hypot(dx,dz);}
export function circleIntersectsBox(x,z,radius,box){return distanceToBox(x,z,box)<radius;}

export function meshBoxDescriptor(mesh){const parameters=mesh?.geometry?.parameters;if(!parameters||!Number.isFinite(parameters.width)||!Number.isFinite(parameters.depth))return null;return{x:mesh.position.x,z:mesh.position.z,width:parameters.width,depth:parameters.depth};}

export function circleIntersectsMeshes(x,z,radius,meshes){for(const mesh of meshes){const box=meshBoxDescriptor(mesh);if(box&&circleIntersectsBox(x,z,radius,box))return true;}return false;}
export function distanceToMeshBox(x,z,mesh){const box=meshBoxDescriptor(mesh);return box?distanceToBox(x,z,box):Infinity;}

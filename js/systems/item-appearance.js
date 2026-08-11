import * as THREE from "../../vendor/three.module.min.js";

export function applyFriedPlushAppearance(object){
  object.traverse(child=>{if(!child.material)return;if(child.userData.plushPart==="fur"){child.material.color?.setHex(0x705548);child.material.roughness=1;}else if(child.userData.plushPart==="eye"){child.material.color?.setHex(0x351717);child.material.emissive?.setHex(0x4a0700);}});
  if(!object.children.some(child=>child.userData.burntIndicator)){const glow=new THREE.PointLight(0xff3b20,.45,1.8,2);glow.userData.burntIndicator=true;object.add(glow);}return object;
}

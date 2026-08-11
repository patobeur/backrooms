export function debugRequested(search=globalThis.location?.search??""){return new URLSearchParams(search).get("debug")==="1";}

export async function loadOptionalDebug(api,{search,importer=()=>import("../../debug/debug.js"),onUnavailable=()=>{}}={}){
  if(!debugRequested(search))return Object.freeze({requested:false,loaded:false,dispose(){}});
  try{const module=await importer();if(typeof module.installDebugTools!=="function")throw new TypeError("debug/debug.js doit exporter installDebugTools(api).");const installed=await module.installDebugTools(api),dispose=typeof installed==="function"?installed:typeof installed?.dispose==="function"?()=>installed.dispose():()=>{};return Object.freeze({requested:true,loaded:true,dispose});}
  catch(error){onUnavailable(error);return Object.freeze({requested:true,loaded:false,error,dispose(){}});}
}

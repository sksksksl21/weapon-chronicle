/* Weapon Chronicle module services V1
 * A deliberately small, synchronous integration boundary inside the existing
 * single-IIFE offline game. This is NOT a second game state or event bus.
 * Ownership stays with existing source modules; a consumer requests only its
 * provider's documented API. No saving, mutation or model invocation here.
 */
const WC_GAME_MODULES_V1=(()=>{
 "use strict";
 const services=new Map();
 function assertId(id){
   if(typeof id!=="string"||!/^[a-z][a-z0-9-]*$/.test(id))
     throw new TypeError("Invalid game module id");
 }
 function register(id,api){
   assertId(id);
   if(api===null||(typeof api!=="object"&&typeof api!=="function"))
     throw new TypeError("Module API must be an object or function: "+id);
   if(services.has(id))throw new Error("Duplicate game module: "+id);
   services.set(id,api);
   return api;
 }
 function requireService(id){
   assertId(id);
   if(!services.has(id))throw new Error("Missing game module dependency: "+id);
   return services.get(id);
 }
 function has(id){assertId(id);return services.has(id);}
 function list(){return Object.freeze([...services.keys()]);}
 return Object.freeze({register,require:requireService,has,list});
})();
if(typeof module!=="undefined"&&module.exports)
  module.exports=WC_GAME_MODULES_V1;

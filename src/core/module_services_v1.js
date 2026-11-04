/* Weapon Chronicle module services V1.
 * Existing register(id, api)/require(id) services stay synchronous and shared.
 * Lifecycle modules use register({id, dependencies, init, dispose}); initialize
 * is also accepted as the init hook. Hooks receive this registry as services.
 * initialize() validates the entire graph before running hooks, awaits each
 * dependency, and runs each module once. dispose() tears down in reverse order.
 * No game state, save fields or gameplay hooks are owned by this boundary.
 * Combat service: decorateCombatDocument installs a transient enemy decision
 * inside the iframe before bootstrap. WC_ENEMY_INTENT_V1.telegraph exposes only
 * decision id, turn and public kind; cancel clears the pending decision/UI.
 * AI selection and resolution share the retained legacy action identifier.
 * Existing heavy damage and guard/counter rules are reused without rebalance;
 * new multipliers or action types require a separate approved package.
 */
const WC_GAME_MODULES_V1=(()=>{
 "use strict";
 const services=new Map(), definitions=new Map(), active=[];
 const listeners=new Map();
 let busy=false;
 function assertId(id){
   if(typeof id!=="string"||!/^[a-z][a-z0-9-]*$/.test(id))
     throw new TypeError("Invalid game module id");
 }
 function assertEvent(topic){
   if(typeof topic!=="string"||!topic.trim())throw new TypeError("Invalid event topic");
 }
 function subscribe(topic,handler){
   assertEvent(topic);
   if(typeof handler!=="function")throw new TypeError("Event handler must be a function");
   const entry={handler};
   if(!listeners.has(topic))listeners.set(topic,new Set());
   const bucket=listeners.get(topic);
   bucket.add(entry);
   return ()=>{bucket.delete(entry);if(!bucket.size&&listeners.get(topic)===bucket)listeners.delete(topic);};
 }
 function publish(topic,payload){
   assertEvent(topic);
   // Snapshot delivery: subscriptions changed by a handler affect the next event.
   // Handler errors propagate to the publisher.
   for(const entry of [...(listeners.get(topic)||[])])entry.handler(payload);
 }
 const events=Object.freeze({subscribe,publish});
 function register(id,api){
   if(busy)throw new Error("Cannot register game modules during lifecycle execution");
   let definition;
   if(arguments.length===1&&id&&typeof id==="object"){
     definition=id;
     id=definition.id;
   }
   assertId(id);
   if(services.has(id)||definitions.has(id))throw new Error("Duplicate game module: "+id);
   if(definition){
     const dependencies=definition.dependencies===undefined?[]:definition.dependencies;
     if(!Array.isArray(dependencies))throw new TypeError("Module dependencies must be an array: "+id);
     dependencies.forEach(assertId);
     if(new Set(dependencies).size!==dependencies.length)throw new TypeError("Duplicate module dependency: "+id);
     const init=definition.init===undefined?definition.initialize:definition.init;
     if(init!==undefined&&typeof init!=="function")throw new TypeError("Module init must be a function: "+id);
     if(definition.dispose!==undefined&&typeof definition.dispose!=="function")throw new TypeError("Module dispose must be a function: "+id);
     // Snapshot the lifecycle contract so callers cannot alter a validated graph.
     definitions.set(id,{id,dependencies:[...dependencies],init,dispose:definition.dispose,definition,subscriptions:[]});
     return definition;
   }
   if(api===null||(typeof api!=="object"&&typeof api!=="function"))
     throw new TypeError("Module API must be an object or function: "+id);
   services.set(id,api);
   return api;
 }
 function requireService(id){
   assertId(id);
   if(!services.has(id))throw new Error("Missing game module dependency: "+id);
   return services.get(id);
 }
 function get(id){
   assertId(id);
   return services.has(id)?services.get(id):definitions.get(id)?.definition;
 }
 function has(id){assertId(id);return services.has(id)||definitions.has(id);}
 function list(){return Object.freeze([...new Set([...services.keys(),...definitions.keys()])]);}
 function initializationOrder(){
   const order=[], visiting=new Set(), visited=new Set();
   function visit(id,path){
     if(visiting.has(id))throw new Error("Circular game module dependency: "+[...path,id].join(" -> "));
     if(visited.has(id))return;
     const entry=definitions.get(id);
     if(!entry){
       if(!services.has(id))throw new Error("Missing game module dependency: "+id+" required by "+path.join(" -> "));
       return;
     }
     visiting.add(id);
     entry.dependencies.forEach(dep=>visit(dep,[...path,id]));
     visiting.delete(id);visited.add(id);order.push(entry);
   }
   definitions.forEach(entry=>visit(entry.id,[]));
   return order;
 }
 async function stop(entries){
   let failure;
   for(const entry of entries.reverse()){
     try{if(entry.dispose)await entry.dispose.call(entry.definition,registry);}
     catch(error){if(!failure)failure=error;}
     entry.subscriptions.splice(0).forEach(unsubscribe=>unsubscribe());
     services.delete(entry.id);
     active.splice(active.indexOf(entry),1);
   }
   if(failure)throw failure;
 }
 async function initialize(){
   if(busy)throw new Error("Game module lifecycle already running");
   const order=initializationOrder();
   busy=true;
   const started=[];
   try{
     for(const entry of order){
       if(active.includes(entry))continue;
       // Include the current module in rollback if its init partially fails.
       active.push(entry);started.push(entry);
       const context=Object.freeze({...registry,events:Object.freeze({publish,subscribe(topic,handler){
         const unsubscribe=subscribe(topic,handler);
         entry.subscriptions.push(unsubscribe);
         return unsubscribe;
       }})});
       const api=entry.init?await entry.init.call(entry.definition,context):undefined;
       services.set(entry.id,api===undefined?entry.definition:api);
     }
     return registry;
   }catch(error){
     try{await stop(started);}catch(cleanupError){
       // Preserve the initialization failure as the primary diagnostic.
     }
     throw error;
   }finally{busy=false;}
 }
 async function dispose(){
   if(busy)throw new Error("Game module lifecycle already running");
   busy=true;
   try{await stop([...active]);}finally{listeners.clear();busy=false;}
 }
 const registry=Object.freeze({register,require:requireService,get,has,list,initialize,dispose,events});
 return registry;
})();
if(typeof module!=="undefined"&&module.exports)
  module.exports=WC_GAME_MODULES_V1;

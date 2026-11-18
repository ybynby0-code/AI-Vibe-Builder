import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
const tools = [
  {name:"get_world_overview",description:"Get the current turn, status, player nation and national powers for an Imperium world.",inputSchema:{type:"object",properties:{world_id:{type:"string",description:"World UUID"}},required:["world_id"]}},
  {name:"list_provinces",description:"List provinces, ownership, terrain, population and resources in a world.",inputSchema:{type:"object",properties:{world_id:{type:"string"}},required:["world_id"]}},
  {name:"issue_order",description:"Submit a validated nation order for the current turn. Categories: build, move, recruit, research, diplomacy, trade, tax, policy, war, attack, fortify, mobilize.",inputSchema:{type:"object",properties:{world_id:{type:"string"},category:{type:"string",enum:["build","move","recruit","research","diplomacy","trade","tax","policy","war","attack","fortify","mobilize"]},payload:{type:"object"}},required:["world_id","category"]}},
  {name:"send_world_chat",description:"Send a message to the authenticated player's world chat.",inputSchema:{type:"object",properties:{world_id:{type:"string"},message:{type:"string"}},required:["world_id","message"]}},
  {name:"respond_to_treaty",description:"Accept or reject a treaty proposal addressed to the authenticated nation.",inputSchema:{type:"object",properties:{treaty_id:{type:"string"},accept:{type:"boolean"}},required:["treaty_id","accept"]}},
  {name:"advance_turn",description:"Resolve the current turn. Only the world host can do this.",inputSchema:{type:"object",properties:{world_id:{type:"string"}},required:["world_id"]}}
];
function json(id,result){return new Response(JSON.stringify({jsonrpc:"2.0",id,result}),{headers:cors})}
function fail(id,code,message){return new Response(JSON.stringify({jsonrpc:"2.0",id,error:{code,message}}),{status:200,headers:cors})}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return new Response("Method Not Allowed",{status:405});
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return fail(null,-32001,"A Supabase user access token is required.");
 const url=Deno.env.get("SUPABASE_URL")!;
 const key=Deno.env.get("SUPABASE_ANON_KEY")!;
 const supabase=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return fail(null,-32001,"Authentication failed.");
 let body:any;
 try{body=await req.json()}catch{return fail(null,-32700,"Invalid JSON body.")}
 const id=body.id??null,method=body.method;
 if(method==="initialize")return json(id,{protocolVersion:"2024-11-05",capabilities:{tools:{listChanged:false}},serverInfo:{name:"imperium-world-order",version:"0.1.0"}});
 if(method==="notifications/initialized"||method==="ping")return json(id,{});
 if(method==="tools/list")return json(id,{tools});
 if(method!=="tools/call")return fail(id,-32601,"Method not found.");
 const name=body.params?.name,args=body.params?.arguments||{};
 try{
  let data:any=null,error:any=null;
  if(name==="get_world_overview"){
   const [w,n,p]=await Promise.all([
    supabase.from("imperium_worlds").select("id,name,status,turn_no,host_id,created_at").eq("id",args.world_id).single(),
    supabase.from("imperium_nations").select("name,tag,government,treasury,stability,manpower,is_ai,owner_id").eq("world_id",args.world_id).order("treasury",{ascending:false}),
    supabase.from("imperium_players").select("user_id,nation_id,role").eq("world_id",args.world_id)
   ]);
   error=w.error||n.error||p.error;data={world:w.data,nations:n.data,players:p.data,requester:user.id};
  }else if(name==="list_provinces"){
   const r=await supabase.from("imperium_provinces").select("id,province_no,name,nation_id,x,y,terrain,population,development,fort_level,resources,building_levels").eq("world_id",args.world_id).order("province_no");data=r.data;error=r.error;
  }else if(name==="issue_order"){
   const r=await supabase.rpc("imperium_submit_order",{p_world:args.world_id,p_category:args.category,p_payload:args.payload||{}});data={order_id:r.data};error=r.error;
  }else if(name==="send_world_chat"){
   const r=await supabase.rpc("imperium_send_chat",{p_world:args.world_id,p_body:args.message});data={message_id:r.data};error=r.error;
  }else if(name==="respond_to_treaty"){
   const r=await supabase.rpc("imperium_respond_treaty",{p_treaty:args.treaty_id,p_accept:args.accept});data=r.data;error=r.error;
  }else if(name==="advance_turn"){
   const r=await supabase.rpc("imperium_advance_turn",{p_world:args.world_id});data=r.data;error=r.error;
  }else{return fail(id,-32602,"Unknown tool: "+String(name))}
  if(error)return fail(id,-32000,error.message||"Tool execution failed.");
  return json(id,{content:[{type:"text",text:JSON.stringify(data)}],isError:false});
 }catch(e){return fail(id,-32000,e instanceof Error?e.message:String(e))}
});
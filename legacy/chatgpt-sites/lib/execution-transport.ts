/** Reuse existing authenticated routes. Never invent an owner from tool arguments. */
export function executionRequest(parent:Request,path:string,body?:unknown){
 const headers=new Headers({'Content-Type':'application/json','Origin':new URL(parent.url).origin});
 for(const name of ['oai-authenticated-user-id','oai-authenticated-user-email','oai-authenticated-user-full-name']){const value=parent.headers.get(name);if(value)headers.set(name,value)}
 return new Request(new URL(path,parent.url),{method:body===undefined?'GET':'POST',headers,...body===undefined?{}:{body:JSON.stringify(body)}});
}

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('app/command-center.tsx','utf8');
const routing=source.slice(source.indexOf('const sections='),source.indexOf('const library='));
assert(routing.includes('const sectionForHash='),'sectionForHash must sit between sections and library');
const context={};
for(const icon of routing.matchAll(/icon:(\w+)/g))context[icon[1]]=null;
vm.createContext(context);
vm.runInContext(ts.transpile(routing,{target:ts.ScriptTarget.ES2022})+';globalThis.resolveView=sectionForHash;',context);
for(const [hash,expected,agent] of [['#projects','Projects',undefined],['#dashboard-chat/vanguard','Dashboard Chat','vanguard'],['#start-here','Start Here',undefined],['#home','Mission Control',undefined],['#money','Power & Credits',undefined],['#avengers','Avengers',undefined],['#decisions','Decisions',undefined]]){
 assert.equal(context.resolveView(hash.split('/')[0]),expected,hash);
 assert.equal(hash.split('/')[1],agent,hash);
}
const chat=source.match(/<DashboardChat\b[^]*?\/>/);
assert(chat,'DashboardChat mount missing');
for(const prop of ['active=','home=','items={items}','open={open}','navigate={navigate}'])assert(chat[0].includes(prop),prop);
for(const banned of ['selectedAgent','openRequest','selectAgent'])assert(!chat[0].includes(banned),banned);
assert(source.includes("navigate('Start Here')"));
assert(!source.includes('AgentInbox'));
assert(!source.includes("navigate('Dashboard Chat'"));
assert(source.includes('className="mc-skip"'));
assert(source.includes('id="mission-content"'));
assert(source.includes('avengers-shell'));
assert(!source.includes('canSend:true'));
console.log('PASS navigation: #projects #home #money #avengers #decisions plus legacy #start-here and #dashboard-chat; Chat with returns to Start Here; DashboardChat keeps active, home, items, open, navigate.');

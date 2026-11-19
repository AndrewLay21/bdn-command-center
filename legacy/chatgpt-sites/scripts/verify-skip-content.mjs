import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('app/command-center.tsx','utf8');
const ast=ts.createSourceFile('command-center.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler;
function visit(node){
 if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='a'&&node.attributes.properties.some(p=>p.name?.getText(ast)==='className'&&p.initializer?.text==='mc-skip'))handler=node.attributes.properties.find(p=>p.name?.getText(ast)==='onClick')?.initializer?.expression;
 ts.forEachChild(node,visit);
}
visit(ast);assert(handler,'Skip link must intercept default hash navigation');
const routing=source.slice(source.indexOf('const sections='),source.indexOf('const library='));
for(const [hash,expected,agent] of [['#dashboard-chat/vanguard','Dashboard Chat','vanguard'],['#projects','Projects',undefined]]){
 const location={hash};let activeElement=null,scrolled=false,prevented=false;
 const content={focus(options){assert.equal(options.preventScroll,true);activeElement=content},scrollIntoView(options){assert.equal(options.block,'start');assert.equal(options.behavior,'instant');scrolled=true}};
 const context={document:{getElementById(id){assert.equal(id,'mission-content');return content}},location};
 const icons=[...routing.matchAll(/icon:(\w+)/g)].map(m=>m[1]);for(const icon of icons)context[icon]=null;
 vm.createContext(context);
 vm.runInContext(ts.transpile(routing, {target:ts.ScriptTarget.ES2022})+';globalThis.resolveView=sectionForHash;',context);
 const click=vm.runInContext(handler.getText(ast),context);
 const before=context.resolveView(location.hash.split('/')[0]);assert.equal(before,expected);
 click({preventDefault(){prevented=true}});
 if(!prevented)location.hash='#mission-content';
 assert.equal(location.hash,hash);assert.equal(context.resolveView(location.hash.split('/')[0]),expected);assert.equal(location.hash.split('/')[1],agent);assert.equal(activeElement,content);assert(scrolled);
 console.log(`PASS ${expected}: view/hash/agent preserved; content focused and scrolled (DOM contract mock).`);
}

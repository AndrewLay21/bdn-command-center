const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cache={};
function load(path){
 if(cache[path])return cache[path];const exports={};cache[path]=exports;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,Set,Date,Intl,require(id){
  if(id.endsWith('.css'))return {};
  if(id.startsWith('@/'))return id.endsWith('.json')?JSON.parse(fs.readFileSync(id.slice(2))):load(id.slice(2)+'.ts');
  return require(id);
 }},{filename:path});return exports;
}
const {auditActionView}=load('lib/audit-action-view.ts');
const {AuditActions}=load('app/daily-audits.tsx');
const {createElement}=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const closed={id:'GAP-06',status:'Done',proof:'Owner-provided screenshot reviewed and saved; no keys listed.',updatedAt:'2026-10-28T16:20:00Z'};
const waiting={id:'GAP-10',status:'Waiting',proof:''};
const items=[closed,waiting],before=JSON.stringify(items);
const old='Relay the prepared GAP-06 handoff to Mansa in your existing conversation.';
assert.equal(auditActionView(old,items).allClosed,true);
for(const [text,records] of [[old,undefined],[old,[{...closed,status:'Waiting'}]],[old,[{...closed,proof:''}]],['Review GAP-060.',items],['Review GAP-06 and GAP-10.',items],['Review GAP-06 and GAP-999.',items],['Review the key task.',items]]){
 assert.equal(auditActionView(text,records).allClosed,false,'Do not hide unresolved, unknown, unavailable or unverified instructions');
}
assert.equal(auditActionView('GAP-06: review GAP-06.',items).closed.length,1);
const html=renderToStaticMarkup(createElement(AuditActions,{actions:[old,'Add Keep_Me_on_Track_Complete_Source.md to Sources.'],items,open(){}}));
assert.match(html,/GAP-06 · Done — view saved evidence/);
assert.match(html,/<details><summary>Read the earlier audit wording<\/summary><p>Relay the prepared GAP-06/,'Preserve exact earlier wording behind a disclosure');
assert.match(html,/Keep_Me_on_Track_Complete_Source\.md/,'Keep the complete filename, without truncation');
const unresolved=renderToStaticMarkup(createElement(AuditActions,{actions:['Review GAP-06 and GAP-10.'],items,open(){}}));
assert.doesNotMatch(unresolved,/<details>/,'Mixed closed/open work remains visible');
assert.equal(JSON.stringify(items),before,'Presentation must not mutate records');
console.log('PASS: exact record matches, evidence-qualified closure, conservative mixed/unknown handling, preserved source wording and immutable records.');

const assert = require('node:assert/strict');
const p = require('./compiled/publicReferences.js');
const a = require('./compiled/applicationReferences.js');
const results = [];
function check(name, actual, expected) { assert.equal(actual, expected, name); results.push(name); }
const privateRefs = ['editorial/evidence/neutral-audit-record-8941.json','media/imports/neutral-audit-record-8941.json','newsroom/records/neutral-audit-record-8941.json','https://example.com/news?1=neutralAudit8941','https://example.com/news#neutralAudit8941'];
for (const ref of privateRefs) {
  const variants = [ref, encodeURIComponent(ref), encodeURIComponent(encodeURIComponent(ref)), ref.replaceAll('/', '&#x2f;'), ref.replaceAll('/', '∕')];
  for (const [i, value] of variants.entries()) {
    check(`prose rejects ${ref} encoding ${i}`, p.publicText(value), false);
    check(`manifest rejects ${ref} encoding ${i}`, p.publicValue({summary:value}), false);
    check(`artifact rejects ${ref} encoding ${i}`, (()=>{try {p.assertPublicArtifact(value);return true;}catch{return false}})(), false);
  }
}
for (const value of ['https://example.com/story','/news/current-report','A/B teams played on 10/16/2026.','Dream big. Play harder.']) check(`legitimate content ${value}`, p.publicText(value), true);
for (const value of ['https://127.0.0.1/','https://localhost/','https://user:pass@example.com/story','file:///tmp/notes','https://example.com/private/notes','https://example.com/%70rivate/notes','https://example.com/story?token=abc','https://example.com/story#evidence']) check(`restricted URL ${value}`,p.publicReference(value),false);
const yt = a.youtubeReference('ABCDEFGHIJK');
check('registered playback accepted', (()=>{try {p.assertRenderedArtifact(yt.url,[yt]);return true}catch{return false}})(),true);
check('forged playback rejected', (()=>{try {p.assertRenderedArtifact(yt.url,[{url:yt.url}]);return true}catch{return false}})(),false);
check('private evidence rejected beside approved playback', (()=>{try {p.assertRenderedArtifact(yt.url+' media/imports/neutral-audit-record-8941.json',[yt]);return true}catch{return false}})(),false);
check('ordinary citation accepted',p.publicUrl('https://example.com/report'),true);
check('relative article link accepted',p.publicReference('/news/current-report',true),true);
console.log(JSON.stringify({runtime:process.version,source:'9ba6ca30de5c679c029ad7178a1fbe4e63d0e160',passed:results.length,failed:0,scope:'Directed policy-module checks only; no full build, rendering, browser, deployment or rights acceptance.',cases:results},null,2));

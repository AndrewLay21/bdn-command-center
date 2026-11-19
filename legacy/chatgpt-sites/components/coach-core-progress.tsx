const milestones = [
  {name:'S1 foundation', result:'Bounded PASS', pin:'49bd3f3', url:'pull/82'},
  {name:'S2a decoder', result:'Bounded PASS', pin:'dcf26be', url:'pull/83'},
  {name:'r4 server contract', result:'AGREED', pin:'6764af9', url:'issues/39#issuecomment-6292304060'},
  {name:'r4 client mirror', result:'Bounded PASS', pin:'19cca98', url:'pull/84#issuecomment-6293036734'},
  {name:'S2b test worker', result:'Two bounded PASS verdicts', pin:'da13f83', url:'issues/39#issuecomment-6299440851'},
  {name:'S1-C1 cleanup repair', result:'Two bounded PASS verdicts', pin:'7f3b757', url:'issues/39#issuecomment-6302114831'},
];

export function CoachCoreProgress({checkedAt,status,nextAction}:{checkedAt:string|null;status:string;nextAction:string}) {
  if (!checkedAt) return null;
  return <section className="cc-progress panel" aria-labelledby="cc-progress-heading">
    <div className="sectionhead"><div><span className="eyebrow">COACH CORE · DEVELOPMENT PROGRESS</span><h2 id="cc-progress-heading">What is done. What moves next.</h2></div><span className="cc-state open">MVP NO-GO · AI OFF</span></div>
    <div className="cc-milestone-list">{milestones.map(m=><a key={m.pin} href={'https://github.com/DigitalBlueprint239/coach-core-ai/'+m.url} target="_blank" rel="noopener noreferrer"><span className="cc-milestone-check" aria-hidden="true">✓</span><div><strong>{m.name}</strong><small>{m.result} · <code>{m.pin}</code></small></div></a>)}</div>
    <div className="cc-progress-next"><span className="eyebrow">CURRENT FILM WORK</span><strong>{status}</strong><p>{nextAction}</p></div>
    <p className="cc-progress-note">These are completed, bounded development milestones. The portfolio totals below count whole tasks; they do not increase for every component or repair. Full Film Analyzer integration and launch acceptance remain open.</p>
  </section>;
}

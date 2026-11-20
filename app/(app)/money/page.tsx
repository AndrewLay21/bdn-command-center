import { Heading } from "@/components/cc";

export default function Money() {
  return (
    <>
      <Heading title="Money" intro="Verified money sources only. Unknown is not zero." />
      <div className="ex-view">
        <section className="ex-money-summary">
          <div>
            <span className="mc-kicker">MONEY / VERIFIED SOURCES ONLY</span>
            <h2>Unknown is not zero.</h2>
            <p>Revenue, expenses and cash balances are not connected to this Command Center yet. No period or amount is guessed.</p>
          </div>
        </section>
        <section className="mc-panel">
          <h3>What this page will show once connected</h3>
          <p>Money in, money out, and bills that are due, each tied to the place it came from. Connecting a money source needs your approval first. Nothing here spends money.</p>
        </section>
      </div>
    </>
  );
}

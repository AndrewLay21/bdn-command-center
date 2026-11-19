import { Heading } from "@/components/cc";
import { workers } from "@/lib/team";
import InboxClient from "./inbox-client";

export const metadata = { title: "Agent inbox" };

export default function Inbox() {
  return (
    <>
      <Heading title="Agent inbox" intro="Write a note or mission for any Avenger. Saved as drafts only until messaging is connected." />
      <div className="ex-view">
        <InboxClient agents={workers.map((a) => ({ id: a.id, name: a.name }))} />
      </div>
    </>
  );
}

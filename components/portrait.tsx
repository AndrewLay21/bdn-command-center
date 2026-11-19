/* eslint-disable @next/next/no-img-element */
import { agentForOwner, initialsFor, type Agent } from "@/lib/team";

/** Round portrait, or a gold-initials badge when no picture exists. */
export function Portrait({ agent, owner, size = 40, variant = "bubble" }: { agent?: Agent; owner?: string; size?: number; variant?: "bubble" | "card" }) {
  const person = agent ?? agentForOwner(owner);
  const name = person?.name ?? owner ?? "Unassigned";
  const src = person?.image ?? null;
  return (
    <span className={`ap-portrait ap-${variant}`} style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size / 3.2)) }} role="img" aria-label={`${name} portrait`} data-image-state={src ? "image" : "initials"}>
      {src ? <img src={src} alt="" aria-hidden="true" width={size} height={size} loading="lazy" style={{ objectFit: "cover" }} /> : <span aria-hidden="true">{person?.initials ?? initialsFor(name)}</span>}
    </span>
  );
}

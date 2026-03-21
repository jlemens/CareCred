import type { Profile } from "@/lib/types";

/** Derive first/last fields for the editor from stored columns or legacy display_name. */
export function namesFromProfile(initial: Partial<Profile>): {
  first: string;
  last: string;
} {
  const fn = initial.first_name?.trim();
  const ln = initial.last_name?.trim();
  if (fn || ln) {
    return { first: fn ?? "", last: ln ?? "" };
  }
  const dn = (initial.display_name ?? "").trim();
  if (!dn) return { first: "", last: "" };
  const space = dn.indexOf(" ");
  if (space === -1) return { first: dn, last: "" };
  return {
    first: dn.slice(0, space).trim(),
    last: dn.slice(space + 1).trim(),
  };
}

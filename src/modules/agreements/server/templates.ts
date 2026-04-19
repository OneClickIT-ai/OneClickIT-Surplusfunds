import type { AgreementType } from "@prisma/client";

/**
 * Agreement templates.
 *
 * Templates are kept in code for v1 — they're stable, short, and don't need
 * end-user editing yet. When that changes, move them to a DB table and keep
 * the rendering signature (renderTemplate) identical.
 *
 * Placeholder syntax: {{field}} — field must exist on RenderContext or it
 * renders as an empty string (with a warning logged).
 */

export interface RenderContext {
  // Case/claim fields
  ownerName: string;
  countyName: string;
  state: string;
  propertyAddr?: string | null;
  parcelId?: string | null;
  amount?: number | null;
  deadlineDate?: Date | null;
  surplusType?: string | null;

  // Claimant
  claimantName?: string | null;
  claimantEmail?: string | null;
  claimantPhone?: string | null;
  claimantAddress?: string | null;

  // Firm / user
  firmName: string;
  firmContact: string;
  agentName: string;
  feePercent: number;

  // Generated
  today: string;
}

const TEMPLATES: Record<AgreementType, { title: string; body: string }> = {
  ENGAGEMENT: {
    title: "Engagement Agreement",
    body: `ENGAGEMENT AGREEMENT

This Engagement Agreement ("Agreement") is entered into on {{today}} between
{{firmName}} ("Firm") and {{claimantName}} ("Client").

PROPERTY / SURPLUS SUBJECT
  Owner of Record: {{ownerName}}
  Property Address: {{propertyAddr}}
  Parcel / APN: {{parcelId}}
  County: {{countyName}}, {{state}}
  Surplus Type: {{surplusType}}
  Known Deadline: {{deadlineDate}}
  Estimated Surplus: {{amount}}

SCOPE OF ENGAGEMENT
The Firm is engaged to identify, research, and recover surplus funds owed to
the Client in connection with the property and sale identified above.

FEE
Client agrees to pay the Firm {{feePercent}}% of all funds successfully
recovered. No fee is owed if no funds are recovered.

CONTACT
  Firm contact: {{firmContact}}
  Agent of record: {{agentName}}
  Client contact: {{claimantEmail}} / {{claimantPhone}}

By signing below, Client authorizes the Firm to act on their behalf solely for
the purpose of pursuing the surplus described above.

____________________________________
{{claimantName}} (Client)

____________________________________
{{agentName}} for {{firmName}}
`,
  },

  ASSIGNMENT: {
    title: "Assignment of Claim",
    body: `ASSIGNMENT OF CLAIM

Dated: {{today}}

For value received, {{claimantName}} ("Assignor"), whose address is
{{claimantAddress}}, hereby assigns to {{firmName}} ("Assignee") {{feePercent}}%
of any and all right, title, and interest in the surplus funds arising from
the sale of the property commonly known as {{propertyAddr}}, {{countyName}} County,
{{state}} (Parcel {{parcelId}}), originally held in the name of {{ownerName}}.

Assignor represents that they are the lawful party entitled to the surplus
described above and that no other assignment of the same surplus is
outstanding.

This Assignment is recorded solely for the purpose of the Assignee's recovery
of the surplus on behalf of the Assignor.

____________________________________
{{claimantName}} (Assignor)

____________________________________
{{agentName}} for {{firmName}} (Assignee)
`,
  },

  FEE_DISCLOSURE: {
    title: "Fee Disclosure",
    body: `FEE DISCLOSURE

Date: {{today}}
Client: {{claimantName}}
Matter: Surplus funds — {{ownerName}} — {{countyName}}, {{state}}

This disclosure summarizes the fee arrangement between Client and
{{firmName}}:

 1. The Firm's fee is {{feePercent}}% of funds actually recovered.
 2. Client pays no fee if no funds are recovered.
 3. The Firm advances routine filing costs; extraordinary costs (e.g. court
    filing fees, expert witnesses) will be discussed with Client in writing
    before they are incurred.
 4. Client may cancel this engagement at any time in writing; any fees already
    earned through recovered funds remain payable.

I have read and understand the above fee arrangement.

____________________________________
{{claimantName}}

____________________________________
Date
`,
  },
};

export function getTemplate(type: AgreementType): { title: string; body: string } {
  return TEMPLATES[type];
}

function formatAmount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

/** Render a template string with {{field}} substitutions. */
export function renderTemplate(body: string, ctx: RenderContext): string {
  const record = ctx as unknown as Record<string, unknown>;
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = record[key];
    if (v === undefined || v === null || v === "") return "—";
    if (v instanceof Date) return formatDate(v);
    if (typeof v === "number" && (key === "amount" || key.endsWith("Amount"))) {
      return formatAmount(v);
    }
    return String(v);
  });
}

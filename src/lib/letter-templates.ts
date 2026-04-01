/**
 * Claim letter templates with variable substitution.
 * Variables use {{VARIABLE_NAME}} syntax.
 */

export interface LetterTemplate {
  id: string;
  name: string;
  description: string;
  category: 'initial_claim' | 'owner_outreach' | 'follow_up' | 'assignment';
  variables: string[];
  body: string;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'initial-claim',
    name: 'Initial Surplus Funds Claim Letter',
    description: 'Submit to the county to initiate your claim for surplus funds.',
    category: 'initial_claim',
    variables: ['YOUR_NAME', 'YOUR_ADDRESS', 'YOUR_PHONE', 'YOUR_EMAIL', 'COUNTY_NAME', 'STATE', 'FILING_OFFICE', 'PROPERTY_ADDRESS', 'PARCEL_NUMBER', 'SALE_DATE', 'SURPLUS_AMOUNT', 'DATE'],
    body: `{{DATE}}

{{FILING_OFFICE}}
{{COUNTY_NAME}} County
{{STATE}}

Re: Claim for Surplus Funds — Parcel {{PARCEL_NUMBER}}

Dear Sir or Madam,

I am writing to submit a claim for surplus funds resulting from the tax sale/foreclosure of the property located at:

{{PROPERTY_ADDRESS}}
Parcel Number: {{PARCEL_NUMBER}}
Sale Date: {{SALE_DATE}}
Approximate Surplus Amount: {{SURPLUS_AMOUNT}}

I am the former owner of record / authorized representative of the former owner (select applicable) and am entitled to the excess proceeds from this sale pursuant to applicable state law.

Enclosed please find:
1. Completed claim form (if applicable)
2. Copy of government-issued photo ID
3. Proof of ownership (recorded deed / title documentation)
4. Any additional required documentation per your office's requirements

Please advise if any additional documentation is required to process this claim.

Sincerely,

{{YOUR_NAME}}
{{YOUR_ADDRESS}}
Phone: {{YOUR_PHONE}}
Email: {{YOUR_EMAIL}}`,
  },
  {
    id: 'owner-outreach',
    name: 'Former Owner Outreach Letter',
    description: 'Contact the former property owner to inform them of surplus funds.',
    category: 'owner_outreach',
    variables: ['YOUR_NAME', 'YOUR_COMPANY', 'YOUR_PHONE', 'YOUR_EMAIL', 'OWNER_NAME', 'OWNER_ADDRESS', 'PROPERTY_ADDRESS', 'COUNTY_NAME', 'STATE', 'SURPLUS_AMOUNT', 'DEADLINE_DATE', 'DATE'],
    body: `{{DATE}}

{{OWNER_NAME}}
{{OWNER_ADDRESS}}

Dear {{OWNER_NAME}},

I am writing to inform you that there may be unclaimed surplus funds owed to you as the former owner of the property located at:

{{PROPERTY_ADDRESS}}
{{COUNTY_NAME}} County, {{STATE}}

Following a tax sale / foreclosure, the property sold for more than the amount owed. The excess proceeds (approximately {{SURPLUS_AMOUNT}}) are being held by the county and may be claimed by you as the former owner of record.

Important: The deadline to claim these funds is {{DEADLINE_DATE}}. After this date, the funds may be forfeited to the county or state.

I specialize in helping former property owners recover these funds. If you would like assistance with this process, or if you have questions about your eligibility, please contact me at your earliest convenience.

There is no cost or obligation to respond to this letter.

Sincerely,

{{YOUR_NAME}}
{{YOUR_COMPANY}}
Phone: {{YOUR_PHONE}}
Email: {{YOUR_EMAIL}}`,
  },
  {
    id: 'follow-up',
    name: 'Follow-Up Letter to County',
    description: 'Follow up on a previously filed surplus funds claim.',
    category: 'follow_up',
    variables: ['YOUR_NAME', 'YOUR_PHONE', 'YOUR_EMAIL', 'COUNTY_NAME', 'STATE', 'FILING_OFFICE', 'PARCEL_NUMBER', 'CLAIM_DATE', 'CLAIM_REFERENCE', 'DATE'],
    body: `{{DATE}}

{{FILING_OFFICE}}
{{COUNTY_NAME}} County
{{STATE}}

Re: Follow-Up on Surplus Funds Claim
Parcel: {{PARCEL_NUMBER}}
Claim Filed: {{CLAIM_DATE}}
Reference #: {{CLAIM_REFERENCE}}

Dear Sir or Madam,

I am writing to follow up on my surplus funds claim submitted on {{CLAIM_DATE}} regarding the above-referenced parcel.

I would appreciate an update on the status of this claim, including:
1. Whether all required documentation has been received
2. The expected timeline for review and approval
3. Any additional information or documents needed

Please contact me at the information below at your earliest convenience.

Thank you for your attention to this matter.

Sincerely,

{{YOUR_NAME}}
Phone: {{YOUR_PHONE}}
Email: {{YOUR_EMAIL}}`,
  },
  {
    id: 'assignment-agreement',
    name: 'Assignment of Rights Agreement',
    description: 'Agreement for the property owner to assign their claim rights to you.',
    category: 'assignment',
    variables: ['AGENT_NAME', 'AGENT_COMPANY', 'AGENT_ADDRESS', 'OWNER_NAME', 'OWNER_ADDRESS', 'PROPERTY_ADDRESS', 'PARCEL_NUMBER', 'COUNTY_NAME', 'STATE', 'FEE_PERCENT', 'DATE'],
    body: `ASSIGNMENT OF SURPLUS FUNDS CLAIM

This Agreement is entered into on {{DATE}} by and between:

ASSIGNOR (Former Property Owner):
{{OWNER_NAME}}
{{OWNER_ADDRESS}}

ASSIGNEE (Recovery Agent):
{{AGENT_NAME}}
{{AGENT_COMPANY}}
{{AGENT_ADDRESS}}

PROPERTY:
{{PROPERTY_ADDRESS}}
Parcel Number: {{PARCEL_NUMBER}}
{{COUNTY_NAME}} County, {{STATE}}

TERMS:

1. ASSIGNMENT: The Assignor hereby assigns to the Assignee the right to collect surplus funds held by {{COUNTY_NAME}} County resulting from the tax sale/foreclosure of the above-described property.

2. COMPENSATION: In consideration for the Assignee's services in locating, filing for, and recovering the surplus funds, the Assignee shall receive {{FEE_PERCENT}}% of the total surplus funds recovered.

3. EXPENSES: The Assignee shall bear all costs associated with the recovery, including but not limited to filing fees, postage, and research costs.

4. DISTRIBUTION: Upon receipt of surplus funds from the county, the Assignee shall distribute the Assignor's share within 10 business days.

5. NO GUARANTEE: The Assignee makes no guarantee that surplus funds will be recovered. If no funds are recovered, the Assignor owes nothing.

6. CANCELLATION: The Assignor may cancel this agreement within 3 business days of signing by providing written notice.

AGREED:

_________________________          Date: ___________
{{OWNER_NAME}} (Assignor)

_________________________          Date: ___________
{{AGENT_NAME}} (Assignee)

IMPORTANT: This is a template only. Consult with a licensed attorney in your state before using. State laws governing assignment agreements vary.`,
  },
];

export function getTemplate(id: string): LetterTemplate | undefined {
  return LETTER_TEMPLATES.find(t => t.id === id);
}

export function fillTemplate(template: LetterTemplate, values: Record<string, string>): string {
  let result = template.body;
  for (const variable of template.variables) {
    result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), values[variable] || `[${variable}]`);
  }
  return result;
}

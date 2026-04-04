import { BookOpen, AlertTriangle, Scale, DollarSign, FileText, Search, Users, Shield } from 'lucide-react';
import Link from 'next/link';

const modules = [
  {
    number: 1,
    title: 'Introduction to Surplus Funds',
    icon: BookOpen,
    color: 'blue',
    sections: [
      {
        title: 'What Are Surplus Funds?',
        content: `When a property is sold at a tax sale or foreclosure auction for more than the amount owed in taxes, liens, or mortgage debt, the difference is called "surplus funds," "excess proceeds," or "overbid." This money legally belongs to the former property owner (or their heirs), not the county or the buyer.

For example: If a homeowner owes $5,000 in back taxes and their property sells at auction for $80,000, the $75,000 difference is surplus. The county holds this money and the former owner has the right to claim it.`,
      },
      {
        title: 'Types of Surplus Funds',
        content: `**Tax Sale Surplus (Excess Proceeds):** Generated when tax-delinquent property sells for more than the tax lien amount. Most common in CA, FL, TX, GA, and OH.

**Foreclosure Surplus (Overbid):** When a foreclosed property sells at sheriff's sale or trustee sale for more than the outstanding mortgage plus fees.

**Municipal/Code Enforcement Surplus:** Rare, but can occur when a municipality demolishes or sells a property for code violations.

**HOA Foreclosure Surplus:** When a homeowners association forecloses on a property for unpaid assessments.`,
      },
      {
        title: 'Why Do Surplus Funds Go Unclaimed?',
        content: `Billions of dollars in surplus funds sit unclaimed across the US because:
• Former owners don't know the funds exist
• Owners moved and didn't update their address with the county
• The owner passed away and heirs don't know about the surplus
• People assume the county keeps everything from a tax sale
• The notification process (often a single letter or newspaper notice) is inadequate
• Some owners are confused by the legal process and give up

**This creates an opportunity** for asset recovery professionals who locate these funds, find the rightful owners, and help them file claims — earning a percentage as compensation.`,
      },
    ],
  },
  {
    number: 2,
    title: 'Finding Surplus Funds',
    icon: Search,
    color: 'green',
    sections: [
      {
        title: 'Where to Find Surplus Funds Lists',
        content: `**County Government Websites:** Most counties publish surplus funds lists on their Treasurer, Tax Collector, or Clerk of Court websites. Our [County Directory](/directory) links directly to these pages for 90+ counties.

**Google Dork Searches:** Use targeted search queries to find county surplus pages. Our [Google Dork Tool](/dorks) generates state-specific searches. Example: \`site:*.gov "excess proceeds" county filetype:pdf\`

**State Unclaimed Property Portals:** Many states have centralized databases:
• California: sco.ca.gov
• Texas: claimittexas.gov
• Florida: fltreasurehunt.gov
• New York: osc.state.ny.us
• North Carolina: nccash.com

**Court Records:** Foreclosure surplus is often listed in court records. Check the Clerk of Court website for your target county.

**Freedom of Information Act (FOIA):** If a county doesn't publish their list online, you can request it via FOIA/public records request.`,
      },
      {
        title: 'Evaluating Surplus Funds Leads',
        content: `Not every surplus listing is worth pursuing. Evaluate based on:

**Amount:** Focus on surplus amounts above $2,000. Below that, the time investment may not be worthwhile after fees and costs.

**Age:** Newer surplus (within the last 1-2 years) is easier to claim. Older claims may have expired deadlines.

**Owner Traceability:** Can you find the former owner? Names like "LLC" or "Trust" are harder to trace than individual names.

**State/County Rules:** Some states have very short claim windows (FL: 120 days). Others have no deadline. Know the rules before investing time.

**Competition:** Popular counties (LA County, Miami-Dade) have more competition from other recovery agents. Rural counties often have untouched surplus.`,
      },
    ],
  },
  {
    number: 3,
    title: 'Skip Tracing & Locating Owners',
    icon: Users,
    color: 'purple',
    sections: [
      {
        title: 'Skip Tracing Fundamentals',
        content: `"Skip tracing" is the process of locating a person. For surplus funds recovery, you need to find the former property owner or their heirs.

**Step 1 — Start with what you know:** The surplus funds list gives you the former owner's name and property address. The property address is their last known location.

**Step 2 — Public records search:** Use our [OSINT Tools](/osint) to search:
• People search databases (name + last known city/state)
• Address history (find where they moved)
• Phone number lookup
• Email verification
• Social media / username search

**Step 3 — Property records:** Check the county assessor for the new owner of the property. Sometimes the former owner bought another property in the same county.

**Step 4 — Court records:** If the owner passed away, probate records will list heirs and executors.

**Step 5 — Mailing:** Send a letter to their last known address AND their current address (if different). Even if they moved, the post office may forward mail for up to 1 year.`,
      },
      {
        title: 'Heir Research',
        content: `If the former property owner is deceased, their heirs have the right to claim the surplus. Research steps:

1. **Obituary search** — Confirms death and often lists surviving family members
2. **Probate records** — Filed in the county where the person died. Lists executor and beneficiaries.
3. **Social Security Death Index** — Confirms date of death
4. **Property records** — If the property was transferred before the tax sale, the transferee may have a claim
5. **Family tree databases** — Ancestry.com, FamilySearch.org for identifying heirs

**Important:** If there was a will, the executor or named heirs have priority. If there was no will (intestate), state law determines the heir hierarchy (typically: spouse → children → parents → siblings).`,
      },
    ],
  },
  {
    number: 4,
    title: 'State Laws & Deadlines',
    icon: Scale,
    color: 'orange',
    sections: [
      {
        title: 'Key State Statutes',
        content: `Every state has different laws governing surplus funds. Here are the most important:

**California** — Rev & Tax Code §4675-4676. 1 year from deed recording. Filed with County Treasurer-Tax Collector. Board of Supervisors must approve.

**Texas** — Tax Code §34.04. 2 years from tax sale. Requires a court petition (lawsuit) filed with District Clerk. Attorney usually needed.

**Florida** — Stat §197.522. Only 120 days from tax deed issuance. Filed with Clerk of Circuit Court. Very short window.

**Georgia** — Code §48-4-5. 1 year from tax sale. Filed with Tax Commissioner. After 1 year, funds may escheat to state.

**Michigan** — Comp. Laws §211.78t. After the 2023 Rafaeli Supreme Court decision, counties must return ALL surplus from tax foreclosures.

**Ohio** — Rev. Code §5723.12. No specific deadline. Filed with County Auditor or Treasurer.

Use our [State Requirements](/requirements) tool for complete details on all covered states.`,
      },
      {
        title: 'Common Legal Pitfalls',
        content: `**Missed deadlines:** The #1 reason claims fail. Always verify the claim deadline BEFORE starting work on a case.

**Insufficient documentation:** Each county has specific document requirements. Get the complete list before filing.

**Lien priority:** If there were liens on the property (IRS, mortgage, mechanic's liens), those may have priority over the former owner's claim.

**Assignment rules:** Some states restrict or regulate how recovery agents can acquire rights. Always use a proper assignment agreement.

**Unauthorized practice of law (UPL):** In most states, you can file claims and assist with paperwork. But giving legal advice, appearing in court, or drafting legal documents may constitute UPL. Know the line.

**Fee regulations:** While most states don't cap recovery agent fees, some counties or courts may review for "reasonableness." Keep fees in line with industry standards (25-40%).`,
      },
    ],
  },
  {
    number: 5,
    title: 'Filing Claims',
    icon: FileText,
    color: 'green',
    sections: [
      {
        title: 'The Claim Filing Process',
        content: `**Step 1 — Obtain the claim form.** Download from the county website (linked in our [Directory](/directory)) or request from the filing office.

**Step 2 — Gather required documents:**
• Government-issued photo ID
• Proof of ownership (recorded deed, title report)
• Tax sale documentation (sale date, parcel number, amount)
• Notarized affidavit (if required)
• Assignment of rights (if filing on behalf of owner)

**Step 3 — Complete the form.** Use our [Letter Templates](/templates) for professional formatting.

**Step 4 — Submit to the correct office.** Each state uses a different office:
• CA: County Treasurer-Tax Collector
• TX: District Clerk (requires court petition)
• FL: Clerk of Circuit Court
• GA: Tax Commissioner
• OH: County Auditor/Treasurer

**Step 5 — Follow up.** Counties typically process claims in 30-90 days. Use our [Claim Tracker](/claims) to monitor status.`,
      },
      {
        title: 'Assignment Agreements',
        content: `If you're a recovery agent filing on behalf of the former owner, you need an Assignment of Rights agreement.

**Key elements of a valid assignment:**
• Clear identification of both parties
• Description of the specific surplus funds being assigned
• The percentage or fee you'll receive
• A statement that the assignor is transferring their right to claim
• Signatures of both parties (notarized is best)
• Date of the agreement
• A cancellation clause (typically 3 business days)

**Important:** Always disclose your fee upfront. Never misrepresent yourself as a government official. Keep copies of all signed agreements.

Use our [Assignment Agreement Template](/templates) as a starting point, but have an attorney review it for your state.`,
      },
    ],
  },
  {
    number: 6,
    title: 'Building a Surplus Funds Business',
    icon: DollarSign,
    color: 'blue',
    sections: [
      {
        title: 'Business Model & Economics',
        content: `**Revenue Model:** Recovery agents typically earn 25-40% of the surplus amount recovered. On a $10,000 surplus, that's $2,500-$4,000.

**Costs to consider:**
• Skip tracing tools ($50-200/month)
• Mailing costs ($1-5 per letter)
• Filing fees ($0-400 depending on state)
• Notary fees ($10-25 per document)
• Legal consultation ($200-500 per case if needed)

**Use our [Calculator](/calculator)** to estimate costs and fees for specific claims.

**Volume matters:** Most successful recovery agents work 20-50+ cases simultaneously. Even with a 30-40% success rate, the math works because the revenue per case is significant.

**Ideal client profile:**
• Surplus amount: $3,000-$50,000
• State with favorable laws and reasonable timelines
• Owner is locatable via public records
• Claim deadline hasn't passed
• No competing claims filed`,
      },
      {
        title: 'Scaling Your Operation',
        content: `**Phase 1 — Learn (Weeks 1-4):** Study 2-3 states thoroughly. File your first claim on a straightforward case. Understand the process end-to-end.

**Phase 2 — Build Pipeline (Months 2-3):** Use our tools to build a pipeline of 20+ active cases. Send outreach letters to located owners. Track everything in the [Claim Tracker](/claims).

**Phase 3 — Systemize (Months 4-6):** Create standard operating procedures. Use templates for all correspondence. Set up follow-up schedules.

**Phase 4 — Scale (Month 6+):** Expand to more states. Consider hiring assistants for skip tracing and mailing. Build relationships with attorneys in your target states for TX-style court petitions.

**Keys to success:**
• Focus on rural and mid-size counties (less competition)
• Always be professional and transparent with property owners
• Track every case meticulously
• Know the law in every state you operate in
• Build a reputation — referrals are valuable`,
      },
    ],
  },
  {
    number: 7,
    title: 'Ethics & Compliance',
    icon: Shield,
    color: 'red',
    sections: [
      {
        title: 'Ethical Standards',
        content: `Surplus funds recovery is a legitimate business, but it requires ethical conduct.

**DO:**
• Be transparent about who you are and what you do
• Clearly explain your fee structure in writing
• Give owners the option to file claims themselves
• Provide a cancellation period for assignment agreements
• Keep all client information confidential
• Follow all state and federal laws

**DON'T:**
• Misrepresent yourself as a government employee
• Use scare tactics or create false urgency
• Charge excessive fees (above 40% is generally considered unreasonable)
• File claims without proper authorization from the owner
• Share confidential information about one client with another
• Guarantee results`,
      },
      {
        title: 'Legal Compliance Checklist',
        content: `Before operating in any state, verify:

☐ **Business license** — Register your business in your home state
☐ **State-specific regulations** — Some states require specific licensing for asset recovery
☐ **Assignment agreement review** — Have your template reviewed by an attorney
☐ **Fee compliance** — Verify there are no fee caps in your target state/county
☐ **UPL boundaries** — Understand what constitutes legal advice vs. administrative assistance
☐ **FTC compliance** — Follow Federal Trade Commission rules for commercial communications
☐ **Do-Not-Call list** — Check the National Do Not Call Registry before making phone calls
☐ **CAN-SPAM Act** — Follow email marketing rules if doing email outreach
☐ **State consumer protection** — Review your state's consumer protection statutes
☐ **Record keeping** — Maintain records of all client interactions for at least 3 years`,
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green:  { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  red:    { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Surplus Funds Recovery — Complete Guide</h1>
        <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
          New to surplus funds? Start with the basics below. Already operating a business? Jump to
          advanced guides on scaling, compliance, and automation.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Syllabus — 7 Modules</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {modules.map(mod => {
            const c = colorMap[mod.color];
            return (
              <a
                key={mod.number}
                href={`#module-${mod.number}`}
                className={`flex items-center gap-3 rounded-lg border ${c.border} p-3 hover:shadow transition-shadow`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.bg} ${c.text} text-sm font-bold`}>
                  {mod.number}
                </div>
                <span className="text-sm font-medium text-gray-900">{mod.title}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-10 rounded-xl bg-blue-50 border border-blue-200 p-6">
        <h3 className="mb-3 font-semibold text-blue-900">Practice Tools</h3>
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <Link href="/directory" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">County Directory</Link>
          <Link href="/osint" className="rounded-lg bg-white px-3 py-2 text-green-700 border border-green-200 hover:shadow text-center">OSINT Tools</Link>
          <Link href="/lookup" className="rounded-lg bg-white px-3 py-2 text-orange-700 border border-orange-200 hover:shadow text-center">Third-Party Lookup</Link>
          <Link href="/dorks" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">Google Dork Tool</Link>
          <Link href="/requirements" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">State Requirements</Link>
          <Link href="/calculator" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">Claim Calculator</Link>
          <Link href="/templates" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">Letter Templates</Link>
          <Link href="/claims" className="rounded-lg bg-white px-3 py-2 text-blue-700 border border-blue-200 hover:shadow text-center">Claim Tracker</Link>
          <Link href="/unclaimed" className="rounded-lg bg-white px-3 py-2 text-purple-700 border border-purple-200 hover:shadow text-center">Unclaimed Property</Link>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-12">
        {modules.map(mod => {
          const c = colorMap[mod.color];
          return (
            <section key={mod.number} id={`module-${mod.number}`} className="scroll-mt-20">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.text}`}>
                  <mod.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Module {mod.number}</div>
                  <h2 className="text-xl font-bold text-gray-900">{mod.title}</h2>
                </div>
              </div>

              <div className="space-y-6">
                {mod.sections.map((section, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{section.title}</h3>
                    <div className="prose prose-sm prose-gray max-w-none">
                      {section.content.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                          // It's a definition/list item paragraph
                          return (
                            <div key={pIdx} className="mb-2">
                              {paragraph.split('\n').map((line, lIdx) => {
                                // Handle bold markers
                                const parts = line.split(/\*\*(.*?)\*\*/g);
                                return (
                                  <p key={lIdx} className="mb-1 text-sm text-gray-600 leading-relaxed">
                                    {parts.map((part, partIdx) =>
                                      partIdx % 2 === 1 ? (
                                        <strong key={partIdx} className="text-gray-900">{part}</strong>
                                      ) : (
                                        <span key={partIdx}>{part}</span>
                                      )
                                    )}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }
                        // Regular paragraph — handle bold and links
                        return (
                          <p key={pIdx} className="mb-3 text-sm text-gray-600 leading-relaxed">
                            {paragraph.split('\n').map((line, lIdx) => {
                              // Handle markdown links [text](url)
                              const linkParts = line.split(/\[([^\]]+)\]\(([^)]+)\)/g);
                              const boldParts = linkParts.map((part, partIdx) => {
                                if (partIdx % 3 === 1) {
                                  // Link text
                                  const url = linkParts[partIdx + 1];
                                  return <Link key={partIdx} href={url} className="text-blue-600 underline hover:text-blue-800">{part}</Link>;
                                }
                                if (partIdx % 3 === 2) return null; // Skip URL part
                                // Handle bold
                                const bParts = part.split(/\*\*(.*?)\*\*/g);
                                return bParts.map((bp, bIdx) =>
                                  bIdx % 2 === 1 ? (
                                    <strong key={`${partIdx}-${bIdx}`} className="text-gray-900">{bp}</strong>
                                  ) : (
                                    <span key={`${partIdx}-${bIdx}`}>{bp}</span>
                                  )
                                );
                              });
                              return (
                                <span key={lIdx}>
                                  {boldParts}
                                  {lIdx < paragraph.split('\n').length - 1 && <br />}
                                </span>
                              );
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
        <p className="text-sm text-amber-700">
          <strong>Disclaimer:</strong> This educational content is for informational purposes only and does not constitute legal advice.
          Laws vary by state and county. Always consult with a licensed attorney before filing claims or entering into
          agreements. Verify all information independently before taking action.
        </p>
      </div>
    </div>
  );
}

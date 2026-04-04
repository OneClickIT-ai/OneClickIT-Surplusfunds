'use client';
import { useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { US_STATES } from '@/lib/constants';

const DORK_TEMPLATES = [
  {
    name: 'Find Excess Proceeds Lists',
    category: 'lists',
    template: (state: string) =>
      `site:*.gov ${state} ("excess proceeds" OR "surplus funds" OR "unclaimed funds") (county OR treasurer OR "tax collector") (pdf OR list)`,
    description: 'Finds county pages with downloadable excess proceeds lists and PDFs.',
  },
  {
    name: 'Find Claim Forms & Notices',
    category: 'forms',
    template: (state: string) =>
      `site:*.gov ${state} ("notice of right to claim excess proceeds" OR "claim form" OR "notice of excess proceeds") (pdf OR form)`,
    description: 'Finds official claim forms and notice documents from county offices.',
  },
  {
    name: 'Find Tax Sale Results',
    category: 'sales',
    template: (state: string) =>
      `site:*.gov ${state} ("tax sale" OR "tax auction" OR "tax deed sale") ("excess proceeds" OR "surplus") (results OR list)`,
    description: 'Finds tax sale result pages that list properties with surplus funds.',
  },
  {
    name: 'Find PDF Lists Directly',
    category: 'pdf',
    template: (state: string) =>
      `site:*.gov ${state} ("excess proceeds" OR "surplus funds") filetype:pdf`,
    description: 'Searches specifically for PDF documents containing surplus funds data.',
  },
  {
    name: 'Find Treasurer/Collector Pages',
    category: 'offices',
    template: (state: string) =>
      `site:*.gov ${state} ("treasurer" OR "tax collector" OR "auditor") ("excess proceeds" OR "surplus funds" OR "unclaimed")`,
    description: 'Finds county Treasurer and Tax Collector office pages with surplus info.',
  },
  {
    name: 'Find Unclaimed Property (State Level)',
    category: 'state',
    template: (state: string) =>
      `"${state}" ("unclaimed property" OR "unclaimed funds") site:*.gov (search OR claim OR find)`,
    description: 'Finds state-level unclaimed property portals and search tools.',
  },
  {
    name: 'Find County Clerk Surplus Records',
    category: 'clerk',
    template: (state: string) =>
      `site:*.gov ${state} ("clerk of court" OR "county clerk" OR "district clerk") ("surplus" OR "excess proceeds" OR "overbid")`,
    description: 'Finds Clerk of Court pages with surplus from judicial sales.',
  },
  {
    name: 'Find Foreclosure Surplus',
    category: 'foreclosure',
    template: (state: string) =>
      `site:*.gov ${state} ("foreclosure" OR "sheriff sale") ("surplus" OR "excess" OR "overbid") (list OR notice OR claim)`,
    description: 'Finds surplus from foreclosure and sheriff sale proceedings.',
  },
];

const STATE_SPECIFIC_TIPS: Record<string, string> = {
  CA: 'California counties use "excess proceeds" language. Try: site:*.ca.gov "notice of right to claim excess proceeds"',
  TX: 'Texas requires a court petition to claim. Try: site:*.gov Texas "excess proceeds" "district clerk"',
  FL: 'Florida has a 120-day claim window. Try: site:*.gov Florida "surplus funds" "clerk of court"',
  GA: 'Georgia Tax Commissioners hold surplus. Try: site:*.gov Georgia "excess funds" "tax commissioner"',
  OH: 'Ohio uses County Auditor/Treasurer. Try: site:*.gov Ohio "surplus funds" "county auditor"',
  MI: 'Post-Rafaeli decision, MI must return surplus. Try: site:*.gov Michigan "excess proceeds" "treasurer"',
  NY: 'NY uses County Comptroller/Treasurer. Try: site:*.gov "New York" "surplus" "tax foreclosure"',
  NC: 'NC has nccash.com state portal. Also try: site:*.gov "North Carolina" "excess proceeds" county',
  IL: 'Illinois surplus held by County Treasurer. Try: site:*.gov Illinois "tax sale" "surplus" treasurer',
  PA: 'PA uses upset tax sales through County Tax Claim Bureau. Try: site:*.gov Pennsylvania "surplus" "tax sale"',
};

export default function DorksPage() {
  const [selectedState, setSelectedState] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const stateName = US_STATES.find(s => s.code === selectedState)?.name || selectedState;

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const openGoogle = (query: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Google Dork Search Tool</h1>
        <p className="text-sm text-gray-500">
          Google dorks are advanced search patterns that help surface surplus funds lists, auctions, and
          public records that don&apos;t appear with normal searches. Use them responsibly and always
          respect each site&apos;s terms of use.
        </p>
      </div>

      {/* State selector */}
      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Select label="Select a state to generate searches" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
              <option value="">Choose a state...</option>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
            </Select>
          </div>
        </div>
        {selectedState && STATE_SPECIFIC_TIPS[selectedState] && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Tip for {stateName}:</strong> {STATE_SPECIFIC_TIPS[selectedState]}
          </div>
        )}
      </Card>

      {selectedState ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Search Queries for {stateName}</h2>

          {DORK_TEMPLATES.map((dork, idx) => {
            const query = dork.template(stateName);
            return (
              <Card key={idx} padding="sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{dork.name}</h3>
                      <Badge variant="info">{dork.category}</Badge>
                    </div>
                    <p className="mb-2 text-xs text-gray-500">{dork.description}</p>
                    <code className="block rounded bg-gray-50 p-2 text-xs text-gray-700 break-all">
                      {query}
                    </code>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleCopy(query, idx)} aria-label={`Copy ${dork.name} query`}>
                      {copiedIdx === idx ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => openGoogle(query)} aria-label={`Search Google for ${dork.name}`}>
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          <Card className="bg-amber-50 border-amber-200">
            <h3 className="mb-2 font-semibold text-amber-900">Pro Tips</h3>
            <ul className="space-y-1 text-sm text-amber-700">
              <li>• Add a specific county name to narrow results: <code className="bg-amber-100 px-1 rounded">&quot;Los Angeles&quot;</code></li>
              <li>• Use <code className="bg-amber-100 px-1 rounded">filetype:pdf</code> to find downloadable lists</li>
              <li>• Use <code className="bg-amber-100 px-1 rounded">filetype:csv</code> or <code className="bg-amber-100 px-1 rounded">filetype:xlsx</code> for spreadsheet data</li>
              <li>• Try <code className="bg-amber-100 px-1 rounded">site:*.{selectedState.toLowerCase()}.gov</code> for state-specific government sites</li>
              <li>• Replace &quot;excess proceeds&quot; with &quot;overbid&quot; or &quot;overage&quot; — some counties use different terms</li>
            </ul>
          </Card>
        </div>
      ) : (
        <Card className="py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Select a state above to generate targeted Google search queries.</p>
          <p className="mt-2 text-xs text-gray-400">
            These searches use Google dorks to find publicly available surplus funds data
            from county government websites across all 50 states.
          </p>
        </Card>
      )}
    </div>
  );
}

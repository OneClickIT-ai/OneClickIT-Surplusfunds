'use client';

import { useState } from 'react';
import {
  Search, Users, Phone, Mail, MapPin, AtSign, Globe, Scale, Building2,
  ExternalLink, Hash, Car, CreditCard, FileSearch, ChevronDown, ChevronUp,
  Skull, Share2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tool definitions — each generates a URL from the user's query      */
/* ------------------------------------------------------------------ */

interface Tool {
  name: string;
  url: (q: string) => string;
  desc?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  placeholder: string;
  tools: Tool[];
}

const CATEGORIES: Category[] = [
  {
    id: 'person',
    name: 'Person Search',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    placeholder: 'Full name (e.g. John Smith)',
    tools: [
      { name: 'TruePeopleSearch', url: q => `https://www.truepeoplesearch.com/results?name=${enc(q)}` },
      { name: 'FastPeopleSearch', url: q => `https://www.fastpeoplesearch.com/name/${enc(q).replace(/%20/g, '-')}` },
      { name: 'ThatsThem', url: q => `https://thatsthem.com/name/${enc(q).replace(/%20/g, '-')}` },
      { name: 'Spokeo', url: q => `https://www.spokeo.com/${enc(q).replace(/%20/g, '-')}` },
      { name: 'Whitepages', url: q => `https://www.whitepages.com/name/${enc(q).replace(/%20/g, '-')}` },
      { name: 'ZabaSearch', url: q => `https://www.zabasearch.com/people/${enc(q).replace(/%20/g, '+')}` },
      { name: 'Radaris', url: q => `https://radaris.com/p/${enc(q).replace(/%20/g, '-')}/` },
      { name: 'PeekYou', url: q => `https://www.peekyou.com/${enc(q).replace(/%20/g, '_')}` },
      { name: 'Pipl', url: q => `https://pipl.com/search/?q=${enc(q)}` },
      { name: 'Intelius', url: q => `https://www.intelius.com/people-search/${enc(q).replace(/%20/g, '-')}` },
      { name: 'BeenVerified', url: q => `https://www.beenverified.com/people/${enc(q).replace(/%20/g, '-')}/` },
      { name: 'FamilyTreeNow', url: q => `https://www.familytreenow.com/search/people?first=&last=${enc(q)}` },
      { name: 'Lullar', url: q => `https://com.lullar.com/?q=${enc(q)}` },
      { name: 'TruePeopleSearch (Address)', url: q => `https://www.truepeoplesearch.com/results?streetaddress=${enc(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q=${enc(q)}` },
    ],
  },
  {
    id: 'phone',
    name: 'Phone Lookup',
    icon: Phone,
    color: 'text-green-600',
    bg: 'bg-green-50',
    placeholder: 'Phone number (e.g. 555-123-4567)',
    tools: [
      { name: 'TruePeopleSearch', url: q => `https://www.truepeoplesearch.com/results?phoneno=${enc(strip(q))}` },
      { name: 'FastPeopleSearch', url: q => `https://www.fastpeoplesearch.com/${strip(q)}` },
      { name: 'ThatsThem', url: q => `https://thatsthem.com/phone/${strip(q)}` },
      { name: 'Spokeo', url: q => `https://www.spokeo.com/phone-lookup/${strip(q)}` },
      { name: 'WhoCallsMe', url: q => `https://whocallsme.com/Phone-Number.aspx/${strip(q)}` },
      { name: 'Whitepages', url: q => `https://www.whitepages.com/phone/${strip(q)}` },
      { name: 'Sync.me', url: q => `https://sync.me/search/?number=${enc(strip(q))}` },
      { name: 'CallerID Test', url: q => `https://calleridtest.com/query?number=${strip(q)}` },
      { name: 'USPhoneBook', url: q => `https://www.usphonebook.com/${strip(q)}` },
      { name: '411', url: q => `https://www.411.com/phone/${strip(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q=${enc(q)}` },
    ],
  },
  {
    id: 'email',
    name: 'Email Lookup',
    icon: Mail,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    placeholder: 'Email address (e.g. john@example.com)',
    tools: [
      { name: 'Hunter.io Verify', url: q => `https://hunter.io/email-verifier/${enc(q)}` },
      { name: 'ThatsThem', url: q => `https://thatsthem.com/email/${enc(q)}` },
      { name: 'Epieos', url: q => `https://epieos.com/?q=${enc(q)}` },
      { name: 'Have I Been Pwned', url: q => `https://haveibeenpwned.com/unifiedsearch/${enc(q)}` },
      { name: 'Gravatar', url: q => `https://en.gravatar.com/site/check/${enc(q)}` },
      { name: 'Email Hippo', url: q => `https://tools.emailhippo.com/email/${enc(q)}` },
      { name: 'MailTester', url: q => `https://mailtester.com/testmail.php?email=${enc(q)}` },
      { name: 'VoilaNorbert', url: q => `https://www.google.com/search?q=${enc(q)}+site:voilanorbert.com` },
      { name: 'OSINT Industries', url: q => `https://www.osint.industries/?q=${enc(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q="${enc(q)}"` },
    ],
  },
  {
    id: 'address',
    name: 'Address & Property',
    icon: MapPin,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    placeholder: 'Address (e.g. 123 Main St, Austin TX)',
    tools: [
      { name: 'TruePeopleSearch', url: q => `https://www.truepeoplesearch.com/results?streetaddress=${enc(q)}` },
      { name: 'FastPeopleSearch', url: q => `https://www.fastpeoplesearch.com/address/${enc(q).replace(/%20/g, '-')}` },
      { name: 'Zillow', url: q => `https://www.zillow.com/homes/${enc(q).replace(/%20/g, '-')}_rb/` },
      { name: 'Realtor.com', url: q => `https://www.realtor.com/realestateandhomes-search/${enc(q).replace(/%20/g, '-')}` },
      { name: 'County Records', url: q => `https://www.google.com/search?q=${enc(q)}+county+property+records+assessor` },
      { name: 'Tax Records', url: q => `https://www.google.com/search?q=${enc(q)}+property+tax+records` },
      { name: 'Google Maps', url: q => `https://www.google.com/maps/search/${enc(q)}` },
      { name: 'Google Street View', url: q => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=0,0&query=${enc(q)}` },
      { name: 'Bing Maps', url: q => `https://www.bing.com/maps?q=${enc(q)}` },
    ],
  },
  {
    id: 'username',
    name: 'Username Search',
    icon: AtSign,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    placeholder: 'Username (e.g. johndoe123)',
    tools: [
      { name: 'Namechk', url: q => `https://namechk.com/?q=${enc(q)}` },
      { name: 'WhatsMyName', url: q => `https://whatsmyname.app/?q=${enc(q)}` },
      { name: 'UserSearch', url: q => `https://usersearch.org/results_normal.php?URL_username=${enc(q)}` },
      { name: 'PeekYou', url: q => `https://www.peekyou.com/${enc(q)}` },
      { name: 'NameVine', url: q => `https://namevine.com/#/${enc(q)}` },
      { name: 'Twitter / X', url: q => `https://twitter.com/${enc(q)}` },
      { name: 'Instagram', url: q => `https://www.instagram.com/${enc(q)}/` },
      { name: 'Facebook', url: q => `https://www.facebook.com/${enc(q)}` },
      { name: 'LinkedIn', url: q => `https://www.linkedin.com/in/${enc(q)}` },
      { name: 'YouTube', url: q => `https://www.youtube.com/@${enc(q)}` },
      { name: 'GitHub', url: q => `https://github.com/${enc(q)}` },
      { name: 'Reddit', url: q => `https://www.reddit.com/user/${enc(q)}` },
      { name: 'TikTok', url: q => `https://www.tiktok.com/@${enc(q)}` },
      { name: 'Pinterest', url: q => `https://www.pinterest.com/${enc(q)}/` },
      { name: 'Google', url: q => `https://www.google.com/search?q="${enc(q)}"` },
    ],
  },
  {
    id: 'domain',
    name: 'Domain & IP',
    icon: Globe,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    placeholder: 'Domain or IP (e.g. example.com or 8.8.8.8)',
    tools: [
      { name: 'WHOIS (who.is)', url: q => `https://who.is/whois/${enc(q)}` },
      { name: 'DomainTools', url: q => `https://whois.domaintools.com/${enc(q)}` },
      { name: 'SecurityTrails', url: q => `https://securitytrails.com/domain/${enc(q)}/dns` },
      { name: 'Shodan', url: q => `https://www.shodan.io/search?query=${enc(q)}` },
      { name: 'Censys', url: q => `https://search.censys.io/hosts/${enc(q)}` },
      { name: 'VirusTotal', url: q => `https://www.virustotal.com/gui/domain/${enc(q)}` },
      { name: 'Wayback Machine', url: q => `https://web.archive.org/web/*/${enc(q)}` },
      { name: 'ViewDNS WHOIS', url: q => `https://viewdns.info/whois/?domain=${enc(q)}` },
      { name: 'ViewDNS Reverse IP', url: q => `https://viewdns.info/reverseip/?host=${enc(q)}` },
      { name: 'ViewDNS IP Location', url: q => `https://viewdns.info/iplocation/?ip=${enc(q)}` },
      { name: 'DNSlytics', url: q => `https://dnslytics.com/domain/${enc(q)}` },
      { name: 'Robtex', url: q => `https://www.robtex.com/dns-lookup/${enc(q)}` },
      { name: 'SSL Certificate', url: q => `https://crt.sh/?q=${enc(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q=site:${enc(q)}` },
    ],
  },
  {
    id: 'court',
    name: 'Court & Legal Records',
    icon: Scale,
    color: 'text-red-600',
    bg: 'bg-red-50',
    placeholder: 'Name or case number',
    tools: [
      { name: 'PACER (Federal)', url: q => `https://www.google.com/search?q=${enc(q)}+site:uscourts.gov+PACER` },
      { name: 'CourtListener', url: q => `https://www.courtlistener.com/?q=${enc(q)}` },
      { name: 'UniCourt', url: q => `https://unicourt.com/search?q=${enc(q)}` },
      { name: 'Judyrecords', url: q => `https://www.judyrecords.com/record?q=${enc(q)}` },
      { name: 'Google Scholar (Legal)', url: q => `https://scholar.google.com/scholar?q=${enc(q)}&hl=en&as_sdt=4` },
      { name: 'RECAP Archive', url: q => `https://www.courtlistener.com/recap/?q=${enc(q)}` },
      { name: 'State Courts Google', url: q => `https://www.google.com/search?q=${enc(q)}+site:courts.*.gov+OR+site:*.courts.gov` },
      { name: 'BK Search (Bankruptcy)', url: q => `https://www.google.com/search?q=${enc(q)}+bankruptcy+case+filing` },
      { name: 'SEC EDGAR', url: q => `https://efts.sec.gov/LATEST/search-index?q=${enc(q)}` },
      { name: 'Foreclosure.com', url: q => `https://www.google.com/search?q=${enc(q)}+site:foreclosure.com` },
      { name: 'Tax Lien Search', url: q => `https://www.google.com/search?q=${enc(q)}+tax+lien+sale+OR+tax+deed+sale` },
      { name: 'Probate Records', url: q => `https://www.google.com/search?q=${enc(q)}+probate+records+court` },
    ],
  },
  {
    id: 'business',
    name: 'Business & Corporate',
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    placeholder: 'Business name or EIN',
    tools: [
      { name: 'OpenCorporates', url: q => `https://opencorporates.com/companies?q=${enc(q)}&jurisdiction_code=us` },
      { name: 'SEC EDGAR', url: q => `https://www.sec.gov/cgi-bin/browse-edgar?company=${enc(q)}&CIK=&type=&dateb=&owner=include&count=40&search_text=&action=getcompany` },
      { name: 'BBB', url: q => `https://www.bbb.org/search?find_text=${enc(q)}&find_country=US` },
      { name: 'Dun & Bradstreet', url: q => `https://www.dnb.com/business-directory.html#CompanySearchTerm=${enc(q)}` },
      { name: 'IRS Tax Exempt Lookup', url: q => `https://apps.irs.gov/app/eos/allSearch?ein1=&names=${enc(q)}&resultsPerPage=25` },
      { name: 'LinkedIn Companies', url: q => `https://www.linkedin.com/search/results/companies/?keywords=${enc(q)}` },
      { name: 'Crunchbase', url: q => `https://www.crunchbase.com/textsearch?q=${enc(q)}` },
      { name: 'State SOS Google', url: q => `https://www.google.com/search?q=${enc(q)}+secretary+of+state+business+entity+search` },
      { name: 'Google', url: q => `https://www.google.com/search?q="${enc(q)}"+business` },
    ],
  },
  {
    id: 'vehicle',
    name: 'VIN & Vehicle',
    icon: Car,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    placeholder: 'VIN number (17 characters)',
    tools: [
      { name: 'NHTSA VIN Decoder', url: q => `https://vpic.nhtsa.dot.gov/decoder/Decoder/VIN/${strip(q)}` },
      { name: 'VINDecoder.net', url: q => `https://www.vindecoder.net/check-vin/${strip(q)}` },
      { name: 'VINDecoder.pl', url: q => `https://vindecoder.pl/result/${strip(q)}` },
      { name: 'AutoDNA', url: q => `https://www.autodna.com/vin/${strip(q)}` },
      { name: 'CarFax', url: q => `https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=${strip(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q=VIN+${enc(strip(q))}` },
    ],
  },
  {
    id: 'financial',
    name: 'Financial & Assets',
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    placeholder: 'Name, SSN (last 4), or account ID',
    tools: [
      { name: 'MissingMoney.com', url: q => `https://www.missingmoney.com/Main/Search?Name=${enc(q)}` },
      { name: 'Unclaimed.org', url: q => `https://unclaimed.org/search/?name=${enc(q)}` },
      { name: 'FDIC BankFind', url: q => `https://www.google.com/search?q=${enc(q)}+site:fdic.gov+bank` },
      { name: 'FINRA BrokerCheck', url: q => `https://brokercheck.finra.org/search/genericsearch/grid?query=${enc(q)}` },
      { name: 'SEC EDGAR', url: q => `https://efts.sec.gov/LATEST/search-index?q=${enc(q)}` },
      { name: 'US Tax Court', url: q => `https://www.google.com/search?q=${enc(q)}+site:ustaxcourt.gov` },
      { name: 'Treasury Unclaimed', url: q => `https://www.google.com/search?q=${enc(q)}+site:treasurydirect.gov+unclaimed` },
      { name: 'HUD Homes', url: q => `https://www.google.com/search?q=${enc(q)}+site:hudhomestore.gov` },
      { name: 'NCUA Credit Unions', url: q => `https://mapping.ncua.gov/ResearchCreditUnion?Search=${enc(q)}` },
      { name: 'Surplus Funds (This Site)', url: q => `/directory?q=${enc(q)}` },
      { name: 'Unclaimed Property (This Site)', url: q => `/unclaimed?q=${enc(q)}` },
      { name: 'Google', url: q => `https://www.google.com/search?q=${enc(q)}+unclaimed+property+OR+surplus+funds` },
    ],
  },
  {
    id: 'documents',
    name: 'Document & File Search',
    icon: FileSearch,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    placeholder: 'Search term for documents',
    tools: [
      { name: 'Google PDFs', url: q => `https://www.google.com/search?q=${enc(q)}+filetype:pdf` },
      { name: 'Google Docs', url: q => `https://www.google.com/search?q=${enc(q)}+filetype:doc+OR+filetype:docx` },
      { name: 'Google Spreadsheets', url: q => `https://www.google.com/search?q=${enc(q)}+filetype:xls+OR+filetype:xlsx+OR+filetype:csv` },
      { name: 'Google Presentations', url: q => `https://www.google.com/search?q=${enc(q)}+filetype:ppt+OR+filetype:pptx` },
      { name: 'Google Scholar', url: q => `https://scholar.google.com/scholar?q=${enc(q)}` },
      { name: 'Scribd', url: q => `https://www.scribd.com/search?query=${enc(q)}` },
      { name: 'SlideShare', url: q => `https://www.slideshare.net/search?searchfrom=header&q=${enc(q)}` },
      { name: 'ISSUU', url: q => `https://issuu.com/search?q=${enc(q)}` },
      { name: 'Surplus Funds Lists', url: q => `https://www.google.com/search?q=${enc(q)}+surplus+funds+list+filetype:pdf+OR+filetype:csv+OR+filetype:xlsx` },
    ],
  },
  {
    id: 'death',
    name: 'Death & Obituary Records',
    icon: Skull,
    color: 'text-stone-600',
    bg: 'bg-stone-50',
    placeholder: 'Full name of deceased',
    tools: [
      { name: 'Legacy.com', url: q => `https://www.legacy.com/us/obituaries/name/${enc(q).replace(/%20/g, '-')}` },
      { name: 'Tributes.com', url: q => `https://www.tributes.com/search?search=${enc(q)}` },
      { name: 'FindAGrave', url: q => `https://www.findagrave.com/memorial/search?firstname=&middlename=&lastname=&cemeteryName=&locationId=&memorialId=&mcid=&linkedToName=&datefilter=&orderby=r&plot=&keyword=${enc(q)}` },
      { name: 'BillionGraves', url: q => `https://billiongraves.com/search/results?given_names=&family_names=${enc(q)}` },
      { name: 'Ancestry Obituaries', url: q => `https://www.ancestry.com/search/categories/34/?name=${enc(q)}` },
      { name: 'FamilySearch', url: q => `https://www.familysearch.org/search/record/results?q.name=${enc(q)}` },
      { name: 'Newspapers.com', url: q => `https://www.newspapers.com/search/#query=${enc(q)}&t=3964` },
      { name: 'Social Security Death Index', url: q => `https://www.familysearch.org/search/collection/1202535?q.name=${enc(q)}` },
      { name: 'Genealogy Bank', url: q => `https://www.genealogybank.com/explore/${enc(q).replace(/%20/g, '-')}/obituaries` },
      { name: 'Google Obituaries', url: q => `https://www.google.com/search?q=${enc(q)}+obituary` },
    ],
  },
  {
    id: 'social',
    name: 'Social Media',
    icon: Share2,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    placeholder: 'Name or username',
    tools: [
      { name: 'Facebook', url: q => `https://www.facebook.com/search/people/?q=${enc(q)}` },
      { name: 'Twitter / X', url: q => `https://twitter.com/search?q=${enc(q)}&f=user` },
      { name: 'LinkedIn', url: q => `https://www.linkedin.com/search/results/people/?keywords=${enc(q)}` },
      { name: 'Instagram', url: q => `https://www.google.com/search?q=site:instagram.com+"${enc(q)}"` },
      { name: 'TikTok', url: q => `https://www.tiktok.com/search/user?q=${enc(q)}` },
      { name: 'YouTube', url: q => `https://www.youtube.com/results?search_query=${enc(q)}` },
      { name: 'Reddit', url: q => `https://www.reddit.com/search/?q=${enc(q)}&type=user` },
      { name: 'Pinterest', url: q => `https://www.pinterest.com/search/users/?q=${enc(q)}` },
      { name: 'Nextdoor', url: q => `https://www.google.com/search?q=site:nextdoor.com+"${enc(q)}"` },
      { name: 'WhatsMyName', url: q => `https://whatsmyname.app/?q=${enc(q)}` },
      { name: 'Lullar', url: q => `https://com.lullar.com/?q=${enc(q)}` },
      { name: 'Google Social', url: q => `https://www.google.com/search?q="${enc(q)}"+site:facebook.com+OR+site:linkedin.com+OR+site:twitter.com` },
    ],
  },
  {
    id: 'hash',
    name: 'Hash & Encoding',
    icon: Hash,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    placeholder: 'Hash, encoded string, or text to encode',
    tools: [
      { name: 'CyberChef', url: q => `https://gchq.github.io/CyberChef/#input=${btoa64(q)}` },
      { name: 'MD5 Decrypt', url: q => `https://md5decrypt.net/en/#answer=${enc(q)}` },
      { name: 'CrackStation', url: q => `https://crackstation.net/?hash=${enc(q)}` },
      { name: 'Base64 Decode', url: q => `https://www.base64decode.org/?q=${enc(q)}` },
      { name: 'URL Decode', url: q => `https://www.urldecoder.org/?val=${enc(q)}` },
      { name: 'VirusTotal Hash', url: q => `https://www.virustotal.com/gui/search/${enc(q)}` },
    ],
  },
];

function enc(s: string) {
  return encodeURIComponent(s);
}

function strip(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, '');
}

function btoa64(s: string) {
  try { return btoa(s); } catch { return encodeURIComponent(s); }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LookupToolsPage() {
  const [activeCategory, setActiveCategory] = useState('person');
  const [query, setQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const category = CATEGORIES.find(c => c.id === activeCategory)!;

  const openAll = () => {
    if (!query.trim()) return;
    category.tools.forEach(t => {
      window.open(t.url(query.trim()), '_blank', 'noopener');
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalTools = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Third-Party Lookup Tools
        </h1>
        <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
          This lookup library collects {totalTools} public search tools across {CATEGORIES.length} categories
          for people, property, business, court, and more. Use it as a reference when you need a
          specific data source beyond the SurplusClickIT directory.
          For a streamlined OSINT workflow, see our{' '}
          <a href="/osint" className="text-blue-600 hover:underline">OSINT Tools page</a>.
        </p>
      </div>

      {/* Category selector */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? `${cat.bg} ${cat.color} ring-1 ring-current`
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <cat.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{cat.name}</span>
            <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
            <span className="ml-1 rounded-full bg-white/60 px-1.5 py-0.5 text-xs">
              {cat.tools.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="mb-8 mx-auto max-w-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && query.trim() && openAll()}
              placeholder={category.placeholder}
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={openAll}
            disabled={!query.trim()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Open All ({category.tools.length})
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">
          Press Enter or click &ldquo;Open All&rdquo; to search all {category.name.toLowerCase()} tools at once
        </p>
      </div>

      {/* Active category tools grid */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className={`rounded-lg p-1.5 ${category.bg}`}>
            <category.icon className={`h-5 w-5 ${category.color}`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
          <span className="text-sm text-gray-400">({category.tools.length} tools)</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {category.tools.map(tool => (
            <button
              key={tool.name}
              onClick={() => {
                if (!query.trim()) return;
                window.open(tool.url(query.trim()), '_blank', 'noopener');
              }}
              disabled={!query.trim()}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm transition-all hover:shadow-sm hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="font-medium text-gray-700 group-hover:text-gray-900">
                {tool.name}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500" />
            </button>
          ))}
        </div>
      </div>

      {/* All categories reference (collapsed) */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h2>
        <div className="space-y-3">
          {CATEGORIES.filter(c => c.id !== activeCategory).map(cat => {
            const isExpanded = expandedCats.has(cat.id);
            return (
              <div key={cat.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div
                    className="flex flex-1 items-center gap-2 cursor-pointer"
                    onClick={() => toggleExpand(cat.id)}
                  >
                    <div className={`rounded-lg p-1.5 ${cat.bg}`}>
                      <cat.icon className={`h-4 w-4 ${cat.color}`} />
                    </div>
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.tools.length} tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => {
                        setActiveCategory(cat.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Use
                    </span>
                    <span className="cursor-pointer" onClick={() => toggleExpand(cat.id)}>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {cat.tools.map(tool => (
                        <span
                          key={tool.name}
                          onClick={() => {
                            if (!query.trim()) return;
                            window.open(tool.url(query.trim()), '_blank', 'noopener');
                          }}
                          className={`inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs cursor-pointer ${
                            query.trim()
                              ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {tool.name}
                          <ExternalLink className="h-3 w-3 text-gray-300" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Search Tools', value: totalTools.toString() },
          { label: 'Categories', value: CATEGORIES.length.toString() },
          { label: 'One-Click Search', value: 'Yes' },
          { label: 'Cost', value: 'Free' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
        <p className="text-xs text-amber-700">
          These tools link to third-party websites. We do not control or endorse these services.
          Results may vary. Always verify information through official sources. Use responsibly
          and in compliance with applicable laws including the Fair Credit Reporting Act (FCRA).
        </p>
      </div>
    </div>
  );
}

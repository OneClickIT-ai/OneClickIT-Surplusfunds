'use client';
import { Download, FileSpreadsheet, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { useState } from 'react';
import { US_STATES } from '@/lib/constants';

export default function ExportPage() {
  const [state, setState] = useState('');

  const handleExport = (type: string) => {
    const params = new URLSearchParams({ type });
    if (state) params.set('state', state);
    window.open(`/api/export?${params}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
        <p className="text-sm text-gray-500">CSV exports are available on Pro plans so you can analyze county and funds data in Excel, Google Sheets, or your own CRM.</p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select
          label="Filter by state (optional)"
          value={state}
          onChange={e => setState(e.target.value)}
        >
          <option value="">All states</option>
          {US_STATES.map(s => (
            <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="text-center">
          <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-green-600" />
          <h3 className="font-semibold text-gray-900 mb-1">Counties Directory</h3>
          <p className="text-sm text-gray-500 mb-4">
            All counties with URLs, claim rules, deadlines, population data
          </p>
          <Button
            className="w-full"
            variant="primary"
            onClick={() => handleExport('counties')}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download Counties CSV
          </Button>
        </Card>

        <Card className="text-center">
          <Database className="mx-auto mb-3 h-8 w-8 text-blue-600" />
          <h3 className="font-semibold text-gray-900 mb-1">Scraped Funds Data</h3>
          <p className="text-sm text-gray-500 mb-4">
            All scraped surplus funds with property, amount, claimant info
          </p>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleExport('funds')}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download Funds CSV
          </Button>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Exports include all publicly available data. Updated with each scrape cycle.
      </p>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { FileText, CheckSquare, Clock, Scale, Building2, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { US_STATES } from '@/lib/constants';
import { STATE_REQUIREMENTS, type StateRequirements } from '@/lib/claim-requirements';

export default function RequirementsPage() {
  const [selectedState, setSelectedState] = useState('');
  const reqs = selectedState ? STATE_REQUIREMENTS[selectedState] : null;

  const availableStates = US_STATES.filter(s => STATE_REQUIREMENTS[s.code]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">State Claim Requirements</h1>
        <p className="text-sm text-gray-500">Documents, deadlines, statutes, and filing offices by state. Requirements change over time &mdash; always confirm deadlines and paperwork directly with the county or state before filing.</p>
      </div>

      <div className="mb-6">
        <Select label="Select a state" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
          <option value="">Choose a state...</option>
          {availableStates.map(s => (
            <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-gray-400">
          {availableStates.length} states with detailed requirements available
        </p>
      </div>

      {reqs ? (
        <StateDetail reqs={reqs} />
      ) : (
        <div className="space-y-4">
          <Card className="py-12 text-center">
            <Scale className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Select a state above to view claim requirements.</p>
          </Card>

          {/* Show all states summary */}
          <h2 className="mt-8 text-lg font-semibold text-gray-900">All Available States</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(STATE_REQUIREMENTS).map(req => (
              <button
                key={req.state}
                onClick={() => setSelectedState(req.state)}
                aria-label={`View ${req.stateName} claim requirements`}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:shadow transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{req.stateName}</span>
                  <Badge variant={req.deadlineDays && req.deadlineDays <= 120 ? 'warning' : 'default'}>
                    {req.deadlineDays ? `${req.deadlineDays}d deadline` : 'No fixed deadline'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{req.statute}</p>
                <p className="text-xs text-gray-400 mt-1">{req.filingOffice}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StateDetail({ reqs }: { reqs: StateRequirements }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{reqs.stateName}</h2>
            <p className="text-sm text-blue-600 font-medium">{reqs.statute}</p>
          </div>
          <Badge variant={reqs.deadlineDays && reqs.deadlineDays <= 120 ? 'warning' : 'info'}>
            {reqs.deadlineDays ? `${reqs.deadlineDays} day deadline` : 'No fixed deadline'}
          </Badge>
        </div>
      </Card>

      {/* Deadline */}
      <Card>
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-orange-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Claim Deadline</h3>
            <p className="text-sm text-gray-600">{reqs.deadlineDesc}</p>
            {reqs.deadlineDays && reqs.deadlineDays <= 120 && (
              <div className="mt-2 flex items-center gap-1 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Short deadline — act quickly!
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Filing Office */}
      <Card>
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Filing Office</h3>
            <p className="text-sm text-gray-600">{reqs.filingOffice}</p>
          </div>
        </div>
      </Card>

      {/* Required Documents */}
      <Card>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-green-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Required Documents</h3>
            <ul className="mt-2 space-y-1.5">
              {reqs.requiredDocs.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Optional Documents */}
      {reqs.optionalDocs.length > 0 && (
        <Card>
          <h3 className="mb-2 font-semibold text-gray-900">Additional Documents (if applicable)</h3>
          <ul className="space-y-1.5">
            {reqs.optionalDocs.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                <CheckSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                {doc}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Processing */}
      <Card>
        <h3 className="mb-2 font-semibold text-gray-900">Processing Time</h3>
        <p className="text-sm text-gray-600">{reqs.processTime}</p>
      </Card>

      {/* Fee info */}
      <Card>
        <h3 className="mb-2 font-semibold text-gray-900">Agent Fee Regulations</h3>
        <p className="text-sm text-gray-600">{reqs.feeCapNotes}</p>
      </Card>

      {/* Notes */}
      {reqs.notes && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
          <strong>Important:</strong> {reqs.notes}
        </div>
      )}
    </div>
  );
}

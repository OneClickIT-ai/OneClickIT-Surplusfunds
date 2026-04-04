'use client';
import { useState } from 'react';
import { DollarSign, Calculator, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { US_STATES } from '@/lib/constants';

interface Breakdown {
  surplusAmount: number;
  agentFeePercent: number;
  agentFee: number;
  filingFees: number;
  researchCosts: number;
  totalCosts: number;
  netToOwner: number;
}

const STATE_FILING_FEES: Record<string, number> = {
  CA: 0, TX: 350, FL: 400, GA: 0, OH: 0, AZ: 0, MI: 0, MD: 200, NY: 100, CO: 0,
};

export default function CalculatorPage() {
  const [state, setState] = useState('');
  const [amount, setAmount] = useState('');
  const [feePercent, setFeePercent] = useState('33');
  const [researchCosts, setResearchCosts] = useState('200');
  const [result, setResult] = useState<Breakdown | null>(null);

  const calculate = () => {
    const surplusAmount = parseFloat(amount) || 0;
    const agentFeePercent = parseFloat(feePercent) || 0;
    const research = parseFloat(researchCosts) || 0;
    const filingFees = STATE_FILING_FEES[state] || 50;

    const agentFee = surplusAmount * (agentFeePercent / 100);
    const totalCosts = agentFee + filingFees + research;
    const netToOwner = surplusAmount - totalCosts;

    setResult({ surplusAmount, agentFeePercent, agentFee, filingFees, researchCosts: research, totalCosts, netToOwner });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Claim Amount Calculator</h1>
        <p className="text-sm text-gray-500">Estimate your potential net proceeds from a surplus funds claim. Adjust your contingency rate, expected timeline, and costs to forecast what each case might be worth.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Enter Claim Details</h3>
          <div className="space-y-4">
            <Select label="State" value={state} onChange={e => setState(e.target.value)}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
            </Select>
            <Input label="Surplus Amount ($)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" />
            <Input label="Agent Fee (%)" type="number" value={feePercent} onChange={e => setFeePercent(e.target.value)} placeholder="33" />
            <Input label="Research / Skip Trace Costs ($)" type="number" value={researchCosts} onChange={e => setResearchCosts(e.target.value)} placeholder="200" />
            <Button onClick={calculate} className="w-full">
              <Calculator className="mr-1.5 h-4 w-4" />
              Calculate
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <h3 className="mb-3 font-semibold text-gray-900">Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Surplus Amount</span>
                    <span className="font-medium text-gray-900">${result.surplusAmount.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agent Fee ({result.agentFeePercent}%)</span>
                    <span className="text-red-600">-${result.agentFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Filing Fees{state ? ` (${state})` : ''}</span>
                    <span className="text-red-600">-${result.filingFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Research Costs</span>
                    <span className="text-red-600">-${result.researchCosts.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Costs</span>
                    <span className="font-medium text-red-600">-${result.totalCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-green-50 p-2">
                    <span className="font-semibold text-green-700">Net to Owner</span>
                    <span className="font-bold text-green-700">${result.netToOwner.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="mb-2 font-semibold text-gray-900">Agent Earnings</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">${result.agentFee.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Your fee at {result.agentFeePercent}%</div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Enter claim details and click Calculate to see the breakdown.</p>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          This calculator provides estimates only. Actual costs vary by county and case complexity.
          Filing fees are approximate. Some states cap agent fees — check your state&rsquo;s regulations.
          TX claims require a court petition (attorney fees not included). Always verify current fee schedules with the county.
        </p>
      </div>
    </div>
  );
}

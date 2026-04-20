'use client';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { FileText, Copy, Download, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { LETTER_TEMPLATES, fillTemplate, type LetterTemplate } from '@/lib/letter-templates';

const CATEGORY_LABELS: Record<string, string> = {
  initial_claim: 'Initial Claim',
  owner_outreach: 'Owner Outreach',
  follow_up: 'Follow Up',
  assignment: 'Assignment',
};

const CATEGORY_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  initial_claim: 'info',
  owner_outreach: 'success',
  follow_up: 'warning',
  assignment: 'error',
};

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<LetterTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in?redirect_url=/templates');
  }, [status, router]);

  if (status === 'loading' || !session) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading...</div>;
  }

  const handleSelect = (template: LetterTemplate) => {
    setSelected(template);
    const defaults: Record<string, string> = {};
    template.variables.forEach(v => { defaults[v] = ''; });
    if (defaults.DATE !== undefined) defaults.DATE = new Date().toLocaleDateString();
    setValues(defaults);
    setCopied(false);
  };

  const preview = selected ? fillTemplate(selected, values) : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected?.id || 'letter'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Claim Letter Templates</h1>
        <p className="text-sm text-gray-500">
          Professional letter templates with variable substitution for surplus funds claims
        </p>
      </div>

      {!selected ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {LETTER_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              aria-label={`Use ${template.name} template`}
              className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-blue-300 hover:shadow transition-all"
            >
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <Badge variant={CATEGORY_COLORS[template.category]}>
                  {CATEGORY_LABELS[template.category]}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
              <p className="mt-2 text-xs text-gray-400">{template.variables.length} variables</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-4 text-sm text-blue-600 hover:underline"
          >
            &larr; Back to templates
          </button>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Variables form */}
            <div className="lg:col-span-2">
              <Card>
                <h3 className="mb-3 font-semibold text-gray-900">Fill in Details</h3>
                <div className="space-y-3">
                  {selected.variables.map(v => (
                    <Input
                      key={v}
                      label={v.replace(/_/g, ' ')}
                      value={values[v] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
                      placeholder={v.replace(/_/g, ' ')}
                    />
                  ))}
                </div>
              </Card>
            </div>

            {/* Preview */}
            <div className="lg:col-span-3">
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                  {preview}
                </pre>
              </Card>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            These templates are for informational purposes only. Consult with a licensed attorney before filing claims or entering into agreements.
          </p>
        </div>
      )}
    </div>
  );
}

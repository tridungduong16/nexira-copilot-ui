import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCw } from 'lucide-react';

type Option = { label: string; value: string };

interface SelectField {
  id: string;
  label: string;
  value: string;
  onChange: (v: any) => void;
  options: Option[];
}

interface NumberField {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

interface ToggleField {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

interface TextAreaField {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

interface AgentConfigPanelProps {
  selectFields?: SelectField[];
  numberFields?: NumberField[];
  toggleFields?: ToggleField[];
  textarea?: TextAreaField;
  suggestions?: string[];
  onSuggestionClick?: (s: string) => void;
  onGenerate: () => void;
  generateButtonLabel?: string;
  isGenerating?: boolean;
  accentButtonClass?: string; // e.g., 'bg-violet-600 hover:bg-violet-700'
  layout?: 'grid' | 'split';
  rightNode?: React.ReactNode;
  extraButtons?: React.ReactNode;
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  selectFields = [],
  numberFields = [],
  toggleFields = [],
  textarea,
  suggestions = [],
  onSuggestionClick,
  onGenerate,
  isGenerating,
  generateButtonLabel = 'Generate',
  accentButtonClass = 'bg-[#1E293B] hover:bg-gray-800',
  layout = 'grid',
  rightNode,
  extraButtons
}) => {
  const { resolvedTheme } = useTheme();
  if (layout === 'split') {
    return (
      <div className={`mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <div className={`lg:col-span-2 space-y-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
            {selectFields.map((f) => (
              <div key={f.id}>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{f.label}</label>
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
            {numberFields.map((f) => (
              <div key={f.id}>
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{f.label}</label>
                <input
                  type="number"
                  value={f.value}
                  onChange={(e) => f.onChange(Number(e.target.value))}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
                />
              </div>
            ))}
          </div>
          {toggleFields.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {toggleFields.map((f) => (
                <label key={f.id} className={`inline-flex items-center gap-2 text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} select-none`}>
                  <input
                    type="checkbox"
                    checked={f.value}
                    onChange={(e) => f.onChange(e.target.checked)}
                    className={`h-4 w-4 rounded ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'} focus:ring-gray-900`}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          )}
          {textarea && (
            <div>
              <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{textarea.label}</label>
              <textarea
                value={textarea.value}
                onChange={(e) => textarea.onChange(e.target.value)}
                rows={textarea.rows || 5}
                placeholder={textarea.placeholder}
                className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} resize-none rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
              />
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button
                  onClick={onGenerate}
                  className={`${resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} inline-flex items-center px-4 py-2 text-white rounded-lg ${accentButtonClass}`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      {generateButtonLabel}
                    </>
                  )}
                </button>
                {extraButtons}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {rightNode && (
            <div className={`${resolvedTheme==='dark' ? 'text-gray-200' : 'text-gray-700'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              {rightNode}
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <div className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-2`}>Suggestions</div>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick ? onSuggestionClick(s) : undefined}
                    className={`text-left p-3 ${resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} transition-colors`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // default grid layout
  return (
    <div className={`mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
      <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        {selectFields.map((f) => (
          <div key={f.id}>
            <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{f.label}</label>
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
        {numberFields.map((f) => (
          <div key={f.id}>
            <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{f.label}</label>
            <input
              type="number"
              value={f.value}
              onChange={(e) => f.onChange(Number(e.target.value))}
              min={f.min}
              max={f.max}
              step={f.step}
              className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
            />
          </div>
        ))}
        {toggleFields.map((f) => (
          <div key={f.id} className={`flex items-center gap-3 pt-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
            <input
              id={f.id}
              type="checkbox"
              checked={f.value}
              onChange={(e) => f.onChange(e.target.checked)}
              className={`h-4 w-4 rounded ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'} focus:ring-gray-900`}
            />
            <label htmlFor={f.id} className="text-sm font-medium text-gray-700">{f.label}</label>
          </div>
        ))}
      </div>

      {textarea && (
        <div className="lg:col-span-2">
          <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-1`}>{textarea.label}</label>
          <textarea
            value={textarea.value}
            onChange={(e) => textarea.onChange(e.target.value)}
            rows={textarea.rows || 5}
            placeholder={textarea.placeholder}
            className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} resize-none rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
          />
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={onGenerate}
              className={`${resolvedTheme === 'dark' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-100 hover:bg-gray-200'} inline-flex items-center px-4 py-2 text-white rounded-lg ${accentButtonClass}`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  {generateButtonLabel}
                </>
              )}
            </button>
            {extraButtons}
          </div>
        </div>
      )}

      <div>
        {suggestions.length > 0 && (
          <>
            <div className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-2`}>Suggestions</div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick ? onSuggestionClick(s) : undefined}
                  className={`text-left p-3 ${resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'} transition-colors`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentConfigPanel;


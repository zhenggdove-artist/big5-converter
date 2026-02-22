/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Copy, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BIG5_DATA, BIG5_COUNT } from './big5-data';

function buildMapping(): Map<string, string> {
  const raw = atob(BIG5_DATA);
  const map = new Map<string, string>();
  for (let i = 0; i < BIG5_COUNT; i++) {
    const o = i * 5;
    const cp =
      (raw.charCodeAt(o) << 16) |
      (raw.charCodeAt(o + 1) << 8) |
      raw.charCodeAt(o + 2);
    const big5 = (raw.charCodeAt(o + 3) << 8) | raw.charCodeAt(o + 4);
    const big5Hex = big5.toString(16).toUpperCase().padStart(4, '0');
    map.set(String.fromCodePoint(cp), big5Hex);
  }
  return map;
}

// Build once at module load (synchronous, ~ms)
const MAPPING = buildMapping();

export default function App() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    const result: string[] = [];
    for (const char of input) {
      const big5 = MAPPING.get(char);
      result.push(big5 ?? '????');
    }
    return result.join('★');
  }, [input]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-800 mb-2">
            Big5 Converter
          </h1>
          <p className="text-stone-500">
            Convert Traditional Chinese characters to Big5 hex codes.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col space-y-2"
          >
            <label
              htmlFor="input"
              className="text-sm font-medium text-stone-600 uppercase tracking-wider ml-1"
            >
              Input (Traditional Chinese)
            </label>
            <div className="relative group">
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-64 p-4 bg-white rounded-2xl border border-stone-200 focus:border-stone-400 focus:ring-0 resize-none shadow-sm transition-all text-lg leading-relaxed"
                placeholder="Paste your text here..."
              />
              {input && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 p-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-500 transition-colors"
                  title="Clear input"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col space-y-2"
          >
            <label
              htmlFor="output"
              className="text-sm font-medium text-stone-600 uppercase tracking-wider ml-1"
            >
              Output (Big5 Hex)
            </label>
            <div className="relative group">
              <textarea
                id="output"
                value={output}
                readOnly
                className="w-full h-64 p-4 bg-stone-100 rounded-2xl border border-stone-200 focus:border-stone-400 focus:ring-0 resize-none shadow-inner font-mono text-sm leading-relaxed text-stone-600"
                placeholder="Result will appear here..."
              />
              {output && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 bg-white hover:bg-stone-50 rounded-lg text-stone-500 shadow-sm border border-stone-200 transition-all flex items-center gap-2"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <span className="text-xs font-medium text-green-600">
                      Copied!
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-xs text-stone-500">
            <span>Data Source: moztw.org (CP950)</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
            <span>{MAPPING.size.toLocaleString()} characters loaded</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

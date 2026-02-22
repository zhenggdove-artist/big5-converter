/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Copy, Trash2, Tag, LayoutGrid } from 'lucide-react';
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

const MAPPING = buildMapping();

interface CodeEntry {
  code: string; // 4-char hex, e.g. "ACDA"
  char: string; // original Chinese character
}

// 正確的方塊字排列（以 C140 為例）：
//
//  ┌──────┬──────┬──────┐
//  │      │  1   │      │  ← code[1]，中欄上半，壓縮
//  │  C   │──────│  0   │  ← code[0] 左欄全高，code[3] 右欄全高（上下拉長）
//  │      │  4   │      │  ← code[2]，中欄下半，壓縮
//  └──────┴──────┴──────┘
//
// code[0], code[3] = 左右兩側，上下拉長（全欄高）
// code[1], code[2] = 中間上下，上下壓縮（各半欄高）
// code[1] 在 code[2] 上面 ✓
// CD 疊起來高度 = 拉長的 A 高度（都是完整欄高）✓
function CodeBlock({ code, char, showAnnotation }: CodeEntry & { showAnnotation: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="border border-stone-400 font-mono rounded overflow-hidden bg-stone-50"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 0.65fr 1fr',
          gridTemplateRows: '1fr 1fr',
          width: '3.25rem',
          height: '2.75rem',
        }}
      >
        {/* 左欄：code[0]，span 2 rows = "上下拉長" */}
        <span
          style={{ gridColumn: 1, gridRow: '1 / span 2' }}
          className="flex items-center justify-center border-r border-stone-400 bg-stone-100 text-stone-800 font-bold text-sm leading-none"
        >
          {code[0]}
        </span>
        {/* 中欄上：code[1]，"上壓縮" */}
        <span
          style={{ gridColumn: 2, gridRow: 1, fontSize: '0.6rem' }}
          className="flex items-center justify-center border-b border-stone-300 text-stone-600 leading-none"
        >
          {code[1]}
        </span>
        {/* 右欄：code[3]，span 2 rows = "上下拉長" */}
        <span
          style={{ gridColumn: 3, gridRow: '1 / span 2' }}
          className="flex items-center justify-center border-l border-stone-400 bg-stone-100 text-stone-800 font-bold text-sm leading-none"
        >
          {code[3]}
        </span>
        {/* 中欄下：code[2]，"下壓縮"，code[1] 在 code[2] 上面 ✓ */}
        <span
          style={{ gridColumn: 2, gridRow: 2, fontSize: '0.6rem' }}
          className="flex items-center justify-center text-stone-600 leading-none"
        >
          {code[2]}
        </span>
      </div>
      {showAnnotation && (
        <span className="text-xs text-stone-500 leading-none">{char}</span>
      )}
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [blockMode, setBlockMode] = useState(false);

  // Structured data: array of lines, each line is array of { code, char }
  const codeLines = useMemo<CodeEntry[][]>(() => {
    if (!input) return [];
    return input.split('\n').map(line =>
      [...line].map(char => ({
        code: MAPPING.get(char) ?? '????',
        char,
      }))
    );
  }, [input]);

  // Plain text output (for textarea and clipboard)
  const textOutput = useMemo(() => {
    return codeLines
      .map(line =>
        line
          .map(({ code, char }) =>
            showAnnotation ? `${code}(${char})` : code
          )
          .join('★')
      )
      .join('\n');
  }, [codeLines, showAnnotation]);

  const handleCopy = () => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => setInput('');

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
            <div className="flex items-center justify-between ml-1">
              <label
                htmlFor="output"
                className="text-sm font-medium text-stone-600 uppercase tracking-wider"
              >
                Output (Big5 Hex)
              </label>
              <div className="flex items-center gap-2">
                {/* Block mode toggle */}
                <button
                  onClick={() => setBlockMode(v => !v)}
                  title="方塊字顯示模式"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    blockMode
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  方塊字
                </button>
                {/* Annotation toggle */}
                <button
                  onClick={() => setShowAnnotation(v => !v)}
                  title="顯示/隱藏中文註記"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    showAnnotation
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {showAnnotation ? '隱藏註記' : '顯示中文'}
                </button>
              </div>
            </div>

            <div className="relative group">
              {blockMode ? (
                /* Block (方塊字) display */
                <div className="w-full h-64 p-4 bg-stone-100 rounded-2xl border border-stone-200 shadow-inner overflow-auto">
                  {codeLines.length === 0 ? (
                    <p className="text-stone-400 text-sm">Result will appear here...</p>
                  ) : (
                    codeLines.map((line, li) => (
                      <div key={li} className="flex flex-wrap gap-2 mb-3 last:mb-0">
                        {line.map((entry, ci) => (
                          <CodeBlock
                            key={ci}
                            {...entry}
                            showAnnotation={showAnnotation}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Plain text display */
                <textarea
                  id="output"
                  value={textOutput}
                  readOnly
                  className="w-full h-64 p-4 bg-stone-100 rounded-2xl border border-stone-200 focus:border-stone-400 focus:ring-0 resize-none shadow-inner font-mono text-sm leading-relaxed text-stone-600"
                  placeholder="Result will appear here..."
                />
              )}

              {/* Copy button (copies plain text regardless of mode) */}
              {textOutput && (
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

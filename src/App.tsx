/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { Copy, Trash2, Tag, LayoutGrid, Search } from 'lucide-react';
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

// 反向對照表：Big5 hex (4字元大寫) → 中文字
const REVERSE_MAPPING = new Map<string, string>();
for (const [char, big5] of MAPPING) {
  REVERSE_MAPPING.set(big5, char);
}

interface CodeEntry {
  code: string;
  char: string;
}

// ─── 方塊字顯示元件 ───────────────────────────────────────────────────────────
//
//  排列（以 C140 為例）：
//  ┌──────┬──────┬──────┐
//  │      │  1   │      │  ← code[1]，中欄上半，壓縮
//  │  C   │──────│  0   │  ← code[0] 左欄全高，code[3] 右欄全高
//  │      │  4   │      │  ← code[2]，中欄下半，壓縮
//  └──────┴──────┴──────┘
//
function CodeBlock({ code, char, showAnnotation }: CodeEntry & { showAnnotation: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="border border-indigo-400/60 font-mono rounded overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 0.65fr 1fr',
          gridTemplateRows: '1fr 1fr',
          width: '3.25rem',
          height: '2.75rem',
          background: 'rgba(20, 15, 50, 0.7)',
          boxShadow: '0 0 6px rgba(140, 110, 255, 0.35), 0 0 16px rgba(120, 80, 240, 0.15), inset 0 0 8px rgba(120, 90, 240, 0.1)',
        }}
      >
        {/* 左欄：code[0]，span 2 rows */}
        <span
          style={{ gridColumn: '1', gridRow: '1 / span 2' }}
          className="flex items-center justify-center border-r border-indigo-400/50 text-indigo-200 font-bold text-sm leading-none vhs-glow"
        >
          {code[0]}
        </span>
        {/* 中欄上：code[1] */}
        <span
          style={{ gridColumn: '2', gridRow: '1', fontSize: '0.6rem' }}
          className="flex items-center justify-center border-b border-indigo-400/40 text-purple-300 leading-none"
        >
          {code[1]}
        </span>
        {/* 右欄：code[3]，span 2 rows */}
        <span
          style={{ gridColumn: '3', gridRow: '1 / span 2' }}
          className="flex items-center justify-center border-l border-indigo-400/50 text-indigo-200 font-bold text-sm leading-none vhs-glow"
        >
          {code[3]}
        </span>
        {/* 中欄下：code[2] */}
        <span
          style={{ gridColumn: '2', gridRow: '2', fontSize: '0.6rem' }}
          className="flex items-center justify-center text-purple-300 leading-none"
        >
          {code[2]}
        </span>
      </div>
      {showAnnotation && (
        <span className="text-xs text-purple-300/90 leading-none vhs-glow">{char}</span>
      )}
    </div>
  );
}

// ─── 反向查找元件 ─────────────────────────────────────────────────────────────
function ReverseLookup() {
  const [cells, setCells] = useState<string[]>(['', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const code = cells.map(c => c.toUpperCase()).join('');
  const isComplete = /^[0-9A-F]{4}$/.test(code);
  const resultChar = isComplete ? REVERSE_MAPPING.get(code) : undefined;

  const handleChange = (idx: number, raw: string) => {
    const hex = raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(-1);
    const next = [...cells];
    next[idx] = hex;
    setCells(next);
    if (hex && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cells[idx]) {
        const next = [...cells];
        next[idx] = '';
        setCells(next);
      } else if (idx > 0) {
        refs[idx - 1].current?.focus();
      }
    } else if (e.key === 'ArrowRight' && idx < 3) {
      e.preventDefault();
      refs[idx + 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      refs[idx - 1].current?.focus();
    }
  };

  const handleClear = () => {
    setCells(['', '', '', '']);
    refs[0].current?.focus();
  };

  const baseClass =
    'w-full h-full bg-transparent text-center font-mono font-bold uppercase ' +
    'outline-none transition-colors ' +
    'focus:bg-indigo-900/30 placeholder-indigo-700/40';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8 flex-wrap justify-center">

        {/* 可輸入方塊字格 */}
        <div
          className="border-2 border-indigo-500/40 rounded-lg overflow-hidden vhs-glow-box"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.65fr 1fr',
            gridTemplateRows: '1fr 1fr',
            width: '5.5rem',
            height: '4.75rem',
            background: 'rgba(15, 10, 40, 0.8)',
          }}
        >
          <input
            ref={refs[0]}
            value={cells[0]}
            onChange={e => handleChange(0, e.target.value)}
            onKeyDown={e => handleKeyDown(0, e)}
            maxLength={2}
            placeholder="·"
            style={{ gridColumn: '1', gridRow: '1 / span 2', fontSize: '1.1rem' }}
            className={`${baseClass} border-r-2 border-indigo-500/30 text-indigo-300`}
          />
          <input
            ref={refs[1]}
            value={cells[1]}
            onChange={e => handleChange(1, e.target.value)}
            onKeyDown={e => handleKeyDown(1, e)}
            maxLength={2}
            placeholder="·"
            style={{ gridColumn: '2', gridRow: '1', fontSize: '0.7rem' }}
            className={`${baseClass} border-b border-indigo-500/20 text-purple-400`}
          />
          <input
            ref={refs[2]}
            value={cells[2]}
            onChange={e => handleChange(2, e.target.value)}
            onKeyDown={e => handleKeyDown(2, e)}
            maxLength={2}
            placeholder="·"
            style={{ gridColumn: '2', gridRow: '2', fontSize: '0.7rem' }}
            className={`${baseClass} text-purple-400`}
          />
          <input
            ref={refs[3]}
            value={cells[3]}
            onChange={e => handleChange(3, e.target.value)}
            onKeyDown={e => handleKeyDown(3, e)}
            maxLength={2}
            placeholder="·"
            style={{ gridColumn: '3', gridRow: '1 / span 2', fontSize: '1.1rem' }}
            className={`${baseClass} border-l-2 border-indigo-500/30 text-indigo-300`}
          />
        </div>

        {/* 箭頭 */}
        <span className="text-indigo-300 text-2xl select-none vhs-glow">→</span>

        {/* 查找結果 */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-20 h-20 border-2 rounded-xl flex items-center justify-center transition-all ${
              isComplete && resultChar
                ? 'border-indigo-400/60 vhs-glow-box'
                : isComplete
                ? 'border-red-500/30 bg-red-900/20'
                : 'border-indigo-500/20'
            }`}
            style={{
              background: isComplete && resultChar
                ? 'rgba(20, 15, 50, 0.8)'
                : isComplete
                ? undefined
                : 'rgba(15, 10, 35, 0.5)',
            }}
          >
            {isComplete && resultChar ? (
              <span className="text-4xl text-indigo-100 leading-none vhs-glow">{resultChar}</span>
            ) : isComplete ? (
              <span className="text-sm text-red-400/80 text-center px-1">查無此碼</span>
            ) : (
              <span className="text-4xl text-indigo-800/40 select-none">?</span>
            )}
          </div>
          {isComplete && resultChar && (
            <span className="text-xs font-mono text-indigo-500/60 tracking-widest">{code}</span>
          )}
        </div>
      </div>

      {/* 清除按鈕 */}
      {cells.some(c => c) && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-indigo-500/50 hover:text-indigo-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          清除
        </button>
      )}
    </div>
  );
}

// ─── 主應用 ───────────────────────────────────────────────────────────────────
export default function App() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [blockMode, setBlockMode] = useState(false);

  const codeLines = useMemo<CodeEntry[][]>(() => {
    if (!input) return [];
    return input.split('\n').map(line =>
      [...line].map(char => ({
        code: MAPPING.get(char) ?? '????',
        char,
      }))
    );
  }, [input]);

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
    <div className="min-h-screen text-indigo-200 font-sans p-4 md:p-8 vhs-glitch-secondary">
      <div className="max-w-4xl mx-auto">

        {/* 標題 */}
        <header className="mb-10 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight text-indigo-100 mb-3 vhs-chroma"
            style={{ letterSpacing: '0.08em' }}
          >
            GGdove code
          </h1>
          <p className="text-indigo-400/50 text-sm tracking-widest uppercase vhs-glow">
            Convert Traditional Chinese characters to Big5 hex codes
          </p>
        </header>

        {/* ── 正向轉換：中文 → Big5 ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col space-y-2"
          >
            <label
              htmlFor="input"
              className="text-sm font-medium text-indigo-300 uppercase tracking-wider vhs-glow ml-1"
            >
              Input (Traditional Chinese)
            </label>
            <div className="relative group">
              <textarea
                id="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-full h-64 p-4 rounded-2xl border border-indigo-500/30 focus:border-indigo-400/60 focus:ring-0 resize-none transition-all text-lg leading-relaxed text-indigo-100 placeholder-indigo-700/40 vhs-glow-box"
                style={{ background: 'rgba(12, 8, 32, 0.7)' }}
                placeholder="Paste your text here..."
              />
              {input && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 p-2 bg-indigo-900/50 hover:bg-indigo-800/50 rounded-lg text-indigo-400/70 transition-colors"
                  title="Clear input"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center justify-between ml-1">
              <label
                htmlFor="output"
                className="text-sm font-medium text-indigo-300 uppercase tracking-wider vhs-glow"
              >
                Output (Big5 Hex)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBlockMode(v => !v)}
                  title="方塊字顯示模式"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    blockMode
                      ? 'bg-indigo-600/60 text-indigo-100 border-indigo-500/50'
                      : 'text-indigo-500/60 border-indigo-500/30 hover:border-indigo-400/50'
                  }`}
                  style={!blockMode ? { background: 'rgba(12, 8, 32, 0.5)' } : undefined}
                >
                  <LayoutGrid className="w-3 h-3" />
                  方塊字
                </button>
                <button
                  onClick={() => setShowAnnotation(v => !v)}
                  title="顯示/隱藏中文註記"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    showAnnotation
                      ? 'bg-indigo-600/60 text-indigo-100 border-indigo-500/50'
                      : 'text-indigo-500/60 border-indigo-500/30 hover:border-indigo-400/50'
                  }`}
                  style={!showAnnotation ? { background: 'rgba(12, 8, 32, 0.5)' } : undefined}
                >
                  <Tag className="w-3 h-3" />
                  {showAnnotation ? '隱藏註記' : '顯示中文'}
                </button>
              </div>
            </div>

            <div className="relative group">
              {blockMode ? (
                <div
                  className="w-full h-64 p-4 rounded-2xl border border-indigo-500/30 shadow-inner overflow-auto vhs-glow-box"
                  style={{ background: 'rgba(8, 5, 25, 0.7)' }}
                >
                  {codeLines.length === 0 ? (
                    <p className="text-indigo-700/50 text-sm">Result will appear here...</p>
                  ) : (
                    codeLines.map((line, li) => (
                      <div key={li} className="flex flex-wrap gap-2 mb-3 last:mb-0">
                        {line.map((entry, ci) => (
                          <CodeBlock key={ci} {...entry} showAnnotation={showAnnotation} />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <textarea
                  id="output"
                  value={textOutput}
                  readOnly
                  className="w-full h-64 p-4 rounded-2xl border border-indigo-500/30 focus:border-indigo-400/60 focus:ring-0 resize-none shadow-inner font-mono text-sm leading-relaxed text-indigo-300/80 placeholder-indigo-700/40 vhs-glow-box"
                  style={{ background: 'rgba(8, 5, 25, 0.7)' }}
                  placeholder="Result will appear here..."
                />
              )}

              {textOutput && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg text-indigo-400/70 border border-indigo-500/30 transition-all flex items-center gap-2 hover:bg-indigo-800/30"
                  style={{ background: 'rgba(15, 10, 40, 0.8)' }}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <span className="text-xs font-medium text-emerald-400">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── 反向查找：Big5 → 中文 ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-10 border-t border-indigo-400/40 pt-8"
        >
          <h2 className="text-center text-sm font-medium text-indigo-300 uppercase tracking-wider mb-6 flex items-center justify-center gap-2 vhs-glow">
            <Search className="w-4 h-4" />
            反向查找 Big5 → 中文
          </h2>
          <ReverseLookup />
        </motion.div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-indigo-500/40 border border-indigo-500/10 vhs-timestamp"
            style={{ background: 'rgba(10, 6, 30, 0.6)' }}
          >
            <span>Data Source: moztw.org (CP950)</span>
            <span className="w-1 h-1 bg-indigo-600/30 rounded-full"></span>
            <span>{MAPPING.size.toLocaleString()} characters loaded</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

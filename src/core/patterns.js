// Pure text-analysis functions — no I/O, no state, no side effects.

const CLI_SIGNALS = [
  /\bclaude\b/i, /\baider\b/i, /\bsgpt\b/i,
  /\bllm\b/i,    /\bcodex\b/i, /Human:/,
  /╭─+╮/,        /aider>/i,    /openai/i,
];

const ERROR_RX = [
  /^(Error|TypeError|SyntaxError|ReferenceError|ValueError|RuntimeError|AttributeError|ImportError|ModuleNotFoundError|KeyError|IndexError|NameError|OSError|FileNotFoundError|PermissionError|AssertionError)/m,
  /Traceback \(most recent call last\)/m,
  /^\s+at .+\(.+:\d+:\d+\)/m,
  /FAILED|ENOENT|ECONNREFUSED/m,
];

function stripAnsi(s) {
  return s
    .replace(/\x1B\[[0-9;]*[mGKHFJABCDsuhr]/g, '')
    .replace(/\x1B\][^\x07]*\x07/g, '');
}

function isAiSession(content) {
  return CLI_SIGNALS.some(p => p.test(content));
}

// Which specific CLI tool is in the buffer (for the per-cat "Watch" filter).
// Returns null for a generic AI session (e.g. only "Human:/Assistant:").
const TOOL_SIGNALS = [
  ['claude', /\bclaude\b/i],
  ['aider',  /\baider\b|aider>/i],
  ['codex',  /\bcodex\b/i],
  ['sgpt',   /\bsgpt\b/i],
  ['llm',    /\bllm\b/i],
];
function detectTool(content) {
  for (const [name, rx] of TOOL_SIGNALS) if (rx.test(content)) return name;
  return null;
}

function lastUserPrompt(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 40); i--) {
    const l = lines[i];
    if (/^[╭╰│✓✗●◉►▸]/.test(l)) continue;
    if (/^(Human:|Assistant:|aider>|claude>)/.test(l)) continue;
    if (l.length > 3 && l.length < 600) return l;
  }
  return '';
}

function errorSignature(text) {
  for (const rx of ERROR_RX) {
    const m = text.match(rx);
    if (m) {
      const idx = text.indexOf(m[0]);
      return text.slice(idx, idx + 80).replace(/\s+/g, ' ').toLowerCase().trim();
    }
  }
  return null;
}

module.exports = { stripAnsi, isAiSession, detectTool, lastUserPrompt, errorSignature };

/**
 * Sanitizes prompts passed to the Cursor CLI agent by stripping/replacing
 * third-party AI branding, telemetry headers, and identifying metadata that
 * could indicate the request originated outside of Cursor.
 */

const RULES: Array<[RegExp, string]> = [
  // Strip x-anthropic-billing-header prefix (injected by Claude Code CLI)
  [/x-anthropic-billing-header:[^\n]*\n?/gi, ""],
  // Strip individual telemetry tokens that may appear in headers or text
  [/\bcc_version=[^\s;,\n]+[;,]?\s*/gi, ""],
  [/\bcc_entrypoint=[^\s;,\n]+[;,]?\s*/gi, ""],
  [/\bcch=[a-f0-9]+[;,]?\s*/gi, ""],
  // Replace "Claude Code" product name with "Cursor"
  [/\bClaude Code\b/g, "Cursor"],
  // Replace full Anthropic CLI description
  [/Anthropic['']s official CLI for Claude/gi, "Cursor AI assistant"],
  // Replace remaining Anthropic company brand references
  [/\bAnthropic\b/g, "Cursor"],
  // Replace known Anthropic domains
  [/anthropic\.com/gi, "cursor.com"],
  [/claude\.ai/gi, "cursor.sh"],
  // Normalise leftover leading semicolons/whitespace at start of content
  [/^[;,\s]+/, ""],
];

/**
 * Apply all sanitization rules to a prompt string.
 * Safe to call with any string; returns the original value if nothing matched.
 */
export function sanitizePrompt(prompt: string): string {
  let s = prompt;
  for (const [pattern, replacement] of RULES) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

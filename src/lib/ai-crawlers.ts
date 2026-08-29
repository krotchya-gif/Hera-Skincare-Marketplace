// T-42: Daftar AI crawler untuk block (pola docs seo.md)
// File terpisah agar aman dipakai di client component (tanpa import server).
export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "anthropic-ai",
  "Bytespider",
  "Applebot-Extended",
  "cohere-ai",
  "diffbot",
] as const;
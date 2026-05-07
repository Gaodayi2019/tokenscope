// ============================================================
// TokenScope — Channel Fetch Utilities (Step ③-b)
// HTML/JSON fetching, retry, timeout, JSON-from-HTML extraction
// ============================================================

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 2000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; TokenScopeBot/1.0; +https://token-scope.com)";

// ── Generic fetch with timeout + retry ──────────────────

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
}

/**
 * Fetch a URL with timeout and retry.
 * Returns raw text (HTML or JSON string).
 */
export async function fetchWithRetry(
  url: string,
  opts: FetchOptions = {}
): Promise<string> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    headers = {},
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const reqHeaders = {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    ...headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: reqHeaders,
        signal: controller.signal,
        redirect: "follow",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }

      const text = await res.text();
      return text;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && !err?.name?.includes("Abort")) {
        await sleep(retryDelayMs * (attempt + 1));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

// ── HTML fetcher ────────────────────────────────────────

/** Fetch a URL and return HTML string */
export async function fetchHtml(
  url: string,
  opts: FetchOptions = {}
): Promise<string> {
  return fetchWithRetry(url, {
    ...opts,
    headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.1", ...opts.headers },
  });
}

// ── JSON fetcher ────────────────────────────────────────

/** Fetch a URL and parse JSON */
export async function fetchJson<T = any>(
  url: string,
  opts: FetchOptions = {}
): Promise<T> {
  const text = await fetchWithRetry(url, {
    ...opts,
    headers: { Accept: "application/json,*/*;q=0.1", ...opts.headers },
  });
  return JSON.parse(text) as T;
}

// ── GitHub raw README fetcher ───────────────────────────

/** Fetch a GitHub repo README via raw.githubusercontent.com */
export async function fetchGitHubReadme(
  repo: string,
  branch = "main",
  opts: FetchOptions = {}
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/README.md`;
  return fetchWithRetry(url, opts);
}

// ── Extract JSON from HTML ──────────────────────────────

/**
 * Extract embedded JSON from HTML content.
 * Looks for <script> tags and tries to parse JSON objects/arrays.
 * Useful for pages that embed model data in script tags.
 */
export function extractJsonFromHtml<T = any>(
  html: string,
  pattern?: RegExp
): T | null {
  if (pattern) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Pattern matched but not valid JSON
      }
    }
    return null;
  }

  // Default: look for JSON in <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const content = scriptMatch[1].trim();
    // Try to find JSON objects or arrays in the script content
    const jsonPatterns = [
      /(?:const|let|var)\s+\w+\s*=\s*(\{[\s\S]*?\});/,
      /(?:const|let|var)\s+\w+\s*=\s*(\[[\s\S]*?\]);/,
      /(?:const|let|var)\s+\w+Models?\s*=\s*(\[[\s\S]*?\]);/i,
      /(?:const|let|var)\s+\w+Pricing?\s*=\s*(\[[\s\S]*?\]);/i,
    ];

    for (const jp of jsonPatterns) {
      const jm = content.match(jp);
      if (jm?.[1]) {
        try {
          return JSON.parse(jm[1]);
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

// ── HTML text extraction ────────────────────────────────

/** Strip HTML tags, decode entities, collapse whitespace */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Markdown table parser (for GitHub README lists) ─────

export interface MarkdownTableRow {
  [col: string]: string;
}

/**
 * Parse a markdown table into array of objects.
 * Handles | col1 | col2 | header + separator + data rows.
 */
export function parseMarkdownTable(md: string): MarkdownTableRow[] {
  const lines = md.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return [];

  const headers = lines[0]
    .split("|")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // Skip header + separator line
  const rows: MarkdownTableRow[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length === 0) continue;

    const row: MarkdownTableRow = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Extract markdown links [text](url) from content
 */
export function extractMarkdownLinks(md: string): Array<{ text: string; url: string }> {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ text: string; url: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(md)) !== null) {
    links.push({ text: match[1].trim(), url: match[2].trim() });
  }

  return links;
}

// ── Utility ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

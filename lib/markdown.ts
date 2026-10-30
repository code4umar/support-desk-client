// A small Markdown subset for help articles: headings, paragraphs, lists,
// block quotes, fenced code, rules, and inline bold/italic/code/links.
// It returns plain data; components/Markdown.tsx turns that into React
// elements, so article text is never injected as raw HTML.

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'rule' };

// Only links that can't run script: web, mail, and in-app paths/anchors.
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h)) return h;
  if (h.startsWith('/') && !h.startsWith('//')) return h;
  if (h.startsWith('#')) return h;
  return null;
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push({ type: 'text', text: rest });
      break;
    }
    if (m.index > 0) out.push({ type: 'text', text: rest.slice(0, m.index) });
    const [token, code, strong, em, link] = m;
    if (code) out.push({ type: 'code', text: code.slice(1, -1) });
    else if (strong) out.push({ type: 'strong', children: parseInline(strong.slice(2, -2)) });
    else if (em) out.push({ type: 'em', children: parseInline(em.slice(1, -1)) });
    else if (link) {
      const [, text, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(link)!;
      const safe = safeHref(href);
      out.push(safe ? { type: 'link', href: safe, children: parseInline(text) } : { type: 'text', text });
    }
    rest = rest.slice(m.index + token.length);
  }
  return out;
}

const BULLET = /^\s*[-*+]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trimStart().startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) body.push(lines[i++]);
      i++; // closing fence (or end of input)
      blocks.push({ type: 'code', text: body.join('\n') });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 4) as 1 | 2 | 3 | 4;
      blocks.push({ type: 'heading', level, children: parseInline(heading[2].trim()) });
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'rule' });
      i++;
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        body.push(lines[i++].trimStart().replace(/^>\s?/, ''));
      }
      blocks.push({ type: 'quote', children: parseInline(body.join(' ')) });
      continue;
    }

    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const marker = ordered ? NUMBERED : BULLET;
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i])) {
        items.push(parseInline(lines[i++].replace(marker, '')));
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // paragraph: runs until a blank line or the start of another block
    const body: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|>)/.test(lines[i].trimStart()) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      body.push(lines[i++].trim());
    }
    blocks.push({ type: 'paragraph', children: parseInline(body.join(' ')) });
  }

  return blocks;
}

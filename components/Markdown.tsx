import Link from 'next/link';
import { parseMarkdown, type Inline } from '@/lib/markdown';

function renderInline(nodes: Inline[]): React.ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return n.text;
      case 'strong':
        return <strong key={i} className="font-semibold text-navy">{renderInline(n.children)}</strong>;
      case 'em':
        return <em key={i}>{renderInline(n.children)}</em>;
      case 'code':
        return <code key={i} className="rounded bg-navy/5 px-1.5 py-0.5 font-mono text-[0.85em]">{n.text}</code>;
      case 'link':
        return n.href.startsWith('/') ? (
          <Link key={i} href={n.href} className="font-medium text-brand-dark underline underline-offset-2">
            {renderInline(n.children)}
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-dark underline underline-offset-2">
            {renderInline(n.children)}
          </a>
        );
    }
  });
}

const headingClass = {
  1: 'text-2xl font-bold mt-6',
  2: 'text-xl font-bold mt-6',
  3: 'text-lg font-semibold mt-5',
  4: 'text-base font-semibold mt-4',
} as const;

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-navy">
      {parseMarkdown(source).map((b, i) => {
        switch (b.type) {
          case 'heading': {
            const Tag = `h${b.level + 1}` as 'h2' | 'h3' | 'h4' | 'h5'; // the page title is the h1
            return <Tag key={i} className={headingClass[b.level]}>{renderInline(b.children)}</Tag>;
          }
          case 'paragraph':
            return <p key={i}>{renderInline(b.children)}</p>;
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={`flex flex-col gap-1 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>
                {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
              </Tag>
            );
          }
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-brand/50 bg-brand/5 py-2 pl-4 pr-3 text-muted">
                {renderInline(b.children)}
              </blockquote>
            );
          case 'code':
            return (
              <pre key={i} className="overflow-x-auto rounded-lg border border-line bg-navy/5 p-3 font-mono text-xs">
                <code>{b.text}</code>
              </pre>
            );
          case 'rule':
            return <hr key={i} className="border-line" />;
        }
      })}
    </div>
  );
}

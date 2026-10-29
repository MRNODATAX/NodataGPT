import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js/lib/common';
import { Check, Copy, Download } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const EXTENSION_BY_LANG: Record<string, string> = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'py',
  py: 'py',
  php: 'php',
  html: 'html',
  xml: 'xml',
  css: 'css',
  json: 'json',
  sql: 'sql',
  bash: 'sh',
  sh: 'sh',
  shell: 'sh',
  java: 'java',
  go: 'go',
  rust: 'rs',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  kotlin: 'kt',
  swift: 'swift',
  yaml: 'yml',
  yml: 'yml',
  markdown: 'md',
};

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const normalizedLang = language.toLowerCase();
  let highlightedHtml = '';
  try {
    if (normalizedLang && hljs.getLanguage(normalizedLang)) {
      highlightedHtml = hljs.highlight(code, { language: normalizedLang }).value;
    } else {
      highlightedHtml = hljs.highlightAuto(code).value;
    }
  } catch {
    highlightedHtml = '';
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const area = document.createElement('textarea');
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    const ext = EXTENSION_BY_LANG[normalizedLang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wormgpt-snippet.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 overflow-hidden rounded-[12px] border border-[#25252E] bg-[#0C0C10]">
      <div className="flex items-center justify-between border-b border-[#202028] bg-[#131318] px-3.5 py-2">
        <span className="font-mono text-xs font-medium tracking-wide text-[#B4B4BE]">
          {normalizedLang || 'kode'}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Unduh potongan kode"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#B4B4BE] transition-colors hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Unduh</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Kode tersalin' : 'Salin kode'}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#B4B4BE] transition-colors hover:bg-[#1E1E26] hover:text-[#FAFAFA]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#FB923C]" aria-hidden="true" />
                <span className="text-[#FB923C]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto p-4 text-[13.5px] leading-relaxed">
        {highlightedHtml ? (
          <code
            className="hljs font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className="font-mono text-[#F4F4F6]">{code}</code>
        )}
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="wormgpt-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="font-display text-xl font-semibold text-white">{children}</h2>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto rounded-[12px] border border-[#24242D]">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[#24242D] bg-[#131318] text-[#FAFAFA]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-[#FAFAFA]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-[#1D1D24] px-3.5 py-2.5 text-[#D4D4DC]">
              {children}
            </td>
          ),
          code({ className, children, ...props }) {
            const rawText = String(children).replace(/\n$/, '');
            const match = /language-([\w-]+)/.exec(className || '');
            const isMultiline = rawText.includes('\n') || Boolean(match);

            if (isMultiline) {
              return <CodeBlock language={match?.[1] || ''} code={rawText} />;
            }

            return (
              <code
                className="rounded-md border border-[#341A15] bg-[#1A1210] px-1.5 py-0.5 font-mono text-[0.875em] text-[#FDBA74]"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

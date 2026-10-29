import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import php from 'highlight.js/lib/languages/php';
import { Check, Code2, Copy, Eye } from 'lucide-react';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('svg', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('php', php);

function isPreviewableArtifact(lang: string, code: string): boolean {
  const l = lang.toLowerCase();
  if (l === 'html' || l === 'svg') return true;
  if (l === 'xml' && /<svg[\s>]/i.test(code)) return true;
  return /^<!doctype html/i.test(code.trim()) || /^<html[\s>]/i.test(code.trim());
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canPreview = isPreviewableArtifact(language, code);

  let highlighted = '';
  try {
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
  } catch {
    highlighted = '';
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-white/10 bg-[#060913]/90 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0D1322]/90 px-3.5 py-1.5">
        <span className="font-mono-code text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
          {language || 'kode'}
        </span>

        <div className="flex items-center gap-1">
          {canPreview && (
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              aria-label={showPreview ? 'Lihat kode sumber' : 'Pratinjau live artifact'}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                showPreview
                  ? 'bg-[#FB923C]/18 text-[#FB923C]'
                  : 'text-[#CBD5E1] hover:bg-white/8 hover:text-white'
              }`}
            >
              {showPreview ? (
                <>
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Kode</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-[#FB923C]" />
                  <span>Pratinjau</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Salin blok kode"
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span className="text-[#22D3EE]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="bg-white">
          <iframe
            title="Pratinjau Artifact NodataGPT"
            sandbox="allow-scripts"
            srcDoc={code}
            className="h-[300px] w-full border-0 sm:h-[360px]"
          />
        </div>
      ) : (
        <div className="overflow-x-auto p-3.5 sm:p-4">
          {highlighted ? (
            <pre className="m-0 font-mono-code text-[13px] leading-relaxed">
              <code
                className="hljs"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          ) : (
            <pre className="m-0 font-mono-code text-[13px] leading-relaxed text-[#E2E8F0]">
              <code>{code}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="nodata-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const rawText = String(children).replace(/\n$/, '');
            const match = /language-([\w-]+)/.exec(className || '');
            const isBlock = Boolean(match) || rawText.includes('\n');

            if (isBlock) {
              return <CodeBlock language={match?.[1] || ''} code={rawText} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

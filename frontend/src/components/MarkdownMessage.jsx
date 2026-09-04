import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const stripEmojis = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
};

export const MarkdownMessage = ({ content, isUser = false }) => {
  if (!content) return null;
  const cleanContent = stripEmojis(content);

  return (
    <div className="prose-sm max-w-none text-xs md:text-sm leading-relaxed text-[#0c2340]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed font-normal text-[#0c2340]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-[#0c2340]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#5c6f84]">
              {children}
            </em>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-4 space-y-1.5 list-decimal marker:font-bold marker:text-[#0066cc]">
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-4 space-y-1.5 list-disc marker:text-[#0066cc]">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 text-[#0c2340]">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold my-2 pb-1 border-b text-[#0c2340] border-[#e2e8f0]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-extrabold my-2 text-[#0c2340]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold uppercase tracking-wider my-1.5 text-[#5c6f84]">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 py-0.5 rounded-r border-[#0066cc] bg-[#f0f7ff] text-[#5c6f84]">
              {children}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-[#0066cc] border border-[#e2e8f0]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 rounded-xl text-xs font-mono overflow-x-auto bg-[#0c2340] text-emerald-300 border border-slate-800">
                <code>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-[#e2e8f0] shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#f8fafc] text-[#5c6f84] font-bold uppercase text-[10px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#e2e8f0]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#f8fafc]">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-black">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-2.5 border-[#e2e8f0]" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:opacity-80 transition-opacity text-[#0066cc]"
            >
              {children}
            </a>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};

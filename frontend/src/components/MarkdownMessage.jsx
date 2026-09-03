import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MarkdownMessage = ({ content, isUser = false }) => {
  if (!content) return null;

  return (
    <div className={`prose-sm max-w-none text-xs md:text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#282c3f]'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className={`mb-2 last:mb-0 leading-relaxed ${isUser ? 'text-white' : 'text-[#282c3f]'}`}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className={`font-black ${isUser ? 'text-white font-extrabold' : 'text-[#1e2022] font-black'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${isUser ? 'text-white/90' : 'text-[#535766]'}`}>
              {children}
            </em>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-4 space-y-1.5 list-decimal marker:font-bold marker:text-[#ff3f6c]">
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-4 space-y-1.5 list-disc marker:text-[#ff3f6c]">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className={`leading-relaxed pl-1 ${isUser ? 'text-white' : 'text-[#282c3f]'}`}>
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className={`text-base font-black my-2 pb-1 border-b ${isUser ? 'text-white border-white/20' : 'text-[#282c3f] border-[#eaeaec]'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-sm font-black my-2 ${isUser ? 'text-white' : 'text-[#282c3f]'}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs font-black uppercase tracking-wider my-1.5 ${isUser ? 'text-white' : 'text-[#535766]'}`}>
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`my-2 pl-3 border-l-2 py-0.5 rounded-r ${
              isUser
                ? 'border-white/40 bg-white/10 text-white'
                : 'border-[#ff3f6c] bg-pink-50/40 text-[#535766]'
            }`}>
              {children}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                    isUser
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-[#ff3f6c] border border-gray-200'
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className={`p-3 my-2 rounded-xl text-xs font-mono overflow-x-auto ${
                isUser
                  ? 'bg-black/30 text-white border border-white/10'
                  : 'bg-[#1e1e2e] text-emerald-300 border border-gray-800'
              }`}>
                <code>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-[#eaeaec] shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={isUser ? 'bg-white/10 text-white' : 'bg-gray-50 text-[#535766] font-bold uppercase text-[10px]'}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#eaeaec]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className={isUser ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}>
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
            <hr className={`my-2.5 ${isUser ? 'border-white/20' : 'border-[#eaeaec]'}`} />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline font-bold hover:opacity-80 transition-opacity ${
                isUser ? 'text-white' : 'text-[#ff3f6c]'
              }`}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

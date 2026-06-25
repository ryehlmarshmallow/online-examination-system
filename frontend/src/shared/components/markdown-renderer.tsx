import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import { cn } from "@/shared/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function preprocessMarkdown(content: string): string {
  if (!content) return "";
  // Ensure that all $$math$$ blocks are separated by empty lines so remark-math parses them as display block math
  return content.replace(/(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g, (_, math) => {
    return `\n\n$$\n${math.trim()}\n$$\n\n`;
  });
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const processedContent = preprocessMarkdown(content);

  return (
    <div className={cn("markdown-renderer text-foreground wrap-break-word", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
          code: ({ className, children }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs border border-border">
                {children}
              </code>
            ) : (
              <pre
                className="bg-zinc-950 text-zinc-50 p-4 rounded-lg border border-zinc-800 overflow-x-auto my-3 font-mono text-xs w-full">
                <code className={className}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

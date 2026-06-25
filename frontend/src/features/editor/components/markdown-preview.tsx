import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { cn } from "@/shared/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  label?: string;
  maxHeight?: string;
  resizable?: boolean;
  className?: string;
}

export function MarkdownPreview({
                                  content,
                                  label = "Preview",
                                  maxHeight = "250px",
                                  resizable = false,
                                  className
                                }: MarkdownPreviewProps) {
  if (!content) return null;

  return (
    <div
      className={cn(
        "mt-2 p-3 rounded-md bg-muted/30 border border-dashed border-muted-foreground/20 overflow-auto",
        resizable && "resize-y",
        className
      )}
      style={{ maxHeight }}
    >
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1 select-none">
          {label}
        </p>
      )}
      <MarkdownRenderer content={content} className="text-sm" />
    </div>
  );
}

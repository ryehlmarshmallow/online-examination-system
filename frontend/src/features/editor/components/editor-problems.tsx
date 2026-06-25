import type { Diagnostic } from "@codemirror/lint";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon
} from "lucide-react";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface EditorProblemsProps {
  diagnostics: (Diagnostic & { renderPosition?: string })[];
  onSelect?: (diagnostic: Diagnostic) => void;
}

export function EditorProblems({ diagnostics, onSelect }: EditorProblemsProps) {
  if (diagnostics.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-background border-t">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <AlertCircleIcon className="w-4 h-4 text-destructive" />
        <span className="text-xs font-semibold uppercase tracking-wider">Problems ({diagnostics.length})</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {diagnostics.map((d, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors flex items-start gap-3 group"
              onClick={() => onSelect?.(d)}
            >
              <div className="mt-0.5">
                {d.severity === "error" ? (
                  <AlertCircleIcon className="w-4 h-4 text-destructive" />
                ) : d.severity === "warning" ? (
                  <AlertTriangleIcon className="w-4 h-4 text-warning" />
                ) : (
                  <InfoIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none mb-1 group-hover:text-primary transition-colors">
                  {d.message}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {d.renderPosition || `Offset: ${d.from}-${d.to}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

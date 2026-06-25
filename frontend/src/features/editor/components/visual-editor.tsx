import {
  useMemo,
  useRef
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { AssessmentItemResult } from "../hooks/use-assessment-parser";
import {
  AlertCircleIcon,
  FileQuestionIcon,
  PlusIcon
} from "lucide-react";
import { VisualEditorItem } from "./visual-editor-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shared/components/ui/empty";
import type {
  ValidatedQuestion,
  ValidatedQuestionGroup
} from "../lib/schema";
import { EditorSeparator } from "./editor-separator";
import type { SystemLimitsResponse } from "@/shared/types/system";

interface VisualEditorProps {
  items: AssessmentItemResult[];
  syntaxError: string | null;
  showPreview: boolean;
  onChange: (index: number, updatedItem: ValidatedQuestionGroup | ValidatedQuestion) => void;
  onInsert: (index: number) => void;
  onDelete: (index: number) => void;
  restricted?: boolean;
  systemLimits?: SystemLimitsResponse;
}

export function VisualEditor({
                               items,
                               syntaxError,
                               showPreview,
                               onChange,
                               onInsert,
                               onDelete,
                               restricted = false,
                               systemLimits
                             }: VisualEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350,
    overscan: 5,
  });

  const questionStartIndices = useMemo(() => {
    return items.reduce((acc, _item, idx) => {
      if (idx === 0) return [0];
      const prevItem = items[idx - 1];
      const prevCount = prevItem.data ? prevItem.data.questions.length : 0;
      acc.push(acc[idx - 1] + prevCount);
      return acc;
    }, [] as number[]);
  }, [items]);

  if (syntaxError) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-5 w-5" />
              <CardTitle>Syntax Error</CardTitle>
            </div>
            <CardDescription>
              The editor content has syntax errors that prevent parsing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre
              className="text-sm whitespace-pre-wrap bg-destructive/10 p-4 rounded border border-destructive/20 overflow-auto">
              {syntaxError}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full p-6">
        <Empty className="h-full border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionIcon />
            </EmptyMedia>
            <EmptyTitle>
              {restricted ? "This exam has no questions" : "No questions to display"}
            </EmptyTitle>
            <EmptyDescription>
              {restricted
                ? "This exam was created without any questions. Structural changes are restricted on this page."
                : "Start building your assessment by adding your first question."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {!restricted && (
              <Button variant="outline" size="sm" onClick={() => onInsert(0)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add first question
              </Button>
            )}
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
      style={{ contain: 'strict' }}
    >
      <div
        className="relative px-6 pt-6 pb-24"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index;
          const item = items[index];
          const questionStartIndex = questionStartIndices[index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "calc(100% - 3rem)", // Accounting for px-6 (1.5rem * 2)
                margin: "0 1.5rem",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {!restricted ? (
                <EditorSeparator index={index} onInsert={onInsert} />
              ) : (
                <div className="py-2" />
              )}
              <VisualEditorItem
                item={item}
                index={index}
                questionStartIndex={questionStartIndex}
                showPreview={showPreview}
                onChange={onChange}
                onDelete={onDelete}
                restricted={restricted}
                systemLimits={systemLimits}
              />
              {index === items.length - 1 && (item.success || !!item.data) && (
                !restricted ? (
                  <EditorSeparator index={index + 1} onInsert={onInsert} />
                ) : (
                  <div className="py-2" />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

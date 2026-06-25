import { useState } from "react";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import type { ValidatedQuestion } from "../../lib/schema";

interface EssayQuestionFormProps {
  question: ValidatedQuestion;
  qIndex: number;
  index: number;
  restricted: boolean;
  updateQuestion: (qIndex: number, updated: Partial<ValidatedQuestion>) => void;
  getError: (path: (string | number)[]) => string | null;
}

export function EssayQuestionForm({
                                    question,
                                    qIndex,
                                    index,
                                    restricted,
                                    updateQuestion,
                                    getError
                                  }: EssayQuestionFormProps) {
  const [localMin, setLocalMin] = useState<string | null>(null);
  const [localMax, setLocalMax] = useState<string | null>(null);

  if (question.type !== "ESSAY") return null;

  const content = question.content;
  const minWords = content.minWords ?? 0;
  const maxWords = content.maxWords ?? 500;

  const minError = getError(["questions", qIndex, "content", "minWords"]) || getError(["content", "minWords"]);
  const maxError = getError(["questions", qIndex, "content", "maxWords"]) || getError(["content", "maxWords"]);
  const rangeError = minWords > maxWords ? "Min words cannot be greater than max words" : null;

  const isMinInvalid = minWords < 0 || !!minError || !!rangeError;
  const isMaxInvalid = maxWords < 0 || !!maxError || !!rangeError;

  const minDisplay = localMin !== null ? localMin : String(minWords);
  const maxDisplay = localMax !== null ? localMax : String(maxWords);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Min Words</Label>
        <Input
          id={`min-words-${index}-${qIndex}`}
          aria-label="Min words"
          type="number"
          disabled={restricted}
          value={minDisplay}
          onChange={(e) => {
            const val = e.target.value;
            setLocalMin(val);
            const num = Number(val);
            if (val !== "" && !isNaN(num)) {
              updateQuestion(qIndex, { type: "ESSAY", content: { ...content, minWords: num } });
            }
          }}
          onBlur={() => {
            if (minDisplay === "" || isNaN(Number(minDisplay))) {
              updateQuestion(qIndex, { type: "ESSAY", content: { ...content, minWords: 0 } });
            }
            setLocalMin(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          data-invalid={isMinInvalid}
          aria-invalid={isMinInvalid}
          className={isMinInvalid ? "border-destructive focus-visible:ring-destructive/50" : ""}
        />
        {(minError || rangeError || minWords < 0) && (
          <p className="text-[10px] text-destructive font-medium mt-1">
            {minError || rangeError || (minWords < 0 ? "Min words must be non-negative" : null)}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Max Words</Label>
        <Input
          id={`max-words-${index}-${qIndex}`}
          aria-label="Max words"
          type="number"
          disabled={restricted}
          value={maxDisplay}
          onChange={(e) => {
            const val = e.target.value;
            setLocalMax(val);
            const num = Number(val);
            if (val !== "" && !isNaN(num)) {
              updateQuestion(qIndex, { type: "ESSAY", content: { ...content, maxWords: num } });
            }
          }}
          onBlur={() => {
            if (maxDisplay === "" || isNaN(Number(maxDisplay))) {
              updateQuestion(qIndex, { type: "ESSAY", content: { ...content, maxWords: 0 } });
            }
            setLocalMax(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          data-invalid={isMaxInvalid}
          aria-invalid={isMaxInvalid}
          className={isMaxInvalid ? "border-destructive focus-visible:ring-destructive/50" : ""}
        />
        {(maxError || maxWords < 0) && (
          <p className="text-[10px] text-destructive font-medium mt-1">
            {maxError || (maxWords < 0 ? "Max words must be non-negative" : null)}
          </p>
        )}
      </div>
    </div>
  );
}

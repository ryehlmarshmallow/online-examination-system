import {
  PlusIcon,
  Trash2Icon
} from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Checkbox } from "@shared/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem
} from "@shared/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@shared/components/ui/select";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { cn } from "@/shared/lib/utils";
import type { ValidatedQuestion } from "../../lib/schema";

interface ChoiceQuestionFormProps {
  question: ValidatedQuestion;
  qIndex: number;
  index: number;
  restricted: boolean;
  showPreview: boolean;
  updateQuestion: (qIndex: number, updated: Partial<ValidatedQuestion>) => void;
  getError: (path: (string | number)[]) => string | null;
  touchedFields: Record<string, boolean>;
  markTouched: (fieldId: string) => void;
}

export function ChoiceQuestionForm({
                                     question,
                                     qIndex,
                                     index,
                                     restricted,
                                     showPreview,
                                     updateQuestion,
                                     getError,
                                     touchedFields,
                                     markTouched
                                   }: ChoiceQuestionFormProps) {
  if (question.type !== "SINGLE_CHOICE" && question.type !== "MULTIPLE_CHOICE") return null;

  const content = question.content;
  const rubric = question.rubric;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Options</Label>
          {(() => {
            const optionsError = getError(["questions", qIndex, "content", "options"]) || getError(["content", "options"]);
            return optionsError ? (
              <span className="text-[10px] text-destructive font-medium mt-1">
                {optionsError}
              </span>
            ) : null;
          })()}
        </div>
        {!restricted && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => {
              const newOptions = [...content.options, { text: "" }];
              updateQuestion(qIndex, {
                type: question.type,
                content: { ...content, options: newOptions }
              } as Partial<ValidatedQuestion>);
            }}
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Add Option
          </Button>
        )}
      </div>

      {(() => {
        const isSingleChoice = question.type === "SINGLE_CHOICE";
        const correctOptionId = question.type === "SINGLE_CHOICE" && question.rubric.graderType === "DICHOTOMOUS"
          ? question.rubric.correctOptionId
          : undefined;

        const handleCorrectOptionChange = (val: string) => {
          if (question.type !== "SINGLE_CHOICE") return;
          updateQuestion(qIndex, {
            type: "SINGLE_CHOICE",
            rubric: { ...question.rubric, correctOptionId: Number(val) }
          });
        };

        const optionList = content.options.map((option, optIndex) => {
          const optId = optIndex + 1;

          let isCorrect = false;
          let weight = 0;

          if (question.type === "SINGLE_CHOICE") {
            isCorrect = question.rubric.graderType === "DICHOTOMOUS" && question.rubric.correctOptionId === optId;
          } else if (question.type === "MULTIPLE_CHOICE") {
            if (question.rubric.graderType === "DICHOTOMOUS" || question.rubric.graderType === "HALVING") {
              isCorrect = question.rubric.correctOptionIds.includes(optId);
            } else if (question.rubric.graderType === "WEIGHTED") {
              weight = question.rubric.optionWeights[String(optId)] ?? 0;
            }
          }

          return (
            <div
              key={optIndex}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-sm group/opt"
            >
              <div
                className={`flex items-center justify-center ${question.type === "MULTIPLE_CHOICE" && rubric.graderType === "WEIGHTED" ? "w-16" : "w-8"}`}
              >
                {question.type === "MULTIPLE_CHOICE" && question.rubric.graderType === "WEIGHTED" ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    disabled={restricted}
                    onChange={(e) => {
                      if (question.type !== "MULTIPLE_CHOICE" || question.rubric.graderType !== "WEIGHTED") return;
                      const newWeights = { ...question.rubric.optionWeights };
                      newWeights[String(optId)] = Number(e.target.value);
                      updateQuestion(qIndex, {
                        type: "MULTIPLE_CHOICE",
                        rubric: { ...question.rubric, optionWeights: newWeights }
                      });
                    }}
                    className="w-24 h-8 p-1 text-center text-xs"
                    aria-label={`Option ${optId} weight`}
                  />
                ) : (
                  question.type === "MULTIPLE_CHOICE" ? (
                    <Checkbox
                      checked={isCorrect}
                      disabled={restricted}
                      onCheckedChange={(checked) => {
                        if (question.type !== "MULTIPLE_CHOICE" || question.rubric.graderType === "WEIGHTED") return;
                        let newIds = [...question.rubric.correctOptionIds];
                        if (checked) {
                          newIds.push(optId);
                        } else {
                          newIds = newIds.filter((id: number) => id !== optId);
                        }
                        newIds.sort((a: number, b: number) => a - b);

                        updateQuestion(qIndex, {
                          type: "MULTIPLE_CHOICE",
                          rubric: { ...question.rubric, correctOptionIds: newIds }
                        });
                      }}
                      aria-label={`Mark option ${optId} as correct`}
                    />
                  ) : (
                    <RadioGroupItem
                      value={String(optId)}
                      disabled={restricted}
                      aria-label={`Mark option ${optId} as correct`}
                    />
                  )
                )}
              </div>

              <div className="flex-1 space-y-2">
                {(() => {
                  const fieldId = `opt-${index}-${qIndex}-${optIndex}`;
                  const optError = getError(["questions", qIndex, "content", "options", optIndex, "text"]) || getError(["content", "options", optIndex, "text"]);
                  const isTouched = touchedFields[fieldId];
                  const isInvalid = isTouched && !!optError;

                  return (
                    <>
                      <Input
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...content.options];
                          newOptions[optIndex] = { ...newOptions[optIndex], text: e.target.value };
                          updateQuestion(qIndex, {
                            type: question.type,
                            content: { ...content, options: newOptions }
                          } as Partial<ValidatedQuestion>);
                        }}
                        onBlur={() => markTouched(fieldId)}
                        className={cn(
                          "w-full",
                          isInvalid && "border-destructive focus-visible:ring-destructive/50"
                        )}
                        placeholder={`Option ${optId}`}
                        aria-label={`Option ${optId} text`}
                      />
                      {isInvalid && (
                        <p className="text-[10px] text-destructive font-medium mt-1">
                          {optError}
                        </p>
                      )}
                    </>
                  );
                })()}
                {showPreview && option.text && (
                  <div className="mt-1 p-2 rounded bg-muted/20 border border-dashed border-muted-foreground/10">
                    <MarkdownRenderer content={option.text} className="text-xs" />
                  </div>
                )}
              </div>

              {!restricted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => {
                    const newOptions = content.options.filter((_, i) => i !== optIndex);
                    updateQuestion(qIndex, {
                      type: question.type,
                      content: { ...content, options: newOptions }
                    } as Partial<ValidatedQuestion>);
                  }}
                >
                  <Trash2Icon className="h-4 w-4" />
                  <span className="sr-only">Delete option {optId}</span>
                </Button>
              )}
            </div>
          );
        });

        if (isSingleChoice) {
          return (
            <RadioGroup
              value={correctOptionId !== undefined ? String(correctOptionId) : undefined}
              onValueChange={handleCorrectOptionChange}
              disabled={restricted}
              className="grid gap-3"
            >
              {optionList}
            </RadioGroup>
          );
        }

        return (
          <div className="grid gap-3">
            {optionList}
          </div>
        );
      })()}
    </div>
  );
}

interface ChoiceQuestionFooterProps {
  question: ValidatedQuestion;
  qIndex: number;
  index: number;
  restricted: boolean;
  updateQuestion: (qIndex: number, updated: Partial<ValidatedQuestion>) => void;
}

export function ChoiceQuestionFooter({
                                       question,
                                       qIndex,
                                       index,
                                       restricted,
                                       updateQuestion
                                     }: ChoiceQuestionFooterProps) {
  if (question.type !== "SINGLE_CHOICE" && question.type !== "MULTIPLE_CHOICE") return null;

  const rubric = question.rubric;

  return (
    <div className="border-t bg-muted/20 px-6 py-4 flex flex-wrap gap-6">
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Grader</Label>
        <Select
          value={rubric.graderType}
          disabled={restricted}
          onValueChange={(val: "DICHOTOMOUS" | "HALVING" | "WEIGHTED") => {
            if (question.type === "SINGLE_CHOICE") {
              updateQuestion(qIndex, {
                type: "SINGLE_CHOICE",
                rubric: { graderType: "DICHOTOMOUS", correctOptionId: 1 }
              });
            } else if (question.type === "MULTIPLE_CHOICE") {
              if (val === "WEIGHTED") {
                updateQuestion(qIndex, {
                  type: "MULTIPLE_CHOICE",
                  rubric: { graderType: "WEIGHTED", optionWeights: {}, allowNegativeWeights: false }
                });
              } else {
                updateQuestion(qIndex, {
                  type: "MULTIPLE_CHOICE",
                  rubric: { graderType: val as "DICHOTOMOUS" | "HALVING", correctOptionIds: [] }
                });
              }
            }
          }}
        >
          <SelectTrigger
            id={`grader-${index}-${qIndex}`}
            aria-label="Grader type"
            className="w-40 h-9"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DICHOTOMOUS">Dichotomous</SelectItem>
            {question.type === "MULTIPLE_CHOICE" && <SelectItem value="HALVING">Halving</SelectItem>}
            {question.type === "MULTIPLE_CHOICE" && <SelectItem value="WEIGHTED">Weighted</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {question.type === "MULTIPLE_CHOICE" && rubric.graderType === "WEIGHTED" && (
        <div className="flex items-center gap-2 ml-auto">
          <Checkbox
            id={`negative-${index}-${qIndex}`}
            aria-label="Allow negative weights"
            checked={rubric.allowNegativeWeights}
            disabled={restricted}
            onCheckedChange={(checked) => {
              if (question.type === "MULTIPLE_CHOICE" && rubric.graderType === "WEIGHTED") {
                updateQuestion(qIndex, {
                  type: "MULTIPLE_CHOICE",
                  rubric: { ...rubric, allowNegativeWeights: !!checked }
                });
              }
            }}
          />
          <Label className="text-sm font-medium cursor-pointer">
            Allow negative weights
          </Label>
        </div>
      )}
    </div>
  );
}

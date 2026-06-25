import {
  useState,
  memo,
  useCallback
} from "react";
import type { AssessmentItemResult } from "../hooks/use-assessment-parser";
import {
  AlertCircleIcon,
  Trash2Icon,
  ChevronsLeftRightIcon,
  ChevronsRightLeftIcon
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter
} from "@shared/components/ui/card";
import { Textarea } from "@shared/components/ui/textarea";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import {
  ChoiceQuestionForm,
  ChoiceQuestionFooter
} from "./question-forms/choice-question-form";
import { EssayQuestionForm } from "./question-forms/essay-question-form";
import { FileQuestionForm } from "./question-forms/file-question-form";
import { useVisualItemUpdater } from "../hooks/use-visual-item-updater";
import { MarkdownPreview } from "./markdown-preview";
import { QUESTION_TYPE_LABELS } from "@/features/exams/lib/constants";
import type {
  ValidatedQuestionGroup,
  ValidatedQuestion,
  ValidatedAssessmentItem
} from "../lib/schema";
import { cn } from "@/shared/lib/utils";
import { EditorSeparator } from "./editor-separator";
import type { SystemLimitsResponse } from "@/shared/types/system";

interface VisualEditorItemProps {
  item: AssessmentItemResult;
  index: number;
  questionStartIndex: number;
  showPreview: boolean;
  onChange: (index: number, updatedItem: ValidatedQuestionGroup | ValidatedQuestion) => void;
  onDelete: (index: number) => void;
  restricted?: boolean;
  systemLimits?: SystemLimitsResponse;
}


export const VisualEditorItem = memo(function VisualEditorItem({
                                                                 item,
                                                                 index,
                                                                 questionStartIndex,
                                                                 showPreview,
                                                                 onChange,
                                                                 onDelete,
                                                                 restricted = false,
                                                                 systemLimits
                                                               }: VisualEditorItemProps) {
  const [localNumbers, setLocalNumbers] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false);

  const markTouched = useCallback((fieldId: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldId]: true }));
  }, []);

  const groupData = item.data as ValidatedAssessmentItem | undefined;
  const group = groupData || { isGroup: false, prompt: "", questions: [] };
  const isGroup = groupData?.isGroup !== false && (group.questions.length > 1 || !!group.prompt || groupData?.isGroup === true);

  const handleLocalChange = useCallback((updated: ValidatedQuestionGroup | ValidatedQuestion) => {
    onChange(index, updated);
  }, [index, onChange]);

  const handleLocalDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  const {
    updateGroup,
    updateQuestion,
    changeQuestionType,
    insertQuestion,
    promoteToGroup,
    downgradeToSingle,
    deleteQuestion
  } = useVisualItemUpdater(group, handleLocalChange);

  if (!item.success && !item.data) {
    return (
      <Card className="border-destructive/20 overflow-hidden shadow-sm">
        <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircleIcon className="h-5 w-5" />
                <CardTitle className="text-base">Critical Schema Error</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Item at index <span className="font-mono font-bold text-foreground">{index}</span> has a structure that
                cannot be
                visualized.
              </CardDescription>
            </div>
            {item.range && (
              <div
                className="text-[10px] font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20">
                L{item.range[0]}:C{item.range[1]} - L{item.range[2]}:C{item.range[3]}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-destructive/10 max-h-75 overflow-y-auto">
            {item.error.issues.map((issue, idx) => {
              const range = item.issueRanges?.[idx];
              return (
                <div key={idx}
                     className="px-4 py-2.5 flex gap-3 items-start hover:bg-destructive/2 transition-colors group/issue">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      {issue.path.length > 0 && (
                        <div
                          className="text-[10px] font-bold font-mono uppercase tracking-wider text-destructive/70 truncate">
                          {issue.path.join(".")}
                        </div>
                      )}
                      {range && (
                        <div className="text-[9px] font-mono text-destructive/50 shrink-0 tabular-nums">
                          L{range[0]}:C{range[1]}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-destructive/90 leading-tight">
                      {issue.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 bg-muted/30 border-t border-destructive/10">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-medium">
            <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            Fix the structural errors in the code editor to enable visual editing.
          </div>
        </CardFooter>
      </Card>
    );
  }

  const getError = (path: (string | number)[]) => {
    if (item.success) return null;
    const pathStr = path.join(".");
    // Match exact path OR the end of a path (to handle Zod wrappers/unions)
    const issue = item.error.issues.find(issue => {
      const issuePathStr = issue.path.join(".");
      return issuePathStr === pathStr || issuePathStr.endsWith("." + pathStr);
    });
    return issue?.message ?? null;
  };

  const renderQuestion = (q: ValidatedQuestion, qIndex: number) => {
    return (
      <Card key={qIndex} className={cn("shadow-sm", isGroup && "shadow-none border-muted")}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardDescription className="font-bold tracking-widest text-muted-foreground uppercase text-xs">
                Question {questionStartIndex + qIndex + 1}
              </CardDescription>
              <Select
                value={q.type}
                onValueChange={(val: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY" | "FILE") => changeQuestionType(qIndex, val)}
                disabled={restricted}
              >
                <SelectTrigger
                  aria-label="Question type"
                  className={cn(
                    "h-7 w-auto min-w-35 text-xs font-bold uppercase tracking-widest border-none bg-transparent focus:ring-0 shadow-none transition-colors",
                    !restricted && "hover:text-foreground/80"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                {!isGroup && !restricted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={promoteToGroup}
                    aria-label="Promote to group"
                  >
                    <ChevronsLeftRightIcon className="h-4 w-4" />
                  </Button>
                )}
                {!restricted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      if (isGroup && group.questions.length === 1) {
                        setIsDeleteDialogOpen(true);
                      } else if (isGroup) {
                        deleteQuestion(qIndex);
                      } else {
                        handleLocalDelete();
                      }
                    }}
                    aria-label="Delete question"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
                <Label className="text-xs ml-2">Points</Label>
                {(() => {
                  const errorMessage = getError(["questions", qIndex, "points"]) || getError(["points"]);
                  const isInvalid = q.points < 0 || !!errorMessage;
                  const valKey = `q-${qIndex}-points`;
                  const displayValue = localNumbers[valKey] !== undefined ? localNumbers[valKey] : String(q.points);

                  return (
                    <Input
                      id={`points-${index}-${qIndex}`}
                      aria-label="Points"
                      type="number"
                      disabled={restricted}
                      value={displayValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalNumbers(prev => ({ ...prev, [valKey]: val }));
                        const num = Number(val);
                        if (val !== "" && !isNaN(num)) {
                          updateQuestion(qIndex, { points: num });
                        }
                      }}
                      onBlur={() => {
                        if (displayValue === "" || isNaN(Number(displayValue))) {
                          updateQuestion(qIndex, { points: 0 });
                        }
                        setLocalNumbers(prev => {
                          const next = { ...prev };
                          delete next[valKey];
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      data-invalid={isInvalid}
                      aria-invalid={isInvalid}
                      className={`w-16 h-8 text-sm ${isInvalid ? "border-destructive focus-visible:ring-destructive/50" : ""}`}
                    />
                  );
                })()}
              </div>
              {(() => {
                const errorMessage = getError(["questions", qIndex, "points"]) || getError(["points"]) || (q.points < 0 ? "Points must be non-negative" : null);
                return errorMessage ? (
                  <span className="text-[10px] text-destructive font-medium mt-1">
                    {errorMessage}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prompt</Label>
            {(() => {
              const promptError = getError(["questions", qIndex, "prompt"]) || getError(["prompt"]);
              const fieldId = `prompt-${index}-${qIndex}`;
              const isTouched = touchedFields[fieldId];
              const isInvalid = isTouched && !!promptError;

              return (
                <>
                  <Textarea
                    id={fieldId}
                    aria-label="Prompt"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                    onBlur={() => markTouched(fieldId)}
                    className={cn(
                      "min-h-25 max-h-62.5 overflow-y-auto resize-y text-base leading-relaxed",
                      isInvalid && "border-destructive focus-visible:ring-destructive/50"
                    )}
                    placeholder="Enter question prompt..."
                  />
                  {isInvalid && (
                    <span className="text-[10px] text-destructive font-medium mt-1">
                      {promptError}
                    </span>
                  )}
                </>
              );
            })()}
            {showPreview && q.prompt && (
              <MarkdownPreview content={q.prompt} resizable maxHeight="250px" />
            )}
          </div>

          <ChoiceQuestionForm
            question={q}
            qIndex={qIndex}
            index={index}
            restricted={restricted}
            showPreview={showPreview}
            updateQuestion={updateQuestion}
            getError={getError}
            touchedFields={touchedFields}
            markTouched={markTouched}
          />

          <EssayQuestionForm
            question={q}
            qIndex={qIndex}
            index={index}
            restricted={restricted}
            updateQuestion={updateQuestion}
            getError={getError}
          />

          <FileQuestionForm
            question={q}
            qIndex={qIndex}
            index={index}
            restricted={restricted}
            systemLimits={systemLimits}
            updateQuestion={updateQuestion}
          />
        </CardContent>

        <ChoiceQuestionFooter
          question={q}
          qIndex={qIndex}
          index={index}
          restricted={restricted}
          updateQuestion={updateQuestion}
        />
      </Card>
    );
  };

  return (
    <>
      {isGroup ? (
        <Card className="border-2 border-muted shadow-sm overflow-hidden bg-muted/5 pt-0 gap-0">
          <CardHeader className="bg-muted/20 border-b p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Label
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Question Group
              </Label>
              {!restricted && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      if (!group.prompt?.trim() && group.questions.length <= 1) {
                        downgradeToSingle();
                      } else {
                        setIsDowngradeDialogOpen(true);
                      }
                    }}
                    aria-label="Downgrade to normal question"
                  >
                    <ChevronsRightLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    aria-label="Delete group"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
              >
                Group Prompt
              </Label>
              <Textarea
                id={`group-prompt-${index}`}
                aria-label="Group Prompt"
                value={group.prompt}
                onChange={(e) => updateGroup({ prompt: e.target.value })}
                placeholder="Enter group prompt (optional)..."
                className="bg-background min-h-20 max-h-50 overflow-y-auto resize-y"
              />
              {showPreview && group.prompt && (
                <MarkdownPreview content={group.prompt} resizable maxHeight="200px" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-0">
            {!restricted ? (
              <EditorSeparator index={0} onInsert={insertQuestion} />
            ) : (
              <div className="py-2" />
            )}
            {group.questions.map((q, qIndex) => (
              <div key={qIndex}>
                {renderQuestion(q, qIndex)}
                {!restricted ? (
                  <EditorSeparator index={qIndex + 1} onInsert={insertQuestion} />
                ) : (
                  <div className="py-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        renderQuestion(group.questions[0], 0)
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entire question group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleLocalDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDowngradeDialogOpen} onOpenChange={setIsDowngradeDialogOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to Single Question</DialogTitle>
            <DialogDescription>
              Downgrading to a normal question will delete the group prompt and all questions except the first one. Are
              you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDowngradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                downgradeToSingle();
                setIsDowngradeDialogOpen(false);
              }}
            >
              Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

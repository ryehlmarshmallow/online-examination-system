import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect
} from "react";
import { useBlocker } from "react-router-dom";
import YAML from "yaml";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@shared/components/ui/resizable";
import { CodeEditor } from "@/features/editor/components/code-editor";
import type { Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { EditorProblems } from "./editor-problems";
import { Text } from "@codemirror/state";
import { VisualEditor } from "@/features/editor/components/visual-editor";
import {
  ButtonGroup,
  ButtonGroupSeparator
} from "@/shared/components/ui/button-group";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  CodeIcon,
  EyeIcon,
  EyeOffIcon,
  MousePointer2Icon,
  PlusIcon,
  SaveIcon,
  SaveAll,
  ChevronDown,
  Rocket,
} from "lucide-react";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  useAssessmentParser,
  validateItem
} from "../hooks/use-assessment-parser";
import type { AssessmentItemResult } from "../hooks/use-assessment-parser";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type {
  ValidatedAssessmentItem,
  ValidatedQuestionGroup,
  ValidatedQuestion
} from "../lib/schema";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/get-error-message";
import { getSystemLimits } from "@/shared/api/system-api";
import type { SystemLimitsResponse } from "@/shared/types/system";
import { EditorSettingsSheet } from "./editor-settings-sheet";

type ViewMode = "visual" | "split" | "code";

interface AssessmentEditorProps {
  initialYaml?: string;
  onSave?: (yaml: string) => Promise<void>;
  isSaving?: boolean;
  successMessage?: string;
  restricted?: boolean;
  onSaveAs?: () => void;
  onDeploy?: () => void;
  sourceType?: "EXAM" | "TEMPLATE" | "POOL";
}

export function AssessmentEditor({
                                   initialYaml = "",
                                   onSave,
                                   isSaving,
                                   successMessage = "Assessment saved successfully",
                                   restricted = false,
                                   onSaveAs,
                                   onDeploy,
                                   sourceType
                                 }: AssessmentEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(restricted ? "visual" : "split");
  const [showPreview, setShowPreview] = useState(true);
  const [codeYaml, setCodeYaml] = useState<string>(initialYaml);
  const [prevInitialYaml, setPrevInitialYaml] = useState(initialYaml);
  const [cleanYaml, setCleanYaml] = useState(initialYaml);
  const lastSource = useRef<"code" | "visual" | null>(null);
  const [limits, setLimits] = useState<SystemLimitsResponse | undefined>();
  const [visualItems, setVisualItems] = useState<AssessmentItemResult[]>([]);

  const editorViewRef = useRef<EditorView | null>(null);

  const handleEditorCreate = useCallback((view: EditorView) => {
    editorViewRef.current = view;
  }, []);

  const handleProblemSelect = useCallback((d: Diagnostic) => {
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      view.dispatch({
        selection: { anchor: d.from, head: d.to },
        scrollIntoView: true,
      });
      view.focus();
    }
  }, []);

  useEffect(() => {
    getSystemLimits().then(setLimits).catch(err => {
      console.error("Failed to fetch system limits", err);
    });
  }, []);

  const [parsedYaml, setParsedYaml] = useState<string>(initialYaml);

  // Sync prop to state (immediately during render)
  if (initialYaml !== prevInitialYaml) {
    setPrevInitialYaml(initialYaml);
    setCleanYaml(initialYaml);
    if (lastSource.current === null) {
      setCodeYaml(initialYaml);
      setParsedYaml(initialYaml);
    }
  }

  const isDirty = codeYaml !== cleanYaml;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (confirmLeave) {
        blocker.proceed?.();
      } else {
        blocker.reset?.();
      }
    }
  }, [blocker]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Debounce parsing of code changes, but update immediately for visual edits
  useEffect(() => {
    if (codeYaml === parsedYaml) return;

    if (lastSource.current === "visual") {
      setParsedYaml(codeYaml);
      return;
    }

    const handler = setTimeout(() => {
      setParsedYaml(codeYaml);
    }, 300);

    return () => clearTimeout(handler);
  }, [codeYaml, parsedYaml]);

  // Reset lastSource once code and parsed YAML are back in sync
  useEffect(() => {
    if (codeYaml === parsedYaml) {
      lastSource.current = null;
    }
  }, [codeYaml, parsedYaml]);

  // Single Source of Truth: items are derived directly from parsedYaml
  const { items, syntaxError, allSyntaxErrors, hasValidationErrors } = useAssessmentParser(parsedYaml, limits);

  // Sync visualItems with items when items change, unless the change originated from the visual editor
  useEffect(() => {
    if (lastSource.current !== "visual") {
      setVisualItems(items);
    }
  }, [items]);

  const syncVisualToCode = useCallback((newItems: AssessmentItemResult[], immediateParsed = false) => {
    // Helper to strip IDs from options to keep YAML clean (IDs are implicit by position)
    const cleanData = (data: unknown): unknown => {
      if (!data || typeof data !== 'object') return data;

      if (Array.isArray(data)) {
        return data.map(cleanData);
      }

      const obj = data as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'options' && Array.isArray(value)) {
          cleaned[key] = value.map((opt: unknown) => {
            if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
              const newOpt = { ...(opt as Record<string, unknown>) };
              delete newOpt.id;
              return cleanData(newOpt);
            }
            return cleanData(opt);
          });
        } else {
          cleaned[key] = cleanData(value);
        }
      }
      return cleaned;
    };

    const doc = new YAML.Document();
    doc.contents = doc.createNode(newItems.map(it => it.success ? cleanData(it.data) : it.raw));
    const yamlStr = doc.toString({
      defaultStringType: 'QUOTE_DOUBLE',
      defaultKeyType: 'PLAIN',
    });
    setCodeYaml(yamlStr);
    if (immediateParsed) {
      setParsedYaml(yamlStr);
    }
    return yamlStr;
  }, []);

  const handleCodeChange = useCallback((val: string | undefined) => {
    lastSource.current = "code";
    setCodeYaml(val || "");
  }, []);

  const handleItemChange = useCallback((index: number, updatedItem: ValidatedQuestionGroup | ValidatedQuestion) => {
    lastSource.current = "visual";
    const nextItems = [...visualItems];
    const result = validateItem(updatedItem, limits);
    nextItems[index] = { ...result, range: visualItems[index]?.range };
    setVisualItems(nextItems);
  }, [visualItems, limits]);

  const handleItemInsert = useCallback((index: number) => {
    lastSource.current = "visual";
    const newItem: ValidatedAssessmentItem = {
      isGroup: false,
      prompt: "",
      questions: [{
        type: "SINGLE_CHOICE",
        points: 1,
        prompt: "",
        content: {
          options: [{ id: 1, text: "" }, { id: 2, text: "" }]
        },
        rubric: {
          graderType: "DICHOTOMOUS",
          correctOptionId: 1
        }
      }]
    };

    const nextItems = [...visualItems];
    nextItems.splice(index, 0, { success: true, data: newItem });
    setVisualItems(nextItems);
    syncVisualToCode(nextItems, true);
  }, [visualItems, syncVisualToCode]);

  const handleItemDelete = useCallback((index: number) => {
    lastSource.current = "visual";
    const nextItems = [...visualItems];
    nextItems.splice(index, 1);
    setVisualItems(nextItems);
    syncVisualToCode(nextItems, true);
  }, [visualItems, syncVisualToCode]);

  // Debounce syncing visual changes to YAML code
  useEffect(() => {
    if (lastSource.current !== "visual") return;

    const handler = setTimeout(() => {
      syncVisualToCode(visualItems, true);
    }, 300);

    return () => clearTimeout(handler);
  }, [visualItems, syncVisualToCode]);

  const diagnostics = useMemo(() => {
    const d: Diagnostic[] = [];
    const doc = Text.of(parsedYaml.split("\n"));

    if (allSyntaxErrors) {
      allSyntaxErrors.forEach(err => {
        try {
          const line = doc.line(Math.min(err.line, doc.lines));
          const from = line.from + Math.max(0, err.col - 1);
          d.push({
            message: err.message,
            severity: "error",
            from: Math.min(from, doc.length),
            to: Math.min(from + 1, doc.length),
            renderPosition: `L${err.line}:C${err.col}`,
          } as Diagnostic & { renderPosition?: string });
        } catch { /* ignore */
        }
      });
    }

    items.forEach(item => {
      if (!item.success && item.range) {
        try {
          const startLine = doc.line(Math.min(item.range[0], doc.lines));
          const endLine = doc.line(Math.min(item.range[2], doc.lines));
          const itemFrom = startLine.from + Math.max(0, item.range[1] - 1);
          const itemTo = endLine.from + Math.max(0, item.range[3] - 1);

          item.error.issues.forEach((issue, idx) => {
            const pathStr = issue.path.join(".");
            const message = pathStr ? `${pathStr}: ${issue.message}` : issue.message;

            let from = itemFrom;
            let to = itemTo;
            let renderPosition = `L${item.range![0]}:C${item.range![1]}`;

            if (item.issueRanges && item.issueRanges[idx]) {
              const r = item.issueRanges[idx];
              const sLine = doc.line(Math.min(r[0], doc.lines));
              const eLine = doc.line(Math.min(r[2], doc.lines));
              from = sLine.from + Math.max(0, r[1] - 1);
              to = eLine.from + Math.max(0, r[3] - 1);
              renderPosition = `L${r[0]}:C${r[1]}`;
            }

            d.push({
              message,
              severity: "error",
              from: Math.min(from, doc.length),
              to: Math.min(Math.max(from, to), doc.length),
              renderPosition,
            } as Diagnostic & { renderPosition?: string });
          });
        } catch { /* ignore */
        }
      }
    });

    return d;
  }, [items, allSyntaxErrors, parsedYaml]);

  const handleSave = async () => {
    if (!onSave) {
      toast.success(`${successMessage} (mock)`);
      return;
    }

    try {
      await onSave(codeYaml);
      lastSource.current = null;
      setCleanYaml(codeYaml);
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-1 flex-col w-full h-full gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute left-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
                aria-label={showPreview ? "Hide preview" : "Show preview"}
              >
                {showPreview ? (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </>
                ) : (
                  <>
                    <EyeOffIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showPreview ? "Hide preview" : "Show preview"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!restricted && (
          <ButtonGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "visual" ? "default" : "outline"}
                  onClick={() => setViewMode("visual")}
                  aria-label="Visual view"
                >
                  <MousePointer2Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visual view</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "split" ? "default" : "outline"}
                  onClick={() => setViewMode("split")}
                  aria-label="Split view"
                >
                  <MousePointer2Icon className="w-4 h-4" />
                  <PlusIcon className="w-3 h-3 mx-0.5" />
                  <CodeIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Split view</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "code" ? "default" : "outline"}
                  onClick={() => setViewMode("code")}
                  aria-label="Code view"
                >
                  <CodeIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Code view</p>
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
        )}

        <div className="absolute right-0 flex items-center gap-2">
          {(viewMode === "split" || viewMode === "code") && (
            <EditorSettingsSheet />
          )}

          <ButtonGroup>
            <Button
              onClick={handleSave}
              disabled={isSaving || !!syntaxError || hasValidationErrors}
            >
              {isSaving ? (
                <Spinner className="mr-2" />
              ) : (
                <SaveIcon className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  disabled={isSaving || !!syntaxError || hasValidationErrors}
                  aria-label="More actions"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {sourceType === "POOL" && (
                  <>
                    {onSaveAs && (
                      <DropdownMenuItem onClick={onSaveAs}>
                        <SaveAll className="w-4 h-4 mr-2" />
                        Save as Template...
                      </DropdownMenuItem>
                    )}
                    {onDeploy && (
                      <DropdownMenuItem onClick={onDeploy}>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy as Exam...
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {sourceType === "TEMPLATE" && (
                  <>
                    {onSaveAs && (
                      <DropdownMenuItem onClick={onSaveAs}>
                        <SaveAll className="w-4 h-4 mr-2" />
                        Save as Pool...
                      </DropdownMenuItem>
                    )}
                    {onDeploy && (
                      <DropdownMenuItem onClick={onDeploy}>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy as Exam...
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {sourceType === "EXAM" && onSaveAs && (
                  <DropdownMenuItem onClick={onSaveAs}>
                    <SaveAll className="w-4 h-4 mr-2" />
                    Save As...
                  </DropdownMenuItem>
                )}
                {!sourceType && (
                  <>
                    {onSaveAs && (
                      <DropdownMenuItem onClick={onSaveAs}>
                        <SaveAll className="w-4 h-4 mr-2" />
                        Save As...
                      </DropdownMenuItem>
                    )}
                    {onDeploy && (
                      <DropdownMenuItem onClick={onDeploy}>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy as Exam...
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
          {viewMode !== "code" && (
            <ResizablePanel defaultSize={viewMode === "split" ? 50 : 100}>
              <div className="h-full overflow-hidden">
                <VisualEditor
                  items={visualItems}
                  syntaxError={syntaxError}
                  showPreview={showPreview}
                  onChange={handleItemChange}
                  onInsert={handleItemInsert}
                  onDelete={handleItemDelete}
                  restricted={restricted}
                  systemLimits={limits}
                />
              </div>
            </ResizablePanel>
          )}

          {viewMode === "split" && <ResizableHandle withHandle />}

          {viewMode !== "visual" && (
            <ResizablePanel defaultSize={viewMode === "split" ? 50 : 100}>
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize={diagnostics.length > 0 ? 70 : 100} minSize={30}>
                  <div className="h-full overflow-hidden">
                    <CodeEditor
                      value={codeYaml}
                      onChange={handleCodeChange}
                      diagnostics={diagnostics}
                      onEditorCreate={handleEditorCreate}
                    />
                  </div>
                </ResizablePanel>
                {diagnostics.length > 0 && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={30} minSize={10}>
                      <EditorProblems
                        diagnostics={diagnostics}
                        onSelect={handleProblemSelect}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

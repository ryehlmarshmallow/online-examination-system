import CodeMirror from "@uiw/react-codemirror";
import * as allThemes from "@uiw/codemirror-themes-all";
import { yaml } from "@codemirror/lang-yaml";
import {
  linter,
  lintGutter
} from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import {
  memo,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState
} from "react";
import { yamlCompletions } from "../lib/codemirror-config";
import { useEditorSettings } from "@/shared/hooks/use-editor-settings";
import { useTheme } from "@/shared/components/theme-context";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  diagnostics?: Diagnostic[];
  onEditorCreate?: (view: EditorView) => void;
}

export const CodeEditor = memo(function CodeEditor({
                                                     value,
                                                     onChange,
                                                     diagnostics,
                                                     onEditorCreate,
                                                   }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const { theme: editorTheme, fontSize, lineWrapping } = useEditorSettings();
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const lastValueRef = useRef(value);
  const lastDiagnosticsRef = useRef(diagnostics);
  const lastScrollPos = useRef(0);

  // Capture scroll position continuously
  useEffect(() => {
    if (!editorView) return;

    const handleScroll = () => {
      if (editorView.scrollDOM) {
        lastScrollPos.current = editorView.scrollDOM.scrollTop;
      }
    };

    editorView.scrollDOM.addEventListener("scroll", handleScroll);
    return () => editorView.scrollDOM.removeEventListener("scroll", handleScroll);
  }, [editorView]);

  const cmTheme = useMemo(() => {
    if (editorTheme === "system") {
      return resolvedTheme;
    }
    const themes = allThemes as unknown as Record<string, Extension>;
    return themes[editorTheme] || resolvedTheme;
  }, [editorTheme, resolvedTheme]);

  useEffect(() => {
    const valueChanged = value !== lastValueRef.current;
    const diagnosticsChanged = diagnostics !== lastDiagnosticsRef.current;

    // If the content or diagnostics changed externally (e.g. from VisualEditor) and we're not focused, restore scroll
    if (editorView && (valueChanged || diagnosticsChanged) && !editorView.hasFocus) {
      const scrollPos = lastScrollPos.current;

      requestAnimationFrame(() => {
        if (editorView.scrollDOM) {
          editorView.scrollDOM.scrollTop = scrollPos;
        }
      });
    }
    lastValueRef.current = value;
    lastDiagnosticsRef.current = diagnostics;
  }, [value, diagnostics, editorView]);

  const handleEditorCreate = useCallback((view: EditorView) => {
    setEditorView(view);
    onEditorCreate?.(view);
  }, [onEditorCreate]);

  const yamlExtension = useMemo(() => yaml(), []);
  const autocompleteExtension = useMemo(() => autocompletion({ override: [yamlCompletions] }), []);
  const linterExtension = useMemo(() => linter(() => diagnostics || []), [diagnostics]);
  const gutterExtension = useMemo(() => lintGutter(), []);

  const themeExtension = useMemo(() => EditorView.theme({
    "&": {
      fontSize: `${fontSize}px`,
      fontFamily: "var(--font-mono)",
      height: "100%", // Ensure the editor base fills the React container
    },
    ".cm-scroller": {
      overflow: "auto", // Enable the internal scrollbar
      fontFamily: "inherit",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
    }
  }), [fontSize]);

  const extensions = useMemo(() => {
    const exts = [
      yamlExtension,
      autocompleteExtension,
      linterExtension,
      gutterExtension,
      themeExtension,
    ];

    if (lineWrapping) {
      exts.push(EditorView.lineWrapping);
    }

    return exts;
  }, [yamlExtension, autocompleteExtension, linterExtension, gutterExtension, themeExtension, lineWrapping]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={cmTheme}
        height="100%"
        className="flex-1 min-h-0 h-full"
        extensions={extensions}
        onCreateEditor={handleEditorCreate}
        basicSetup={{
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false
        }}
      />
    </div>
  );
});

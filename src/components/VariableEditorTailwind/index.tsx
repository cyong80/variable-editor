import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder, CharacterCount } from "@tiptap/extensions";
import Mention from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";

import { VariableChip } from "../tailwind/VariableChip";
import { VariableSuggestionList } from "../tailwind/VariableSuggestionList";
import { VariableInsertDialog } from "../tailwind/VariableInsertDialog";
import { cn } from "@/lib/utils";
import { DEFAULT_VARIABLES } from "@/lib/constants";
import {
  serializeToVariableText,
  parseVariableText,
} from "@/lib/variableFormat";
import { MaxLines } from "@/extensions/maxLines";

export interface VariableEditorRef {
  focus: () => void;
  getValue: () => string;
  getMentions: () => string[];
}

export interface VariableEditorRootProps {
  className?: string;
  placeholder?: string;
  variables?: string[];
  maxLength?: number;
  maxLines?: number;
  viewMode?: boolean;
  onValueChange?: (value: string, mentions: string[]) => void;
  onChange?: (value: string, mentions: string[]) => void;
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  children?: ReactNode;
}

function traverseMentions(
  node: {
    type?: string;
    attrs?: { id?: string };
    content?: unknown[];
  },
  mentions: string[],
) {
  if (node.type === "mention" && node.attrs?.id) {
    mentions.push(node.attrs.id);
  }
  node.content?.forEach((child) =>
    traverseMentions(child as Parameters<typeof traverseMentions>[0], mentions),
  );
}

function useMentionSuggestionRenderer() {
  const rootRef = useRef<Root | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedIndexRef = useRef(0);
  const propsRef = useRef<SuggestionProps<
    { id: string },
    { id: string }
  > | null>(null);

  const renderList = (
    props: SuggestionProps<{ id: string }, { id: string }>,
  ) => {
    if (!rootRef.current || !listRef.current) return;
    const idx = Math.min(
      selectedIndexRef.current,
      Math.max(0, props.items.length - 1),
    );
    rootRef.current.render(
      <VariableSuggestionList
        items={props.items}
        selectedIndex={idx}
        onSelect={(item) => props.command(item)}
        clientRect={props.clientRect ?? null}
      />,
    );
  };

  return {
    renderList,
    refs: {
      rootRef,
      listRef,
      selectedIndexRef,
      propsRef,
    },
    handlers: {
      onStart: (props: SuggestionProps<{ id: string }, { id: string }>) => {
        propsRef.current = props;
        selectedIndexRef.current = 0;
        listRef.current = document.createElement("div");
        document.body.appendChild(listRef.current);
        rootRef.current = createRoot(listRef.current);
        renderList(props);
      },
      onUpdate: (props: SuggestionProps<{ id: string }, { id: string }>) => {
        propsRef.current = props;
        selectedIndexRef.current = Math.min(
          selectedIndexRef.current,
          Math.max(0, props.items.length - 1),
        );
        renderList(props);
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        const { event } = props;
        const currentProps = propsRef.current;
        if (!currentProps) return false;

        if (event.key === "ArrowDown") {
          selectedIndexRef.current = Math.min(
            selectedIndexRef.current + 1,
            currentProps.items.length - 1,
          );
          renderList(currentProps);
          return true;
        }
        if (event.key === "ArrowUp") {
          selectedIndexRef.current = Math.max(
            selectedIndexRef.current - 1,
            0,
          );
          renderList(currentProps);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          const item = currentProps.items[selectedIndexRef.current];
          if (item) {
            currentProps.command(item);
          }
          return true;
        }
        return false;
      },
      onExit: () => {
        if (rootRef.current && listRef.current) {
          rootRef.current.unmount();
          listRef.current.remove();
          rootRef.current = null;
          listRef.current = null;
        }
        propsRef.current = null;
      },
    },
  };
}

export interface VariableEditorContextValue {
  editor: Editor | null;
  variables: string[];
  viewMode: boolean;
  disabled: boolean;
  charCount: number;
  wordCount: number;
  lineCount: number;
  maxLength: number | undefined;
  maxLines: number | undefined;
  variableDialogOpen: boolean;
  setVariableDialogOpen: (open: boolean) => void;
  insertPosRef: React.MutableRefObject<number>;
  handleInsertVariable: (variableId: string) => void;
  formValue: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  hiddenInputRef: React.RefObject<HTMLInputElement | null>;
  id: string | undefined;
  name: string | undefined;
}

const VariableEditorContext = createContext<VariableEditorContextValue | null>(
  null,
);

function useVariableEditorContext(component: string) {
  const ctx = useContext(VariableEditorContext);
  if (!ctx) {
    throw new Error(
      `${component} must be used within VariableEditor.Root`,
    );
  }
  return ctx;
}

const VariableEditorRoot = forwardRef<
  VariableEditorRef,
  VariableEditorRootProps
>(function VariableEditorRoot(
  {
    className,
    placeholder = "텍스트 입력... # 입력 후 변수 선택",
    variables = [...DEFAULT_VARIABLES],
    maxLength,
    maxLines,
    viewMode = false,
    onValueChange,
    onChange,
    value: controlledValue,
    defaultValue = "",
    name,
    id,
    disabled = false,
    required = false,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedby,
    children,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const suggestion = useMentionSuggestionRenderer();
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const insertPosRef = useRef<number>(0);
  const latestValueRef = useRef<string>("");
  const latestMentionsRef = useRef<string[]>([]);
  const initialContent = controlledValue ?? defaultValue;
  const [formValue, setFormValue] = useState(initialContent);
  const hasSetInitialContent = useRef(false);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({
        limit: maxLength ?? null,
        wordCounter: (text) => text.split(/\s+/).filter((w) => w !== "").length,
      }),
      ...(maxLines != null && !viewMode
        ? [MaxLines.configure({ limit: maxLines })]
        : []),
      Mention.extend({
        addNodeView() {
          return ReactNodeViewRenderer(VariableChip);
        },
      }).configure({
        HTMLAttributes: { class: "variable-mention" },
        renderText: ({ node }) => `#{${node.attrs.id}}`,
        renderHTML: ({ node }) => [
          "span",
          mergeAttributes(
            { "data-type": "mention", "data-id": node.attrs.id },
            { class: "variable-mention" },
          ),
          `#${"{" + node.attrs.id + "}"}`,
        ],
        suggestion: {
          char: "#",
          allowedPrefixes: null,
          items: ({ query }) =>
            variables
              .filter((v) => v.toLowerCase().includes(query.toLowerCase()))
              .map((id) => ({ id })),
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "mention",
                  attrs: { id: props.id, mentionSuggestionChar: "#" },
                },
              ])
              .run();
          },
          render: () => ({
            onStart: suggestion.handlers.onStart,
            onUpdate: suggestion.handlers.onUpdate,
            onKeyDown: suggestion.handlers.onKeyDown,
            onExit: suggestion.handlers.onExit,
          }),
        },
      }),
    ],
    content:
      controlledValue !== undefined
        ? controlledValue
          ? parseVariableText(controlledValue)
          : { type: "doc", content: [{ type: "paragraph" }] }
        : "",
    editable: !disabled && !viewMode,
    editorProps: {
      attributes: {
        ...(id && { id }),
        class: cn(
          "min-h-[140px] max-h-[320px] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-shadow prose prose-sm max-w-none leading-relaxed",
          "focus:border-blue-400 focus:ring-2 focus:ring-blue-200",
          disabled && "pointer-events-none opacity-60",
        ),
      },
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus(),
    getValue: () => latestValueRef.current,
    getMentions: () => [...latestMentionsRef.current],
  }));

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      if (editor.storage.characterCount) {
        setCharCount(editor.storage.characterCount.characters());
        setWordCount(editor.storage.characterCount.words());
      }
      setLineCount(editor.state.doc.content.childCount);
      const mentions: string[] = [];
      const json = editor.getJSON();
      json.content?.forEach((node) =>
        traverseMentions(node as Parameters<typeof traverseMentions>[0], mentions),
      );
      const uniqueMentions = [...new Set(mentions)];
      const variableText = serializeToVariableText(json);
      latestValueRef.current = variableText;
      latestMentionsRef.current = uniqueMentions;
      setFormValue(variableText);
      onValueChange?.(variableText, uniqueMentions);
      onChange?.(variableText, uniqueMentions);
    };
    handleUpdate();
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, onValueChange, onChange]);

  useEffect(() => {
    if (editor == null) return;

    if (controlledValue !== undefined) {
      const current = serializeToVariableText(editor.getJSON());
      if (current !== controlledValue) {
        queueMicrotask(() => {
          editor.commands.setContent(
            controlledValue ? parseVariableText(controlledValue) : "",
            { emitUpdate: false },
          );
          setFormValue(controlledValue);
          if (editor.storage.characterCount) {
            setCharCount(editor.storage.characterCount.characters());
            setWordCount(editor.storage.characterCount.words());
          }
          setLineCount(editor.state.doc.content.childCount);
        });
      }
      return;
    }

    if (defaultValue && !hasSetInitialContent.current) {
      hasSetInitialContent.current = true;
      queueMicrotask(() => {
        editor.commands.setContent(parseVariableText(defaultValue), {
          emitUpdate: true,
        });
        setFormValue(defaultValue);
      });
    }
  }, [editor, controlledValue, defaultValue]);

  useEffect(() => {
    editor?.setEditable(!disabled && !viewMode);
  }, [editor, disabled, viewMode]);

  const handleInsertVariable = (variableId: string) => {
    if (!editor) return;
    const pos = insertPosRef.current;
    const mentionNodeSize = 2;
    editor
      .chain()
      .focus()
      .insertContentAt(pos, [
        {
          type: "mention",
          attrs: { id: variableId, mentionSuggestionChar: "#" },
        },
      ])
      .setTextSelection(pos + mentionNodeSize)
      .run();
    setVariableDialogOpen(false);
  };

  const contextValue: VariableEditorContextValue = {
    editor,
    variables,
    viewMode,
    disabled,
    charCount,
    wordCount,
    lineCount,
    maxLength,
    maxLines,
    variableDialogOpen,
    setVariableDialogOpen,
    insertPosRef,
    handleInsertVariable,
    formValue,
    containerRef,
    hiddenInputRef,
    id,
    name,
  };

  const defaultChildren = (
    <>
      <VariableEditorContent />
      <VariableEditorFooter>
        <VariableEditorInsertDialog />
        <VariableEditorStats />
      </VariableEditorFooter>
    </>
  );

  return (
    <VariableEditorContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn(
          "relative",
          viewMode && "variable-editor-view-mode",
          className,
        )}
        {...(viewMode && { "data-view-mode": "true" })}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        aria-required={required}
        aria-disabled={disabled}
      >
        {name && (
          <input
            ref={hiddenInputRef}
            type="hidden"
            name={name}
            value={formValue}
            tabIndex={-1}
            aria-hidden
          />
        )}
        {children ?? defaultChildren}
      </div>
    </VariableEditorContext.Provider>
  );
});

function VariableEditorContent({ className }: { className?: string }) {
  const { editor } = useVariableEditorContext("VariableEditor.Content");
  return <EditorContent editor={editor} className={className} />;
}

function VariableEditorFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-transparent bg-gray-50 px-1 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

function VariableEditorInsertDialog() {
  const {
    editor,
    variables,
    viewMode,
    disabled,
    variableDialogOpen,
    setVariableDialogOpen,
    insertPosRef,
    handleInsertVariable,
  } = useVariableEditorContext("VariableEditor.InsertDialog");

  if (viewMode) return null;

  return (
    <VariableInsertDialog
      open={variableDialogOpen}
      onOpenChange={setVariableDialogOpen}
      variables={variables}
      disabled={disabled}
      onInsert={handleInsertVariable}
      onTriggerMouseDown={() => {
        if (editor) insertPosRef.current = editor.state.selection.from;
      }}
      onDialogClose={() => editor?.commands.focus()}
    />
  );
}

interface VariableEditorStatsProps {
  className?: string;
}

function VariableEditorStats({ className }: VariableEditorStatsProps) {
  const { charCount, lineCount, maxLength, maxLines } =
    useVariableEditorContext("VariableEditor.Stats");
  const charOverflow = maxLength != null && charCount > maxLength;
  const lineOverflow = maxLines != null && lineCount > maxLines;
  const overflow = charOverflow || lineOverflow;

  const charPart =
    maxLength != null ? (
      <>
        {charCount.toLocaleString()} / {maxLength.toLocaleString()}자
      </>
    ) : (
      <>{charCount.toLocaleString()}자</>
    );
  const linePart =
    maxLines != null ? (
      <>
        {lineCount.toLocaleString()} / {maxLines.toLocaleString()}줄
      </>
    ) : null;

  return (
    <span
      className={cn(
        "ml-auto flex items-center gap-1.5 tabular-nums text-xs",
        overflow ? "font-medium text-red-600" : "text-gray-500",
        className,
      )}
    >
      {charPart}
      {linePart != null && (
        <>
          <span className="mx-1 opacity-50">·</span>
          {linePart}
        </>
      )}
    </span>
  );
}

type VariableEditorCompound = ForwardRefExoticComponent<
  VariableEditorRootProps & RefAttributes<VariableEditorRef>
> & {
  Root: typeof VariableEditorRoot;
  Content: typeof VariableEditorContent;
  Footer: typeof VariableEditorFooter;
  InsertDialog: typeof VariableEditorInsertDialog;
  Stats: typeof VariableEditorStats;
};

export const VariableEditorTailwind: VariableEditorCompound = Object.assign(
  VariableEditorRoot,
  {
    Root: VariableEditorRoot,
    Content: VariableEditorContent,
    Footer: VariableEditorFooter,
    InsertDialog: VariableEditorInsertDialog,
    Stats: VariableEditorStats,
  },
);

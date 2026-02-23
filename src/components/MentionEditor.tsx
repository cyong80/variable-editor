import { useCallback, useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { DEFAULT_VARIABLES, VARIABLE_REGEX } from "@/lib/constants";
import {
  extractMentionIds,
  formatVariableId,
} from "@/lib/variableFormat";

interface MentionEditorProps {
  className?: string;
  placeholder?: string;
  variables?: string[];
  onValueChange?: (value: string, mentions: string[]) => void;
}

function parseMentions(
  text: string,
): { parts: (string | { type: "mention"; value: string })[] } {
  const parts: (string | { type: "mention"; value: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(VARIABLE_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: "mention", value: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return { parts };
}

function getTextBeforeCaret(container: HTMLElement): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(container);
  range.setEnd(selection.anchorNode!, selection.anchorOffset);
  return range.toString();
}

function getCaretCharacterOffset(container: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(container);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
}

function setCaretToOffset(container: HTMLElement, offset: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  let charCount = 0;
  let found = false;

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = charCount + (node.textContent?.length ?? 0);
      if (offset <= next) {
        range.setStart(
          node,
          Math.min(offset - charCount, node.textContent?.length ?? 0),
        );
        range.collapse(true);
        found = true;
        return true;
      }
      charCount = next;
    } else if (node.nodeName === "BR") {
      const next = charCount + 1;
      if (offset <= next) {
        if (offset === next) {
          range.setStartAfter(node);
        } else {
          range.setStartBefore(node);
        }
        range.collapse(true);
        found = true;
        return true;
      }
      charCount = next;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (walk(node.childNodes[i]!)) return true;
      }
    }
    return false;
  }

  walk(container);
  if (found) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

const mentionEditorContainerVariants = cva("relative");

const mentionEditorInputVariants = cva(
  "min-h-[140px] max-h-[320px] w-full overflow-y-auto rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-colors [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:whitespace-pre-wrap [&:empty::before]:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const mentionEditorSuggestionsVariants = cva(
  "absolute z-50 max-h-[200px] min-w-[160px] overflow-auto rounded-md border border-border bg-popover p-1 shadow-md",
);

const mentionEditorSuggestionsEmptyVariants = cva(
  "px-2 py-1.5 text-sm text-muted-foreground",
);

const mentionEditorSuggestionItemVariants = cva(
  "flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
  {
    variants: {
      selected: {
        true: "bg-accent text-accent-foreground",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

const mentionEditorSuggestionItemLabelVariants = cva("font-mono text-primary");

export function MentionEditor({
  className,
  placeholder = "텍스트 입력... #{변수명} 형태로 맨션",
  variables = [...DEFAULT_VARIABLES],
  onValueChange,
}: MentionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  const getRawText = useCallback((el: HTMLElement): string => {
    return el.innerText ?? el.textContent ?? "";
  }, []);

  const formatContent = useCallback((text: string): string => {
    const { parts } = parseMentions(text);
    return parts
      .map((p) =>
        typeof p === "string"
          ? p
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>")
          : `<span contenteditable="false" data-mention="${p.value}" class="mention">${formatVariableId(p.value)}</span>`,
      )
      .join("");
  }, []);

  const updateContent = useCallback(
    (newRawText: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const prevOffset = getCaretCharacterOffset(editor);
      const newHtml = formatContent(newRawText);
      editor.innerHTML = newHtml;
      const offsetToRestore = Math.min(prevOffset, newRawText.length);
      editor.focus();
      setCaretToOffset(editor, offsetToRestore);

      onValueChange?.(newRawText, extractMentionIds(newRawText));
    },
    [formatContent, onValueChange],
  );

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;

    const editor = editorRef.current;
    if (!editor) return;

    const text = getRawText(editor);
    const textBeforeCaret = getTextBeforeCaret(editor);

    const hashBraceIndex = textBeforeCaret.lastIndexOf("#{");
    if (hashBraceIndex !== -1) {
      const afterHashBrace = textBeforeCaret.slice(hashBraceIndex + 2);
      if (!afterHashBrace.includes("}")) {
        setSuggestionFilter(afterHashBrace);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        updateContent(text);
        return;
      }
    }

    setShowSuggestions(false);
    updateContent(text);
  }, [getRawText, updateContent]);

  const filteredVariables = variables.filter((v) =>
    v.toLowerCase().includes(suggestionFilter.toLowerCase()),
  );

  const insertMention = useCallback(
    (variable: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const fullText = getRawText(editor);
      const caretOffset = getCaretCharacterOffset(editor);
      const textBeforeCaret = getTextBeforeCaret(editor);
      const hashBraceIndex = textBeforeCaret.lastIndexOf("#{");

      const beforePart = textBeforeCaret.slice(0, hashBraceIndex);
      const afterPart = fullText.slice(caretOffset);
      const newText = beforePart + formatVariableId(variable) + afterPart;

      updateContent(newText);
      setShowSuggestions(false);
      editor.focus();
      requestAnimationFrame(() => {
        setCaretToOffset(
          editor,
          beforePart.length + variable.length + 3, // #{}
        );
      });
    },
    [getRawText, updateContent],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSuggestions && filteredVariables.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSuggestionIndex((i) =>
            Math.min(i + 1, filteredVariables.length - 1),
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSuggestionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredVariables[suggestionIndex]!);
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          return;
        }
        if (e.key === "}") {
          e.preventDefault();
          insertMention(filteredVariables[suggestionIndex]!);
          return;
        }
      }

      if (e.key === "Enter" && !showSuggestions) {
        e.preventDefault();
        document.execCommand("insertLineBreak", false);
        setTimeout(
          () => editor.dispatchEvent(new Event("input", { bubbles: true })),
          0,
        );
      }
    };

    editor.addEventListener("keydown", handleKeyDown);
    return () => editor.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestions, filteredVariables, suggestionIndex, insertMention]);

  const handleComposition = useCallback((e: React.CompositionEvent) => {
    isComposingRef.current = e.type === "compositionstart";
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      const editor = editorRef.current;
      if (editor) {
        setTimeout(() => handleInput(), 0);
      }
    },
    [handleInput],
  );

  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showSuggestions || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    setSuggestionPos({
      top: rect.bottom - editorRect.top + 4,
      left: rect.left - editorRect.left,
    });
  }, [showSuggestions, suggestionFilter]);

  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selected = suggestionsRef.current.querySelector(
        `[data-index="${suggestionIndex}"]`,
      );
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [showSuggestions, suggestionIndex]);

  return (
    <div className={cn(mentionEditorContainerVariants(), className)}>
      <div
        ref={editorRef}
        contentEditable
        className={mentionEditorInputVariants()}
        data-placeholder={placeholder}
        onInput={handleInput}
        onCompositionStart={handleComposition}
        onCompositionEnd={handleComposition}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className={mentionEditorSuggestionsVariants()}
          style={{ top: suggestionPos.top, left: suggestionPos.left }}
        >
          {filteredVariables.length === 0 ? (
            <div className={mentionEditorSuggestionsEmptyVariants()}>
              일치하는 변수 없음
            </div>
          ) : (
            filteredVariables.map((variable, index) => (
              <button
                key={variable}
                type="button"
                data-index={index}
                className={mentionEditorSuggestionItemVariants({
                  selected: index === suggestionIndex,
                })}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(variable);
                }}
              >
                <span className={mentionEditorSuggestionItemLabelVariants()}>
                  {formatVariableId(variable)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <style>{`
        .mention {
          display: inline;
          padding: 0.125rem 0.375rem;
          margin: 0 0.125rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
          background: hsl(var(--primary) / 0.12);
          color: hsl(var(--primary));
          border-radius: 0.25rem;
          white-space: nowrap;
          user-select: all;
          -webkit-user-select: all;
        }
        .mention::selection {
          background: hsl(var(--primary) / 0.3);
        }
      `}</style>
    </div>
  );
}

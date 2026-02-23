import { useLayoutEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { X } from "lucide-react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { cva } from "class-variance-authority";
import { formatVariableId } from "@/lib/variableFormat";

const variableChipWrapperVariants = cva("variable-chip-wrapper", {
  variants: {},
  defaultVariants: {},
});

const variableChipVariants = cva("variable-chip", {
  variants: {},
  defaultVariants: {},
});

const variableChipLabelVariants = cva("variable-chip__label", {
  variants: {},
  defaultVariants: {},
});

const variableChipRemoveVariants = cva("variable-chip__remove", {
  variants: {},
  defaultVariants: {},
});

const variableChipIconVariants = cva("variable-chip__icon", {
  variants: {},
  defaultVariants: {},
});

export function VariableChip({ node, deleteNode }: ReactNodeViewProps) {
  const variableId = node.attrs.id ?? "";
  const label = formatVariableId(variableId);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [viewMode, setViewMode] = useState(false);

  useLayoutEffect(() => {
    const inViewMode =
      wrapperRef.current?.closest("[data-view-mode]")?.getAttribute(
        "data-view-mode",
      ) === "true";
    setViewMode(inViewMode);
  }, []);

  return (
    <NodeViewWrapper as="span" className={variableChipWrapperVariants()}>
      <span ref={wrapperRef} className={variableChipVariants()}>
        <span className={variableChipLabelVariants()}>{label}</span>
        {!viewMode && (
          <button
            type="button"
            className={variableChipRemoveVariants()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={`${variableId} 변수 제거`}
          >
            <X className={variableChipIconVariants()} size={8} strokeWidth={2.5} />
          </button>
        )}
      </span>
    </NodeViewWrapper>
  );
}

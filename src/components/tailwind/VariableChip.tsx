import { useLayoutEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { formatVariableId } from "@/lib/variableFormat";

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
    <NodeViewWrapper
      as="span"
      className="inline mx-1 align-middle"
    >
      <span
        ref={wrapperRef}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-blue-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-100"
      >
        <span className="select-none font-mono text-[13px] tracking-tight">
          {label}
        </span>
        {!viewMode && (
          <button
            type="button"
            className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={`${variableId} 변수 제거`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </span>
    </NodeViewWrapper>
  );
}

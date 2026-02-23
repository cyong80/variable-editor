import { useEffect } from "react";
import { formatVariableId } from "@/lib/variableFormat";

interface VariableInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: string[];
  disabled?: boolean;
  onInsert: (variableId: string) => void;
  onTriggerMouseDown: () => void;
  onDialogClose: () => void;
}

export function VariableInsertDialog({
  open,
  onOpenChange,
  variables,
  disabled,
  onInsert,
  onTriggerMouseDown,
  onDialogClose,
}: VariableInsertDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        onDialogClose();
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange, onDialogClose]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className={`
          inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700
          shadow-sm transition-all
          hover:border-blue-300 hover:bg-gray-50
          disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
        `}
        onMouseDown={(e) => {
          e.preventDefault();
          onTriggerMouseDown();
        }}
        onClick={() => onOpenChange(true)}
      >
        + 변수 삽입
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variable-dialog-title"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => {
              onOpenChange(false);
              onDialogClose();
            }}
          />

          {/* Content */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="variable-dialog-title"
                className="text-base font-semibold text-gray-900"
              >
                변수 선택
              </h2>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onDialogClose();
                }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="닫기"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="grid max-h-[280px] gap-1 overflow-y-auto pr-1">
              {variables.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="flex w-full cursor-pointer items-center rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onInsert(id)}
                >
                  <span className="font-mono text-[13px]">
                    {formatVariableId(id)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { cva } from "class-variance-authority";
import { formatVariableId } from "@/lib/variableFormat";

const variableSuggestionPopupVariants = cva(
  "variable-suggestion-popup animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
);

const variableSuggestionInnerVariants = cva(
  "variable-suggestion-inner z-50 max-h-[220px] min-w-[200px] overflow-auto rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-lg shadow-black/5 backdrop-blur-sm",
);

const variableSuggestionEmptyVariants = cva(
  "px-3 py-2.5 text-sm text-muted-foreground",
);

const variableSuggestionItemVariants = cva(
  "variable-suggestion-item flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-all duration-150",
  {
    variants: {
      selected: {
        true: "bg-primary/10 text-primary",
        false: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

const variableSuggestionItemLabelVariants = cva("font-mono text-[13px]");

interface VariableSuggestionListProps {
  items: { id: string }[];
  selectedIndex: number;
  onSelect: (item: { id: string }) => void;
  clientRect: (() => DOMRect | null) | null;
}

export function VariableSuggestionList({
  items,
  selectedIndex,
  onSelect,
  clientRect,
}: VariableSuggestionListProps) {
  const rect = clientRect?.();

  return (
    <div
      className={variableSuggestionPopupVariants()}
      style={
        rect
          ? {
              position: "fixed",
              top: rect.bottom + 6,
              left: rect.left,
              zIndex: 50,
            }
          : undefined
      }
    >
      <div className={variableSuggestionInnerVariants()}>
        {items.length === 0 ? (
          <div className={variableSuggestionEmptyVariants()}>
            일치하는 변수 없음
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={variableSuggestionItemVariants({
                selected: index === selectedIndex,
              })}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
            >
              <span className={variableSuggestionItemLabelVariants()}>
                {formatVariableId(item.id)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

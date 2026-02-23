import { formatVariableId } from "@/lib/variableFormat";

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
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={
        rect
          ? {
              top: rect.bottom + 6,
              left: rect.left,
            }
          : undefined
      }
    >
      <div className="z-50 max-h-[220px] min-w-[200px] overflow-auto rounded-xl border border-gray-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
        {items.length === 0 ? (
          <div className="px-3 py-2.5 text-sm text-gray-500">
            일치하는 변수 없음
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                index === selectedIndex
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
            >
              <span className="font-mono text-[13px]">
                {formatVariableId(item.id)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

import { cva } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatVariableId } from "@/lib/variableFormat";

const variableInsertDialogTriggerVariants = cva(
  "h-8 rounded-lg border-border/60 bg-background/80 text-xs font-medium shadow-sm transition-all hover:border-primary/30 hover:bg-background",
  {
    variants: {
      disabled: {
        true: "pointer-events-none opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

const variableInsertDialogContentVariants = cva(
  "variable-dialog sm:max-w-sm rounded-2xl border-border/80 shadow-xl",
);

const variableInsertDialogGridVariants = cva(
  "variable-dialog-grid grid max-h-[280px] gap-1 overflow-y-auto py-1 pr-1",
);

const variableInsertDialogItemVariants = cva(
  "variable-dialog-item flex w-full cursor-pointer items-center rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 hover:bg-primary/10 hover:text-primary",
);

const variableInsertDialogItemLabelVariants = cva("font-mono text-[13px]");

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={variableInsertDialogTriggerVariants({ disabled })}
          onMouseDown={(e) => {
            e.preventDefault();
            onTriggerMouseDown();
          }}
        >
          + 변수 삽입
        </Button>
      </DialogTrigger>
      <DialogContent
        className={variableInsertDialogContentVariants()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          onDialogClose();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            변수 선택
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className={variableInsertDialogGridVariants()}>
          {variables.map((id) => (
            <button
              key={id}
              type="button"
              className={variableInsertDialogItemVariants()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(id)}
            >
              <span className={variableInsertDialogItemLabelVariants()}>
                {formatVariableId(id)}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

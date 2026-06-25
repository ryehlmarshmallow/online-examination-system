import { memo } from "react";
import { PlusIcon } from "lucide-react";

interface EditorSeparatorProps {
  index: number;
  onInsert: (index: number) => void;
}

export const EditorSeparator = memo(function EditorSeparator({ index, onInsert }: EditorSeparatorProps) {
  return (
    <div
      className="group relative py-2 w-full flex items-center justify-center cursor-pointer z-10"
      onClick={(e) => {
        e.stopPropagation();
        onInsert(index);
      }}
    >
      <div className="w-full h-px bg-transparent group-hover:bg-primary/30 transition-colors" />
      <div
        className="absolute opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 bg-background border border-primary/30 rounded-full p-1 shadow-sm">
        <PlusIcon className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
});

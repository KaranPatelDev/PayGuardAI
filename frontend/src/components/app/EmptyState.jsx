import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction, testid }) {
  return (
    <div
      data-testid={testid || "empty-state"}
      className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white border border-dashed border-[#C9D2C3] rounded-lg"
    >
      <div className="w-14 h-14 rounded-lg bg-[#0A3B2C]/8 text-[#0A3B2C] flex items-center justify-center mb-5">
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl font-medium text-gray-950">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-md leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          data-testid={`${testid || "empty-state"}-action`}
          className="mt-5 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

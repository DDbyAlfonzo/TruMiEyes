import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Comment = {
  id: string;
  message: string;
  createdAt?: string;
  userEmail?: string;
};

type CommentPanelProps = {
  comments: Comment[];
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  saving?: boolean;
  compact?: boolean;
};

export function CommentPanel({
  comments,
  value = "",
  onChange,
  onSubmit,
  saving,
  compact,
}: CommentPanelProps) {
  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.slice(compact ? -2 : undefined).map((comment) => (
            <div key={comment.id} className="border-l border-line pl-3">
              {comment.userEmail && (
                <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                  {comment.userEmail}
                </p>
              )}
              <p className="text-sm leading-5 text-zinc-300">{comment.message}</p>
            </div>
          ))}
        </div>
      )}
      {onChange && onSubmit && (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Add a note"
            className="h-10 py-2"
          />
          <Button variant="outline" size="icon" onClick={onSubmit} disabled={saving}>
            <Send size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}

import { LucideIcon, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Database,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-dashed border-border rounded-xl">
      <div className="mb-4 rounded-full bg-stone-100 p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-[#E8621A] text-white hover:bg-[#E8621A]/90"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

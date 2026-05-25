import { cn } from '@/lib/utils';

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'default' &&
          'border-transparent bg-primary text-primary-foreground shadow-sm',
        variant === 'secondary' &&
          'border-transparent bg-secondary text-secondary-foreground',
        variant === 'destructive' &&
          'border-transparent bg-destructive text-destructive-foreground shadow-sm',
        variant === 'outline' && 'text-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Badge };

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

function useSelect() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within a Select');
  return ctx;
}

function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleValueChange, open, setOpen }}
    >
      {children}
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
  id,
  ...props
}: React.ComponentProps<'button'> & { id?: string }) {
  const { open, setOpen, value } = useSelect();
  return (
    <button
      id={id}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 opacity-50" />
    </button>
  );
}

function SelectValue({
  placeholder,
  className,
  ...props
}: React.ComponentProps<'span'> & { placeholder?: string }) {
  const { value } = useSelect();
  return (
    <span
      className={cn(
        'block truncate',
        !value && 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {value || placeholder}
    </span>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { open, setOpen } = useSelect();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.parentElement?.contains(e.target as Node) &&
        !(e.target as Element).closest('[role="listbox"]')
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] animate-slide-up overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )}
      role="listbox"
      {...props}
    >
      {children}
    </div>
  );
}

function SelectItem({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<'div'> & { value: string }) {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <div
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={() => onValueChange(value)}
      role="option"
      aria-selected={isSelected}
      {...props}
    >
      {children}
    </div>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };

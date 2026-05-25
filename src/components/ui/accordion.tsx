'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccordionContextType = {
  expandedValue: string | null;
  toggleValue: (value: string) => void;
  collapsible: boolean;
};

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx)
    throw new Error('Accordion components must be used within an Accordion');
  return ctx;
}

type ItemContextType = {
  value: string;
};

const ItemContext = createContext<ItemContextType | null>(null);

function useItem() {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error('AccordionItem context not found');
  return ctx;
}

function Accordion({
  type = 'single',
  collapsible = false,
  className,
  children,
  ...props
}: {
  type?: 'single';
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  const toggleValue = useCallback(
    (value: string) => {
      setExpandedValue((prev) =>
        prev === value ? (collapsible ? null : prev) : value
      );
    },
    [collapsible]
  );

  return (
    <AccordionContext.Provider
      value={{ expandedValue, toggleValue, collapsible }}
    >
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({
  className,
  value,
  ...props
}: React.ComponentProps<'div'> & { value: string }) {
  const { expandedValue } = useAccordion();
  const isExpanded = expandedValue === value;

  return (
    <ItemContext.Provider value={{ value }}>
      <div
        className={cn('border-b last:border-b-0', className)}
        data-state={isExpanded ? 'open' : 'closed'}
        {...props}
      />
    </ItemContext.Provider>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const { toggleValue } = useAccordion();
  const { value } = useItem();
  const { expandedValue } = useAccordion();
  const isExpanded = expandedValue === value;

  return (
    <h3 className="flex">
      <button
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          className
        )}
        onClick={() => toggleValue(value)}
        data-state={isExpanded ? 'open' : 'closed'}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
      </button>
    </h3>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { expandedValue } = useAccordion();
  const { value } = useItem();
  const isExpanded = expandedValue === value;

  if (!isExpanded) return null;

  return (
    <div
      className={cn('overflow-hidden text-sm animate-slide-down', className)}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

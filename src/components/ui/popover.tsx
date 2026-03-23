"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue>({ open: false, onOpenChange: () => {} });

function Popover({ children, open: controlledOpen, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleChange = React.useCallback((v: boolean) => { setUncontrolledOpen(v); onOpenChange?.(v); }, [onOpenChange]);
  return <PopoverContext.Provider value={{ open, onOpenChange: handleChange }}><div className="relative">{children}</div></PopoverContext.Provider>;
}

function PopoverTrigger({ children, className, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  return <button type="button" className={className} onClick={() => onOpenChange(!open)} {...props}>{children}</button>;
}

function PopoverContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div ref={ref} className={cn("absolute z-50 mt-2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none", className)} {...props}>
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };

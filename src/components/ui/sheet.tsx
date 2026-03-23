"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, onOpenChange: () => {} });

function Sheet({ children, open: controlledOpen, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleChange = React.useCallback((v: boolean) => { setUncontrolledOpen(v); onOpenChange?.(v); }, [onOpenChange]);
  return <SheetContext.Provider value={{ open, onOpenChange: handleChange }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return <button type="button" className={className} onClick={() => onOpenChange(true)} {...props}>{children}</button>;
}

function SheetContent({ children, className, side = "right", ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className={cn("fixed inset-y-0 z-50 w-3/4 max-w-sm border bg-background p-6 shadow-lg", side === "right" ? "right-0" : "left-0", className)} {...props}>
        <button type="button" className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

function SheetClose({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return <button type="button" className={className} onClick={() => onOpenChange(false)} {...props}>{children}</button>;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose };

"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";

const searchableItems = [
  { label: "Dashboard", href: "/", group: "Pages" },
  { label: "Vendors", href: "/vendors", group: "Pages" },
  { label: "Purchase Orders", href: "/purchase-orders", group: "Pages" },
  { label: "New Purchase Order", href: "/purchase-orders/new", group: "Pages" },
  { label: "Invoices", href: "/invoices", group: "Pages" },
  { label: "Inventory", href: "/inventory", group: "Pages" },
  { label: "Settings", href: "/settings", group: "Pages" },
];

export function HeaderBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <button
        onClick={() => setOpen(true)}
        className="flex w-80 items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg">
            <CommandInput placeholder="Type to search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Pages">
                {searchableItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="cursor-pointer"
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  );
}

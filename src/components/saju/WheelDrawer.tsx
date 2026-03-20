import { useState, useRef, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WheelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: string[];
  value: string;
  onSelect: (value: string) => void;
}

function WheelColumn({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44;

  const selectedIndex = items.indexOf(value);

  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      containerRef.current.scrollTo({
        top: selectedIndex * itemHeight,
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
  }, [items, value, onChange]);

  return (
    <div className="relative h-[220px] overflow-hidden">
      {/* Selection highlight */}
      <div className="pointer-events-none absolute left-0 right-0 top-[88px] z-10 h-[44px] rounded-md border border-primary bg-primary/5" />
      {/* Gradient masks */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-[88px] bg-gradient-to-b from-bg-elevated to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[88px] bg-gradient-to-t from-bg-elevated to-transparent" />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto scrollbar-hide"
        style={{ paddingTop: 88, paddingBottom: 88 }}
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "flex h-[44px] w-full snap-center items-center justify-center text-body-strong transition-fast",
              item === value ? "text-foreground" : "text-text-muted"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WheelDrawer({ open, onOpenChange, title, items, value, onSelect }: WheelDrawerProps) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    if (open) setTempValue(value);
  }, [open, value]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-sp-6 py-sp-4">
          <WheelColumn items={items} value={tempValue} onChange={setTempValue} />
        </div>
        <DrawerFooter>
          <Button
            onClick={() => {
              onSelect(tempValue);
              onOpenChange(false);
            }}
            className="h-14 w-full rounded-md bg-primary text-button text-primary-foreground hover:bg-primary-hover active:bg-primary-active"
          >
            확인
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-14 w-full rounded-md">
              취소
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

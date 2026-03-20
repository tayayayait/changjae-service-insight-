import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TrustItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface TrustSectionProps {
  items: TrustItem[];
}

export function TrustSection({ items }: TrustSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="rounded-[24px] border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-subtle text-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-title text-foreground">{item.title}</h3>
            <p className="mt-2 text-caption text-text-secondary">{item.description}</p>
          </Card>
        );
      })}
    </div>
  );
}

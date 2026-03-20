import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DirectoryItem {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  status?: "active" | "coming-soon";
  tone?: "sky" | "pink" | "mint" | "lavender" | "coral";
}

interface ServiceDirectoryProps {
  items: DirectoryItem[];
}

const toneClasses: Record<NonNullable<DirectoryItem["tone"]>, string> = {
  sky: "bg-accent-sky/25",
  pink: "bg-accent-pink/25",
  mint: "bg-accent-mint/25",
  lavender: "bg-accent-lavender/25",
  coral: "bg-accent-coral/25",
};

export function ServiceDirectory({ items }: ServiceDirectoryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <Card
            className={cn(
              "flex h-full min-h-[150px] flex-col rounded-[24px] border border-border bg-bg-elevated p-5 shadow-sm transition-normal",
              item.status === "active" ? "hover:-translate-y-0.5 hover:shadow-md" : "opacity-95",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/70 text-foreground", toneClasses[item.tone ?? "sky"])}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-bg-subtle px-3 py-1 text-[11px] font-semibold text-text-secondary">
                {item.status === "active" ? "이용 가능" : "준비 중"}
              </span>
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="line-clamp-2 text-title text-foreground">{item.title}</h3>
              <p className="line-clamp-3 text-caption text-text-secondary">{item.description}</p>
            </div>
          </Card>
        );

        if (item.status === "active" && item.to) {
          return (
            <Link key={item.title} to={item.to} className="block h-full">
              {content}
            </Link>
          );
        }

        return (
          <div key={item.title} className="h-full">
            {content}
          </div>
        );
      })}
    </div>
  );
}

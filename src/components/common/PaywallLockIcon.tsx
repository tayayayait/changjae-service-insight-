import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaywallLockIconProps {
  className?: string;
}

export function PaywallLockIcon({ className }: PaywallLockIconProps) {
  return <Lock className={cn("fill-current stroke-current", className)} />;
}

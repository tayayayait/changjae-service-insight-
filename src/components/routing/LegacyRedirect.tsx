import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LegacyRedirectProps {
  to: string;
  message: string;
}

export function LegacyRedirect({ to, message }: LegacyRedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info(message);
    navigate(to, { replace: true });
  }, [message, navigate, to]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">서비스가 이동되었습니다. 잠시만 기다려 주세요.</p>
    </div>
  );
}

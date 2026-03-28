import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LoginForm } from "./LoginForm";

export function LoginModal() {
  const isLoginModalOpen = useAuthStore((state) => state.isLoginModalOpen);
  const setLoginModalOpen = useAuthStore((state) => state.setLoginModalOpen);
  const location = useLocation();
  const isChatRoute = location.pathname === "/chat";
  const isDismissLocked = isChatRoute;
  const isModalOpenInScope = isChatRoute && isLoginModalOpen;
  const defaultNextPath =
    isChatRoute ? `${location.pathname}${location.search}` : null;

  useEffect(() => {
    if (!isChatRoute && isLoginModalOpen) {
      setLoginModalOpen(false);
    }
  }, [isChatRoute, isLoginModalOpen, setLoginModalOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !isChatRoute) {
      return;
    }
    if (!nextOpen && isDismissLocked) {
      return;
    }
    setLoginModalOpen(nextOpen);
  };

  return (
    <Dialog open={isModalOpenInScope} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        className={cn(
          "sm:max-w-[480px] border-none bg-transparent p-0 shadow-none",
          isDismissLocked && "[&>button]:hidden",
        )}
        overlayClassName="md:left-[320px]"
        onPointerDownOutside={(event) => {
          if (isDismissLocked) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isDismissLocked) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isDismissLocked) {
            event.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">로그인</DialogTitle>
        <LoginForm 
          showTitle={true} 
          defaultNextPath={defaultNextPath}
          onSuccess={() => setLoginModalOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}

import { LoginForm } from "@/components/auth/LoginForm";

const LoginPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-transparent p-4 md:p-8">
      <div className="w-full max-w-[480px]">
        <LoginForm showTitle={true} />
      </div>
    </div>
  );
};

export default LoginPage;

import RegisterForm from "@/components/auth/register-form";
import { ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-3xl">
          <ShieldAlert className="w-8 h-8" />
          <span>MedBridge</span>
        </div>
        
        <RegisterForm />
      </div>
    </main>
  );
}

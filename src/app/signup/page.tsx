import { Rocket } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      icon={Rocket}
      title="Create your workspace"
      description="Set up your business and start managing clients, leads, and tasks in one place."
    >
      <SignupForm />
    </AuthShell>
  );
}

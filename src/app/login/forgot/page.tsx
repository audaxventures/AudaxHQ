import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasscodeForm } from "@/components/ForgotPasscodeForm";

export default function ForgotPasscodePage() {
  return (
    <AuthShell
      icon={Mail}
      title="Forgot your password?"
      description="Enter the email on your profile and we'll send you a link to set a new password."
    >
      <ForgotPasscodeForm />
    </AuthShell>
  );
}

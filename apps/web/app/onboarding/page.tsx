import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to ReceptionAI</h1>
          <p className="text-muted-foreground mt-2">
            Let&apos;s set up your business profile so your AI can start answering calls
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}

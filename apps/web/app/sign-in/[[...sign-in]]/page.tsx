import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ReceptionAI</h1>
          <p className="text-slate-400 mt-2">Sign in to your dashboard</p>
        </div>
        <SignIn appearance={{
          elements: {
            card: "bg-white shadow-xl rounded-2xl",
            headerTitle: "text-slate-900",
            headerSubtitle: "text-slate-500",
            formFieldLabel: "text-slate-700",
            formFieldInput: "border-slate-200 focus:border-primary focus:ring-primary",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/80",
          }
        }} />
      </div>
    </div>
  );
}

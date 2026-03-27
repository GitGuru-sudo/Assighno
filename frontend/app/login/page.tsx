import { LoginCard } from '@/components/auth/LoginCard';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.58),transparent_55%)]" />
      <div className="absolute left-[-6rem] top-20 -z-10 h-64 w-64 rounded-full bg-coral/10 blur-3xl" />
      <div className="absolute bottom-10 right-[-4rem] -z-10 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />
      <LoginCard />
    </main>
  );
}

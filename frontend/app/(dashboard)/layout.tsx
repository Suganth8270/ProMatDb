import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGate from "@/components/auth/AuthGate";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate><DashboardLayout>{children}</DashboardLayout></AuthGate>;
}


import { AppShell } from "@/components/layout/app-shell";
import { I18nProvider } from "@/lib/i18n";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <AppShell>{children}</AppShell>
    </I18nProvider>
  );
}

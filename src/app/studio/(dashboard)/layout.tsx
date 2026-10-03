import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { UserMenu } from "@/components/studio/user-menu";
import { requireWorkspace } from "@/server/session";

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const { user, workspace } = await requireWorkspace();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/studio" aria-label="Studio home"><Logo /></Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate text-sm font-medium">{workspace.name}</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
}

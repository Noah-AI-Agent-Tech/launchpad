import { NoahLogo } from "@/components/icons/noah-logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-primary/10">
      <div className="mx-auto flex w-full flex-col items-center gap-3 px-4 py-8 sm:flex-row sm:justify-between lg:px-6 xl:max-w-7xl">
        <NoahLogo className="h-6" />
        <p className="text-xs text-primary/40">
          © {new Date().getFullYear()} {site.legalName}. Demo build — all tokens, prices and trades are dummy data.
        </p>
      </div>
    </footer>
  );
}

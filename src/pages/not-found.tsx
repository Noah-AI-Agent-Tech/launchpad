import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { ArrowLeft, RotateCw } from "lucide-react";
import heroBg from "@/assets/hero-bg-top.webp";
import { NoahLogo } from "@/components/icons/noah-logo";
import { Button } from "@/components/ui/button";

/** Any URL the app doesn't know. Rendered inside the normal layout. */
export function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-20">
      <Lost
        code="404"
        title="This page drifted off"
        description="The link may be broken, or the page may have moved. Let's get you back on course."
      >
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to Launchpad
          </Link>
        </Button>
      </Lost>
    </main>
  );
}

/**
 * The router's last resort: an unknown URL outside the layout, or a crash
 * while rendering. Stands alone, since the layout itself may be what failed.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  if (import.meta.env.DEV && !missing) console.error(error);

  return (
    <div className="relative flex min-h-svh flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
        <img src={heroBg} alt="" className="size-full object-cover object-[50%_30%]" draggable={false} />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/45 via-55% to-background" />
      </div>
      <header className="px-4 py-5 lg:px-6">
        <Link to="/" aria-label="Home">
          <NoahLogo className="h-6" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-20">
        {missing ? (
          <Lost
            code="404"
            title="This page drifted off"
            description="The link may be broken, or the page may have moved. Let's get you back on course."
          >
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="size-4" /> Back to Launchpad
              </Link>
            </Button>
          </Lost>
        ) : (
          <Lost
            code="Oops"
            title="Something went wrong"
            description="This page hit an unexpected error. Reloading usually fixes it — if not, head back home."
          >
            <Button onClick={() => window.location.reload()}>
              <RotateCw className="size-4" /> Reload
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="size-4" /> Back to Launchpad
              </Link>
            </Button>
          </Lost>
        )}
      </main>
    </div>
  );
}

function Lost({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <p className="bg-linear-to-b from-white to-white/20 bg-clip-text font-mono text-[96px] leading-none font-semibold tracking-tighter text-transparent sm:text-[128px]">
        {code}
      </p>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

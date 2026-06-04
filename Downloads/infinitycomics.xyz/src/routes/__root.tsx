import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { SiteNav } from "@/components/SiteNav";
import { SplashSequence } from "@/components/SplashSequence";
import { GlobalTheme } from "@/components/GlobalTheme";
// Medusa help modal moved to Profile/Settings
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { SealRow } from "@/components/SealRow";
import { SignupNudge } from "@/components/SignupNudge";
import { ComicsCardsPopup } from "@/components/ComicsCardsPopup";
import { DonationPrompt } from "@/components/DonationPrompt";
import { firePulse } from "@/lib/pulse";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-display text-gold glow-gold">404</div>
        <p className="mt-4 text-muted-foreground tracking-widest uppercase text-xs">The glyph was not found</p>
        <Link to="/" className="mt-8 inline-block border border-gold/60 text-gold px-6 py-3 tracking-[0.3em] text-xs uppercase hover:bg-gold hover:text-primary-foreground transition-colors">
          Return to the Mythos
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-display text-gold">The path collapsed.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 border border-gold/60 text-gold px-6 py-3 tracking-[0.3em] text-xs uppercase hover:bg-gold hover:text-primary-foreground transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mr. Infinity — Dark Mythos of Exodia Holdings" },
      { name: "description", content: "A dark fantasy mythos. Forge your character from the periodic table. Read the origin codex. Collect the relics." },
      { property: "og:title", content: "Mr. Infinity — Dark Mythos of Exodia Holdings" },
      { property: "og:description", content: "A dark fantasy mythos. Forge your character from the periodic table. Read the origin codex. Collect the relics." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Mr. Infinity — Dark Mythos of Exodia Holdings" },
      { name: "twitter:description", content: "A dark fantasy mythos. Forge your character from the periodic table. Read the origin codex. Collect the relics." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5a64acb9-f852-4cd0-a739-e1afa1032074" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5a64acb9-f852-4cd0-a739-e1afa1032074" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isImmersiveRoute = pathname === "/world";
  const isHomePage = pathname === "/";
  // Every route change fires a ritual pulse → cubes spin fast + a gong sounds.
  useEffect(() => { firePulse("gong"); }, [pathname]);
  return (
    <QueryClientProvider client={queryClient}>
      {!isImmersiveRoute && !isHomePage && <SplashSequence />}
      {!isImmersiveRoute && <SiteNav />}
      {!isImmersiveRoute && <AnnouncementBanner />}
      <GlobalTheme enabled={!isImmersiveRoute} />
      
      {/* Medusa modal moved to Profile & Settings (mount there when needed) */}
      {!isImmersiveRoute && !isHomePage && <SignupNudge />}
      {!isImmersiveRoute && <ComicsCardsPopup />}
      {!isImmersiveRoute && <DonationPrompt />}
      <main className={isImmersiveRoute ? "" : "pt-14"}>
        <Outlet />
      </main>
      {!isImmersiveRoute && (
        <footer className="mt-32 border-t border-gold/20">
          <div className="max-w-7xl mx-auto px-6 py-10 text-center">
            <div className="relative inline-block w-24 h-24">
              <span
                className="infinity-8 infinity-8-gold absolute inset-0 flex items-center justify-center font-display text-6xl"
                style={{
                  background: "linear-gradient(90deg,#d4af37,#8b5cf6,#ef4444,#f97316,#d4af37)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >∞</span>
              <span className="infinity-8 infinity-8-shadow absolute inset-0 flex items-center justify-center font-display text-6xl text-black/70">∞</span>
            </div>
            <p className="mt-3 font-display tracking-[0.3em] uppercase text-gold text-sm">Captain Infinity</p>
            <p className="font-serif italic text-[0.7rem] tracking-[0.3em] text-gold/70">and the Infinity Eights</p>
            <div className="mt-6 mb-4">
              <SealRow size={40} gap={18} showLabels />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 justify-center text-[0.6rem] tracking-[0.3em] uppercase">
              <Link to="/about" className="text-muted-foreground hover:text-gold">About</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-gold">Contact</Link>
              <Link to="/careers" className="text-muted-foreground hover:text-gold">Careers</Link>
            </div>
            <p className="mt-5 text-[0.65rem] tracking-[0.35em] uppercase text-muted-foreground">
              Exodia Holdings LLC · Hall Family Legacy · State of Alabama · Est. 1984
            </p>
            <p className="mt-2 text-[0.6rem] tracking-[0.3em] uppercase text-gold/60 font-serif italic">
              For Khadijah — and for my brothers.
            </p>
            <p className="mt-3 text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground/70">
              © 2026 Domenick A. Hall · Exodia Holdings LLC · All characters, names, powers, art, and lore protected.
            </p>
          </div>
        </footer>
      )}
    </QueryClientProvider>
  );
}

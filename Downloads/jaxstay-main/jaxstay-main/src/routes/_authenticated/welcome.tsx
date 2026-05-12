import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { Dog, Calendar, MessageSquare, Briefcase, GraduationCap, Settings as SettingsIcon, ArrowRight, SkipForward } from "lucide-react";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({ meta: [{ title: "Welcome to JaxStay" }] }),
  component: Welcome,
});

const TOUR_KEY = "jaxstay_tour_seen";

const stops = [
  { icon: Dog, title: "Your profile & pets", desc: "Add a photo, your city, and details about each dog so sitters know what to expect.", to: "/dashboard" as const },
  { icon: Briefcase, title: "Become a sitter", desc: "Want to host? Pass the qualification test and your listing goes live.", to: "/sitter-test" as const },
  { icon: Calendar, title: "Bookings", desc: "Send and manage stay requests in one place.", to: "/bookings" as const },
  { icon: MessageSquare, title: "Messages", desc: "Chat with sitters and pet owners directly.", to: "/messages" as const },
  { icon: SettingsIcon, title: "Settings", desc: "Update notifications, privacy, and account preferences anytime.", to: "/settings" as const },
];

function Welcome() {
  const nav = useNavigate();

  useEffect(() => {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
  }, []);

  const finish = () => nav({ to: "/dashboard" });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-600 text-accent">Welcome to JaxStay 🐾</span>
          <h1 className="mt-4 font-display text-4xl font-700 sm:text-5xl">A quick tour of your account</h1>
          <p className="mt-3 text-foreground/70">Here's where to find everything. You can skip this and come back anytime.</p>
        </div>

        <ul className="mt-10 space-y-3">
          {stops.map(({ icon: Icon, title, desc, to }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-display text-lg font-600">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={finish}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-600 hover:bg-muted"
          >
            <SkipForward className="h-4 w-4" /> Skip the tour
          </button>
          <button
            onClick={finish}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-600 text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Go to my dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </SiteLayout>
  );
}

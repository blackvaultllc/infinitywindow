import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Black Holidays Calendar & Juneteenth Reminders | Juneteenth.Love" },
      {
        name: "description",
        content:
          "Calendar of Black holidays and cultural observances — Juneteenth, MLK Day, Black History Month, Kwanzaa, Malcolm X Day, and more. Subscribe to get a Juneteenth reminder 30 days before.",
      },
      {
        name: "keywords",
        content:
          "Black holidays calendar, Juneteenth reminder, Kwanzaa, MLK Day, Black History Month, Malcolm X Day, African American holidays",
      },
      { property: "og:title", content: "Black Holidays Calendar — Juneteenth.Love" },
      {
        property: "og:description",
        content:
          "Every Black holiday in one calendar. Get a reminder 30 days before Juneteenth.",
      },
      { property: "og:url", content: "/calendar" },
    ],
    links: [{ rel: "canonical", href: "/calendar" }],
  }),
  component: CalendarPage,
});

type Holiday = {
  date: string; // MM-DD or range "MM-DD..MM-DD"
  name: string;
  description: string;
};

const HOLIDAYS: Holiday[] = [
  { date: "01-15", name: "Martin Luther King Jr. Day (observed 3rd Mon)", description: "Honoring Dr. King's legacy of nonviolent resistance and civil rights." },
  { date: "02-01..02-28", name: "Black History Month", description: "A full month dedicated to the contributions and history of Black Americans." },
  { date: "02-21", name: "Malcolm X's Assassination (1965)", description: "Day of remembrance for the civil-rights leader." },
  { date: "03-25", name: "International Day of Remembrance — Victims of Slavery", description: "United Nations day honoring the millions lost in the transatlantic slave trade." },
  { date: "04-04", name: "MLK Assassination Day (1968)", description: "Remembrance of Dr. King's death in Memphis." },
  { date: "05-19", name: "Malcolm X Day", description: "Celebrating the birth of El-Hajj Malik El-Shabazz." },
  { date: "05-25", name: "African Liberation Day", description: "Pan-African day of solidarity, since 1958." },
  { date: "06-19", name: "Juneteenth — Freedom Day", description: "Federal holiday marking the end of slavery in the United States (1865)." },
  { date: "07-02", name: "Civil Rights Act Signed (1964)", description: "Outlawed discrimination based on race, color, religion, sex, or national origin." },
  { date: "08-17", name: "Marcus Garvey's Birthday (1887)", description: "Pan-African leader and founder of the UNIA." },
  { date: "08-28", name: "March on Washington (1963)", description: "Dr. King's 'I Have a Dream' speech." },
  { date: "09-15", name: "Birmingham Church Bombing (1963)", description: "Four girls killed at 16th Street Baptist Church." },
  { date: "10-16", name: "Million Man March Anniversary (1995)", description: "Historic Black men's gathering in Washington, D.C." },
  { date: "11-01", name: "National Native American Heritage Month (solidarity)", description: "Solidarity across cultures." },
  { date: "12-01", name: "Rosa Parks Day", description: "1955 Montgomery Bus Boycott begins." },
  { date: "12-26..01-01", name: "Kwanzaa", description: "Seven-day celebration of African heritage and the Nguzo Saba (Seven Principles)." },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function CalendarPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const m: Record<string, Holiday[]> = {};
    for (const h of HOLIDAYS) {
      const mm = h.date.slice(0, 2);
      m[mm] ??= [];
      m[mm].push(h);
    }
    return m;
  }, []);

  const daysToJuneteenth = useMemo(() => {
    const now = new Date();
    const y = now.getMonth() > 5 || (now.getMonth() === 5 && now.getDate() > 19)
      ? now.getFullYear() + 1
      : now.getFullYear();
    const j = new Date(y, 5, 19);
    return Math.max(0, Math.ceil((j.getTime() - now.getTime()) / 86400000));
  }, []);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("juneteenth_subscribers").insert({
      email: email.trim().toLowerCase().slice(0, 320),
      name: name.trim().slice(0, 120) || null,
      user_id: session.session?.user.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You're already subscribed." : error.message);
      return;
    }
    toast.success("Reminder set. We'll holler 30 days before Juneteenth.");
    setEmail("");
    setName("");
  };

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-b border-border">
        <div className="max-w-3xl mx-auto text-center">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
            Calendar
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-medium mb-6 leading-tight text-balance">
            Black holidays, <span className="italic text-gold">all year long.</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
            Mark every date that matters. Juneteenth is{" "}
            <span className="text-gold font-medium">{daysToJuneteenth}</span> days away.
          </p>

          <form onSubmit={subscribe} className="bg-card/40 border border-border rounded-sm p-5 sm:p-6 max-w-xl mx-auto text-left space-y-3">
            <h2 className="font-serif text-xl text-gold text-center mb-1">
              Juneteenth Reminder
            </h2>
            <p className="text-xs text-muted-foreground text-center mb-3">
              We'll email you 30 days before Juneteenth so it never sneaks up.
            </p>
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
            />
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold text-primary-foreground px-6 py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Remind Me"}
            </button>
          </form>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl mb-10 text-center text-balance">
            Holiday & remembrance dates
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {MONTHS.map((m, i) => {
              const mm = String(i + 1).padStart(2, "0");
              const items = grouped[mm];
              if (!items) return null;
              return (
                <div key={mm} className="border border-border/60 rounded-sm p-5 bg-card/30">
                  <h3 className="text-gold text-xs uppercase tracking-[0.32em] mb-4">{m}</h3>
                  <ul className="space-y-4">
                    {items.map((h) => (
                      <li key={h.name}>
                        <p className="font-serif text-base leading-snug">{h.name}</p>
                        <p className="text-xs text-foreground/40 mt-0.5 mb-1">
                          {h.date.replace("..", " → ")}
                        </p>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          {h.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

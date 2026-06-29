import { useState } from "react";
import { X } from "lucide-react";

const PATENT_URL = "https://patents.google.com/patent/US20100271394A1/en";

const PILLS = [
  "Viewer Position Detection (Claim 1)",
  "OLED Display Integration (Claim 9)",
  "Modular Cartridge System (Claim 6)",
  "Solar Panel Integration (Claim 7)",
  "Panoramic Imaging System (Claim 8)",
];

export function PatentDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Patent References"
        aria-label="Patent References"
        className="glow-gold fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-xl font-bold text-[#0a0a12] transition hover:scale-105"
      >
        §
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-gold/30 bg-card p-6 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gold">Technology References</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Infinity Window is built on concepts originally described in:
          </p>

          <div className="mt-4 rounded-xl border border-gold/20 bg-[#0e0e18] p-5">
            <p className="text-sm font-semibold text-violet">US Patent US20100271394A1</p>
            <p className="mt-2 text-base font-medium leading-snug text-foreground">
              "System and Method for Merging Virtual Reality and Reality to
              Provide an Enhanced Sensory Experience"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Inventor: Terrence Dashon Howard · Filed April 22, 2010
            </p>
            <a
              href={PATENT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#0a0a12] hover:bg-gold/90"
            >
              View Patent →
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 pb-2">
            {PILLS.map((p) => (
              <a
                key={p}
                href={PATENT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-gold/50 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/10"
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

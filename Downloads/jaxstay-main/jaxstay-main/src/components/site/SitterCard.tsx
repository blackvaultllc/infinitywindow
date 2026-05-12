import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Sitter } from "@/data/sitters";

export function SitterCard({ sitter }: { sitter: Sitter }) {
  return (
    <Link
      to="/sitters/$sitterId"
      params={{ sitterId: sitter.id }}
      className="group block overflow-hidden rounded-3xl bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={sitter.image}
          alt={sitter.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-600 text-foreground backdrop-blur">
          ${sitter.rate}<span className="text-muted-foreground"> / night</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-600 text-foreground">{sitter.name}</h3>
            <p className="text-sm text-muted-foreground">{sitter.city}</p>
          </div>
          <div className="flex items-center gap-1 text-sm font-600">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {sitter.rating}
            <span className="text-muted-foreground font-400">({sitter.reviews})</span>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-foreground/75">{sitter.bio}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sitter.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-500 text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

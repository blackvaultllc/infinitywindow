import { Link } from "@tanstack/react-router";
import { Logo, PawIcon } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-gradient-forest text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">
              The trusted marketplace where loving sitters meet happy dogs. Built with tail-wags
              in mind, ever since Jax taught us what good company really means.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg">For Owners</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/sitters">Find a Sitter</Link></li>
              <li><Link to="/how-it-works">How it Works</Link></li>
              <li><Link to="/about">Trust & Safety</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg">For Sitters</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/become-a-sitter">Become a Sitter</Link></li>
              <li><Link to="/how-it-works">Earnings</Link></li>
              <li><Link to="/login">Sitter Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} JaxStay. Made with <PawIcon className="inline h-4 w-4 text-accent" /> for Jax.</p>
          <div className="flex gap-6">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/jaxstay-promise">JaxStay Promise</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

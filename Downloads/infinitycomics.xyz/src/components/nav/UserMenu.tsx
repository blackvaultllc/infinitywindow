import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Settings as Cog, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

/**
 * Compact identity menu. The trigger NEVER exposes the user's email — it shows
 * the nickname's first letter (or display name's, or a generic glyph as a last
 * resort). The dropdown label shows the nickname only.
 */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isOwner, isAdmin } = useRole();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) { setNickname(null); setAvatarUrl(null); return; }
      const { data } = await supabase
        .from("profiles")
        .select("nickname, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const d = data as { nickname: string | null; display_name: string | null; avatar_url: string | null };
      setNickname(d.nickname || d.display_name || null);
      setAvatarUrl(d.avatar_url);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handle = nickname ?? "Traveler";
  const initial = handle.trim().charAt(0).toUpperCase() || "∞";

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="grid place-items-center h-9 w-9 rounded-full border border-gold/50 text-gold hover:bg-gold hover:text-primary-foreground transition-colors text-[0.7rem] font-display tracking-widest overflow-hidden bg-background/40"
        >
          {user ? (
            avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )
          ) : (
            <Cog className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-gold/40 bg-background/95 backdrop-blur-md"
      >
        {user ? (
          <>
            <DropdownMenuLabel className="text-[0.6rem] tracking-[0.3em] uppercase text-gold/70 truncate">
              {handle}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gold/20" />
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/command"
                  className="text-[0.65rem] tracking-[0.25em] uppercase text-gold cursor-pointer"
                >
                  <Cog className="mr-2 h-3 w-3" />
                  {isOwner ? "Command Center" : "Admin"}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                to="/profile"
                className="text-[0.65rem] tracking-[0.25em] uppercase cursor-pointer"
              >
                <UserIcon className="mr-2 h-3 w-3" />
                Profile &amp; Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/profile#medusa-help"
                className="text-[0.65rem] tracking-[0.25em] uppercase cursor-pointer"
              >
                <Cog className="mr-2 h-3 w-3" />
                Help &amp; Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gold/20" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-[0.65rem] tracking-[0.25em] uppercase cursor-pointer"
            >
              <LogOut className="mr-2 h-3 w-3" />
              Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              to="/login"
              className="text-[0.65rem] tracking-[0.25em] uppercase text-gold cursor-pointer"
            >
              <LogIn className="mr-2 h-3 w-3" />
              Sign In
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

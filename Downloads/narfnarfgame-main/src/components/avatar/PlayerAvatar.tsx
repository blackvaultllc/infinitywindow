import { cn } from "@/lib/utils";

export type AvatarConfig = {
  role?: string | null;
  gender?: string | null;
  skin?: string | null;
  uniform?: string | null;
  flag?: string | null;
  accent?: string | null;
  hairStyle?: string | null;
  hairColor?: string | null;
  shirtColor?: string | null;
  pantsColor?: string | null;
  face?: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  diplomat: "🕊",
  commander: "⚔",
  scientist: "⚛",
  engineer: "⚙",
};

const UNIFORM_COLORS: Record<string, { shirt: string; pants: string }> = {
  standard: { shirt: "#334155", pants: "#1e293b" },
  tactical: { shirt: "#1f2937", pants: "#0b0f17" },
  dress: { shirt: "#0f172a", pants: "#0a0f1c" },
  lab: { shirt: "#e2e8f0", pants: "#475569" },
};

/**
 * Roblox-style blocky avatar — full body, customizable.
 * Pure SVG, no external assets, instant render.
 */
export function PlayerAvatar({
  config,
  size = 64,
  className,
  showBadge = true,
}: {
  config: AvatarConfig;
  size?: number;
  className?: string;
  showBadge?: boolean;
}) {
  const skin = config.skin || "#d8b48a";
  const accent = config.accent || "#38bdf8";
  const uniform = config.uniform || "standard";
  const role = (config.role || "").toLowerCase();
  const gender = config.gender || "neutral";
  const hairStyle = config.hairStyle || (gender === "feminine" ? "long" : "short");
  const hairColor = config.hairColor || "#1a1a1a";
  const face = config.face || "smile";

  const fallback = UNIFORM_COLORS[uniform] || UNIFORM_COLORS.standard;
  const shirt = config.shirtColor || fallback.shirt;
  const pants = config.pantsColor || fallback.pants;

  // Slightly darker skin for shading
  const skinShade = shadeColor(skin, -12);
  const shirtShade = shadeColor(shirt, -15);
  const pantsShade = shadeColor(pants, -15);
  const hairShade = shadeColor(hairColor, -20);

  const a = accent;
  const gradId = `acc-${a.replace("#", "")}`;

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={a} stopOpacity="0.35" />
            <stop offset="100%" stopColor={a} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* glow backdrop */}
        <circle cx="32" cy="34" r="32" fill={`url(#${gradId})`} />

        {/* ground shadow */}
        <ellipse cx="32" cy="60" rx="13" ry="2" fill="#000" opacity="0.35" />

        {/* ===== LEGS (blocky) ===== */}
        <rect x="23" y="48" width="7" height="12" fill={pants} />
        <rect x="23" y="48" width="7" height="2" fill={pantsShade} />
        <rect x="34" y="48" width="7" height="12" fill={pants} />
        <rect x="34" y="48" width="7" height="2" fill={pantsShade} />
        {/* shoes */}
        <rect x="22" y="58" width="9" height="3" fill="#0f172a" />
        <rect x="33" y="58" width="9" height="3" fill="#0f172a" />

        {/* ===== TORSO ===== */}
        <rect x="20" y="34" width="24" height="15" fill={shirt} />
        <rect x="20" y="34" width="24" height="2" fill={shirtShade} />
        {/* accent stripe / collar */}
        <rect x="20" y="34" width="24" height="2" fill={a} opacity="0.9" />
        <rect x="30" y="36" width="4" height="13" fill={a} opacity="0.25" />

        {/* ===== ARMS ===== */}
        <rect x="14" y="34" width="6" height="13" fill={shirt} />
        <rect x="14" y="34" width="6" height="2" fill={shirtShade} />
        <rect x="44" y="34" width="6" height="13" fill={shirt} />
        <rect x="44" y="34" width="6" height="2" fill={shirtShade} />
        {/* hands */}
        <rect x="14" y="47" width="6" height="4" fill={skin} />
        <rect x="44" y="47" width="6" height="4" fill={skin} />

        {/* ===== HEAD (blocky cube) ===== */}
        <rect x="20" y="14" width="24" height="20" fill={skin} />
        {/* head shading */}
        <rect x="20" y="14" width="24" height="2" fill={skinShade} opacity="0.6" />
        <rect x="42" y="14" width="2" height="20" fill={skinShade} opacity="0.5" />

        {/* ===== HAIR ===== */}
        {renderHair(hairStyle, hairColor, hairShade)}

        {/* ===== FACE ===== */}
        {/* eyes */}
        <rect x="25" y="22" width="3" height="4" fill="#0f172a" />
        <rect x="36" y="22" width="3" height="4" fill="#0f172a" />
        <rect x="25" y="22" width="1" height="1" fill="#fff" />
        <rect x="36" y="22" width="1" height="1" fill="#fff" />
        {/* mouth */}
        {face === "smile" ? (
          <path d="M27 29 Q 32 32 37 29" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : face === "smirk" ? (
          <path d="M27 30 Q 32 31 37 28" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : face === "serious" ? (
          <line x1="27" y1="30" x2="37" y2="30" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        ) : (
          <rect x="29" y="29" width="6" height="2" fill="#0f172a" />
        )}
      </svg>

      {showBadge && role && ROLE_BADGE[role] && (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border text-[10px]"
          style={{
            width: Math.max(16, size * 0.32),
            height: Math.max(16, size * 0.32),
            background: accent,
            color: "#0f172a",
            borderColor: "#0f172a",
          }}
          title={role}
        >
          {ROLE_BADGE[role]}
        </span>
      )}
    </div>
  );
}

function renderHair(style: string, color: string, shade: string) {
  switch (style) {
    case "bald":
      return null;
    case "buzz":
      return (
        <>
          <rect x="20" y="14" width="24" height="3" fill={color} />
        </>
      );
    case "long":
      return (
        <>
          <rect x="18" y="12" width="28" height="8" fill={color} />
          <rect x="18" y="20" width="3" height="22" fill={color} />
          <rect x="43" y="20" width="3" height="22" fill={color} />
          <rect x="18" y="12" width="28" height="2" fill={shade} />
        </>
      );
    case "ponytail":
      return (
        <>
          <rect x="19" y="13" width="26" height="6" fill={color} />
          <rect x="42" y="17" width="6" height="14" fill={color} />
          <rect x="19" y="13" width="26" height="2" fill={shade} />
        </>
      );
    case "afro":
      return (
        <>
          <circle cx="32" cy="14" r="12" fill={color} />
          <circle cx="22" cy="18" r="6" fill={color} />
          <circle cx="42" cy="18" r="6" fill={color} />
        </>
      );
    case "mohawk":
      return (
        <>
          <rect x="30" y="9" width="4" height="9" fill={color} />
          <rect x="28" y="11" width="8" height="3" fill={color} />
        </>
      );
    case "cap":
      return (
        <>
          <rect x="19" y="12" width="26" height="6" fill={color} />
          <rect x="42" y="14" width="8" height="4" fill={color} />
          <rect x="19" y="12" width="26" height="2" fill={shade} />
        </>
      );
    case "short":
    default:
      return (
        <>
          <rect x="19" y="12" width="26" height="6" fill={color} />
          <rect x="19" y="18" width="4" height="3" fill={color} />
          <rect x="41" y="18" width="4" height="3" fill={color} />
          <rect x="19" y="12" width="26" height="2" fill={shade} />
        </>
      );
  }
}

function shadeColor(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0xff) + Math.round((percent / 100) * 255);
  let b = (num & 0xff) + Math.round((percent / 100) * 255);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

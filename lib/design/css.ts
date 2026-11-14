import { TOKENS } from "./tokens";

/** "#6B2A8C" → "280 54% 36%" (shadcn's space-separated HSL). */
export function hexToHsl(hex: string): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(s * 1000) / 10}% ${Math.round(l * 1000) / 10}%`;
}

type Mode = keyof typeof TOKENS;

/** CSS custom properties for one theme, in the names globals.css uses. */
export function themeVariables(mode: Mode): Record<string, string> {
  const t = TOKENS[mode];
  const vars: Record<string, string> = {
    "--background": t.background,
    "--foreground": t.foreground,
    "--card": t.card,
    "--card-foreground": t.foreground,
    "--popover": t.card,
    "--popover-foreground": t.foreground,
    "--primary": t.primary,
    "--primary-foreground": t.primaryForeground,
    "--secondary": t.muted,
    "--secondary-foreground": t.foreground,
    "--muted": t.muted,
    "--muted-foreground": t.mutedForeground,
    "--accent": t.accent,
    "--accent-foreground": t.foreground,
    "--destructive": t.destructive,
    "--destructive-foreground": t.destructiveForeground,
    "--border": t.border,
    "--input": t.border,
    "--ring": t.primary,
    "--brand-magenta": t.magenta,
    "--brand-orange": t.orange,
    "--brand-yellow": t.yellow,
    "--sidebar-from": t.sidebarFrom,
    "--sidebar-to": t.sidebarTo,
    "--sidebar-foreground": t.sidebarForeground,
  };
  for (const [tone, { fg, bg }] of Object.entries(t.badges)) {
    vars[`--badge-${tone}`] = fg;
    vars[`--badge-${tone}-bg`] = bg;
  }
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, hexToHsl(v)]));
}

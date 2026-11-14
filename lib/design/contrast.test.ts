import { describe, it, expect } from "vitest";
import { contrastRatio } from "./contrast";
import { TOKENS } from "./tokens";

describe("contrastRatio", () => {
  it("matches known values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe.each(["light", "dark"] as const)("%s theme meets WCAG AA (4.5:1)", (mode) => {
  const t = TOKENS[mode];
  it.each([
    ["foreground on background", t.foreground, t.background],
    ["foreground on card", t.foreground, t.card],
    ["muted text on card", t.mutedForeground, t.card],
    ["muted text on background", t.mutedForeground, t.background],
    ["primary text on primary", t.primaryForeground, t.primary],
    ["primary as text on card", t.primary, t.card],
    ["sidebar text on sidebar", t.sidebarForeground, t.sidebarFrom],
    ["sidebar text on sidebar end", t.sidebarForeground, t.sidebarTo],
    ["destructive text on destructive", t.destructiveForeground, t.destructive],
  ])("%s", (_name, fg, bg) => expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5));

  it.each(Object.entries(t.badges))("%s badge text on its tint", (_tone, { fg, bg }) =>
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5),
  );
});

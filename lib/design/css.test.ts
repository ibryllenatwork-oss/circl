import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { hexToHsl, themeVariables } from "./css";

it("converts hex to shadcn HSL", () => {
  expect(hexToHsl("#FFFFFF")).toBe("0 0% 100%");
  expect(hexToHsl("#000000")).toBe("0 0% 0%");
  expect(hexToHsl("#FF0000")).toBe("0 100% 50%");
});

describe("app/globals.css mirrors lib/design/tokens.ts", () => {
  const css = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
  const block = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    return css.slice(start, css.indexOf("}", start));
  };
  it.each([
    [":root", "light"],
    [".dark", "dark"],
  ] as const)("%s has every %s token", (selector, mode) => {
    const text = block(selector);
    for (const [name, value] of Object.entries(themeVariables(mode))) {
      expect(text, `${selector} ${name}`).toContain(`${name}: ${value};`);
    }
  });
});

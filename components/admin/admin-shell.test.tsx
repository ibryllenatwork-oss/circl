import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement, ReactNode } from "react";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const requireManager = vi.fn();
let cookieValue: string | undefined;

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }),
}));
vi.mock("@/lib/auth/require-manager", () => ({ requireManager: () => requireManager() }));
vi.mock("./app-sidebar", () => ({ AppSidebar: () => null }));
vi.mock("./admin-header", () => ({ AdminHeader: () => null }));

import { AdminShell } from "./admin-shell";
import { AppSidebar } from "./app-sidebar";
import { AdminHeader } from "./admin-header";

type El = ReactElement<Record<string, unknown> & { children?: ReactNode }>;

/** Depth-first search of a React element tree. */
function find(node: unknown, pred: (el: El) => boolean): El | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = find(n, pred);
      if (hit) return hit;
    }
    return undefined;
  }
  const el = node as El;
  if (pred(el)) return el;
  return find(el.props?.children, pred);
}

describe("AdminShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieValue = undefined;
  });

  it("redirects to login when the account no longer exists or the session is invalid", async () => {
    requireManager.mockResolvedValue(null);
    await expect(AdminShell({ children: "secret" })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it.each([true, false])("passes isSuperadmin=%s to the sidebar and header, and renders the page", async (flag) => {
    requireManager.mockResolvedValue({ id: "u1", email: "a@circl.ph", isSuperadmin: flag });
    const tree = await AdminShell({ children: "secret" });
    expect(find(tree, (el) => el.type === AppSidebar)?.props.isSuperadmin).toBe(flag);
    expect(find(tree, (el) => el.type === AdminHeader)?.props).toMatchObject({
      email: "a@circl.ph",
      role: flag ? "Superadmin" : "Manager",
    });
    expect(find(tree, (el) => el.type === "main")?.props.children).toBe("secret");
  });

  it("remembers a collapsed sidebar from the cookie", async () => {
    requireManager.mockResolvedValue({ id: "u1", email: "a@circl.ph", isSuperadmin: true });
    cookieValue = "collapsed";
    const tree = await AdminShell({ children: null });
    expect(find(tree, (el) => el.type === AppSidebar)?.props.initialCollapsed).toBe(true);
  });
});

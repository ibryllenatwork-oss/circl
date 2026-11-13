import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const requireManager = vi.fn();

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("@/lib/auth/require-manager", () => ({ requireManager: () => requireManager() }));
vi.mock("./sidebar", () => ({ Sidebar: () => null }));

import { AdminShell } from "./admin-shell";
import { Sidebar } from "./sidebar";

type El = ReactElement<{ children?: unknown; isSuperadmin?: boolean }>;
const kids = (el: El) => [el.props.children].flat() as El[];

describe("AdminShell", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to login when the account no longer exists or the session is invalid", async () => {
    requireManager.mockResolvedValue(null);
    await expect(AdminShell({ children: "secret" })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it.each([true, false])("passes isSuperadmin=%s to the sidebar and renders the page", async (flag) => {
    requireManager.mockResolvedValue({ id: "u1", email: "a@circl.ph", isSuperadmin: flag });
    const tree = (await AdminShell({ children: "secret" })) as El;
    const [sidebar, main] = kids(tree);
    expect(sidebar.type).toBe(Sidebar);
    expect(sidebar.props.isSuperadmin).toBe(flag);
    expect(main.props.children).toBe("secret");
  });
});

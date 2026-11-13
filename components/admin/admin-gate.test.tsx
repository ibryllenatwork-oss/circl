import { describe, it, expect, vi, beforeEach } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const requireManager = vi.fn();

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("@/lib/auth/require-manager", () => ({ requireManager: () => requireManager() }));

import { AdminGate } from "./admin-gate";

describe("AdminGate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to login when the account no longer exists or the session is invalid", async () => {
    requireManager.mockResolvedValue(null);
    await expect(AdminGate({ children: "secret" })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("renders children for a verified manager", async () => {
    requireManager.mockResolvedValue({ id: "u1", email: "a@circl.ph" });
    expect(await AdminGate({ children: "secret" })).toBe("secret");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const requireManager = vi.fn();
const fakeDb = { from: vi.fn() };

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-manager", () => ({ requireManager: () => requireManager() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeDb }));

import { withManager, UnauthorizedError } from "./db";

describe("withManager", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws UnauthorizedError and never runs fn without a manager", async () => {
    requireManager.mockResolvedValue(null);
    const fn = vi.fn();
    await expect(withManager(fn)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(fn).not.toHaveBeenCalled();
  });

  it("passes the admin db and the manager to fn", async () => {
    const me = { id: "u1", email: "a@circl.ph", isSuperadmin: false };
    requireManager.mockResolvedValue(me);
    const result = await withManager(async (db, m) => ({ db, m }));
    expect(result).toEqual({ db: fakeDb, m: me });
  });
});

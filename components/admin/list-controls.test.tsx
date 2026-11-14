import { describe, it, expect, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

vi.mock("next/link", () => ({ default: (p: { children: ReactNode }) => p.children }));

import Link from "next/link";
import { Pagination } from "./list-controls";

type El = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
function findAll(node: unknown, pred: (el: El) => boolean, out: El[] = []): El[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    node.forEach((n) => findAll(n, pred, out));
    return out;
  }
  const el = node as El;
  if (pred(el)) out.push(el);
  findAll(el.props?.children, pred, out);
  return out;
}
const text = (el: El): string =>
  findAll(el, () => true)
    .flatMap((e) => [e.props?.children].flat())
    .filter((c): c is string => typeof c === "string")
    .join("");

describe("Pagination", () => {
  const base = { basePath: "/admin/employees", params: {}, total: 30, pageSize: 25 };

  it("renders disabled Previous/Next as plain text, not links (keyboard can't follow them)", () => {
    const first = Pagination({ ...base, page: 1 });
    const links = findAll(first, (el) => el.type === Link);
    expect(links.map(text)).toEqual(["Next"]);

    const last = Pagination({ ...base, page: 2 });
    expect(findAll(last, (el) => el.type === Link).map(text)).toEqual(["Previous"]);
  });

  it("shows a sensible range past the last page", () => {
    const past = Pagination({ ...base, page: 9 });
    expect(findAll(past, (el) => el.type === "span").map(text)).toContain("Showing 0 of 30");
  });
});

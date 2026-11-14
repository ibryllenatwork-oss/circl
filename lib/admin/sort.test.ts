import { describe, it, expect } from "vitest";
import { parseSort, EMPLOYEE_SORT, CLIENT_SORT } from "./sort";

describe("parseSort (employees)", () => {
  it("defaults to newest hire first with a stable tiebreaker", () => {
    const s = parseSort({}, EMPLOYEE_SORT);
    expect(s).toMatchObject({ key: "hired", dir: "desc" });
    expect(s.order).toEqual([
      { column: "date_hired", ascending: false },
      { column: "seq", ascending: false },
    ]);
  });

  it("sorts by name: last name, first name, then seq", () => {
    const s = parseSort({ sort: "name", dir: "asc" }, EMPLOYEE_SORT);
    expect(s.order).toEqual([
      { column: "last_name", ascending: true },
      { column: "first_name", ascending: true },
      { column: "seq", ascending: true },
    ]);
  });

  it("falls back on unknown keys and directions", () => {
    expect(parseSort({ sort: "salary; drop table", dir: "asc" }, EMPLOYEE_SORT).key).toBe("hired");
    expect(parseSort({ sort: "position", dir: "sideways" }, EMPLOYEE_SORT)).toMatchObject({
      key: "position",
      dir: "asc",
    });
  });

  it("does not duplicate the tiebreaker when sorting by it", () => {
    const s = parseSort({ sort: "no", dir: "desc" }, EMPLOYEE_SORT);
    expect(s.order).toEqual([{ column: "seq", ascending: false }]);
  });
});

describe("parseSort (clients)", () => {
  it("defaults to company A–Z, tiebreak on id", () => {
    expect(parseSort({}, CLIENT_SORT).order).toEqual([
      { column: "company_name", ascending: true },
      { column: "id", ascending: true },
    ]);
  });
  it("supports contract end", () =>
    expect(parseSort({ sort: "contract_end", dir: "desc" }, CLIENT_SORT).order[0]).toEqual({
      column: "contract_end",
      ascending: false,
    }));
});

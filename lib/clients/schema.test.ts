import { describe, it, expect } from "vitest";
import { parseClientForm } from "./schema";

function form(values: Record<string, string>, contacts: unknown = [{ name: "Jo Smith", email: "jo@acme.com" }]) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  fd.set("contacts", JSON.stringify(contacts));
  return fd;
}

const valid = { company_name: "Acme LLC", status: "active", currency: "USD" };

describe("parseClientForm", () => {
  it("accepts a client with one contact and normalizes", () => {
    const r = parseClientForm(
      form({ ...valid, services: "Admin, Email support", rate: "12.5", hours_per_week: "20", billing_email: "Billing@Acme.com" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.client.company_name).toBe("Acme LLC");
      expect(r.data.client.services).toEqual(["Admin", "Email support"]);
      expect(r.data.client.rate).toBe(12.5);
      expect(r.data.client.billing_email).toBe("billing@acme.com");
      expect(r.data.contacts).toEqual([
        { name: "Jo Smith", role: null, email: "jo@acme.com", phone: null, is_primary: false },
      ]);
    }
  });

  it("requires a company name", () => {
    const r = parseClientForm(form({ ...valid, company_name: " " }));
    expect(!r.ok && r.fieldErrors.company_name).toBeTruthy();
  });

  it("requires at least one contact", () => {
    const r = parseClientForm(form(valid, []));
    expect(!r.ok && r.fieldErrors.contacts).toMatch(/at least one/i);
  });

  it("requires each contact to have a name and a valid email", () => {
    const r = parseClientForm(form(valid, [{ name: "" }, { name: "Sam", email: "nope" }]));
    expect(!r.ok && r.fieldErrors.contacts).toBeTruthy();
  });

  it("rejects two primary contacts", () => {
    const r = parseClientForm(form(valid, [{ name: "A", is_primary: true }, { name: "B", is_primary: true }]));
    expect(!r.ok && r.fieldErrors.contacts).toMatch(/one primary/i);
  });

  it("rejects contract end before start", () => {
    const r = parseClientForm(form({ ...valid, contract_start: "2026-01-01", contract_end: "2025-12-31" }));
    expect(!r.ok && r.fieldErrors.contract_end).toBeTruthy();
  });

  it("rejects an unknown currency and malformed contacts JSON", () => {
    expect(parseClientForm(form({ ...valid, currency: "XYZ" })).ok).toBe(false);
    const fd = form(valid);
    fd.set("contacts", "{not json");
    const r = parseClientForm(fd);
    expect(!r.ok && r.fieldErrors.contacts).toBeTruthy();
  });

  it("adds https:// to a bare website", () => {
    const r = parseClientForm(form({ ...valid, website: "acme.com" }));
    expect(r.ok && r.data.client.website).toBe("https://acme.com");
  });
});

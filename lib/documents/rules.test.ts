import { describe, it, expect } from "vitest";
import {
  validateUpload,
  safeFileName,
  storagePath,
  isOwner,
  isDocumentPath,
  isPhotoPath,
  MAX_DOCUMENT_BYTES,
} from "./rules";

const MB = 1024 * 1024;

describe("validateUpload", () => {
  it("accepts a small PDF document", () =>
    expect(validateUpload({ size: 2 * MB, type: "application/pdf" }, "document")).toBeNull());
  it("rejects a document over 10 MB", () =>
    expect(validateUpload({ size: 11 * MB, type: "application/pdf" }, "document")).toMatch(/10 MB/));
  it("rejects a Word file", () =>
    expect(
      validateUpload({ size: MB, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, "document"),
    ).toMatch(/PDF/));
  it("rejects a PDF as a photo and a photo over 5 MB", () => {
    expect(validateUpload({ size: MB, type: "application/pdf" }, "photo")).toMatch(/JPG/);
    expect(validateUpload({ size: 6 * MB, type: "image/jpeg" }, "photo")).toMatch(/5 MB/);
  });
  it("rejects empty files", () => expect(validateUpload({ size: 0, type: "image/png" }, "document")).toMatch(/empty/));
  it("exposes the 10 MB limit", () => expect(MAX_DOCUMENT_BYTES).toBe(10 * MB));
});

describe("safeFileName", () => {
  it.each([
    ["NBI clearance (1).PDF", "nbi-clearance-1.pdf"],
    ["../../etc/passwd", "passwd"],
    ["C:\\Users\\ana\\ID.png", "id.png"],
    ["Résumé – Ana.pdf", "resume-ana.pdf"],
    ["   .pdf", "file.pdf"],
  ])("%s → %s", (input, expected) => expect(safeFileName(input)).toBe(expected));
  it("caps the length", () => expect(safeFileName("a".repeat(300) + ".pdf").length).toBeLessThanOrEqual(84));
});

describe("storagePath", () => {
  const id = "3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f";
  it("puts files under the owner's folder with a unique prefix", () => {
    const a = storagePath("employees", id, "NBI.pdf");
    const b = storagePath("employees", id, "NBI.pdf");
    expect(a).toMatch(new RegExp(`^employees/${id}/[0-9a-f-]{36}-nbi\\.pdf$`));
    expect(a).not.toBe(b);
  });
});

describe("path checks", () => {
  const A = "3f2b8c1e-9d4a-4c7e-8f00-1a2b3c4d5e6f";
  const C = "11111111-2222-4333-8444-555555555555";
  const U = "2b19d6a0-7170-4886-ac42-4b0c86b62309";
  it("accepts the exact document format", () =>
    expect(isDocumentPath("employees", A, `employees/${A}/${U}-nbi-clearance.pdf`)).toBe(true));
  it.each([
    `employees/${A}/../../clients/${C}/${U}-contract.pdf`,
    `employees/${A}/${U}-x.pdf/../../${C}/${U}-y.pdf`,
    `employees/${A}/photo-${U}.png`,
    `employees/${C}/${U}-nbi.pdf`,
    `clients/${A}/${U}-nbi.pdf`,
    `employees/${A}/nested/${U}-a.pdf`,
  ])("rejects %s", (p) => expect(isDocumentPath("employees", A, p)).toBe(false));
  it("accepts only the exact photo format", () => {
    expect(isPhotoPath(A, `employees/${A}/photo-${U}.webp`)).toBe(true);
    expect(isPhotoPath(A, `employees/${A}/photo-${U}.pdf`)).toBe(false);
    expect(isPhotoPath(A, `employees/${A}/photo-x/../../clients/${C}/${U}-a.png`)).toBe(false);
  });
});

it("knows the two owners", () => {
  expect(isOwner("employees")).toBe(true);
  expect(isOwner("clients")).toBe(true);
  expect(isOwner("users")).toBe(false);
});

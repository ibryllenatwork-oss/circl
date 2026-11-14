import type { ExpiryState } from "@/lib/format";

export type Tone = "success" | "pending" | "processing" | "error" | "neutral";

const STATUS_TONES: Record<string, Tone> = {
  active: "success",
  on_leave: "pending",
  prospect: "pending",
  paused: "processing",
  terminated: "error",
  resigned: "neutral",
  ended: "neutral",
};

export const statusTone = (status: string): Tone => STATUS_TONES[status] ?? "neutral";

export const expiryTone = (state: Exclude<ExpiryState, "none">): Tone =>
  state === "expired" ? "error" : state === "soon" ? "pending" : "neutral";

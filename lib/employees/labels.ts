export const EMPLOYMENT_TYPES = ["full_time", "part_time", "project_based"] as const;
export const EMPLOYEE_STATUSES = ["active", "on_leave", "resigned", "terminated"] as const;
export const SEXES = ["male", "female"] as const;
export const CIVIL_STATUSES = ["single", "married", "widowed", "separated", "annulled"] as const;
export const RATE_BASES = ["hourly", "monthly"] as const;
export const EDUCATION_LEVELS = [
  "high_school",
  "vocational",
  "college_undergraduate",
  "bachelors",
  "masters",
  "doctorate",
] as const;
export const EMPLOYEE_DOC_TYPES = [
  "resume",
  "government_id",
  "nbi_clearance",
  "contract",
  "nda",
  "other",
] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  project_based: "Project-based",
  active: "Active",
  on_leave: "On leave",
  resigned: "Resigned",
  terminated: "Terminated",
  male: "Male",
  female: "Female",
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  separated: "Separated",
  annulled: "Annulled",
  hourly: "Hourly",
  monthly: "Monthly",
  high_school: "High school",
  vocational: "Vocational",
  college_undergraduate: "College undergraduate",
  bachelors: "Bachelor's degree",
  masters: "Master's degree",
  doctorate: "Doctorate",
  resume: "Resume",
  government_id: "Government ID",
  nbi_clearance: "NBI clearance",
  contract: "Contract",
  nda: "NDA",
  sow: "Statement of work",
  other: "Other",
  // Clients
  prospect: "Prospect",
  paused: "Paused",
  ended: "Ended",
  weekly: "Weekly",
  biweekly: "Every two weeks",
};

export const label = (value: string | null | undefined) => (value ? (LABELS[value] ?? value) : "—");

export const POSITION_SUGGESTIONS = [
  "General Virtual Assistant",
  "Executive Assistant",
  "Administrative Assistant",
  "Customer Support Representative",
  "Social Media Manager",
  "Bookkeeper",
  "Graphic Designer",
  "Lead Generation Specialist",
];

export const PAYOUT_SUGGESTIONS = ["BDO", "BPI", "Metrobank", "UnionBank", "GCash", "Maya", "Wise", "PayPal"];

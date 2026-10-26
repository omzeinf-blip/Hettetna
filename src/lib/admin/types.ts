export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export type StaffRole = "admin" | "agent";

export type StaffSession = {
  token: string;
  userId: string;
  email?: string;
  role: StaffRole;
  fullName?: string;
};

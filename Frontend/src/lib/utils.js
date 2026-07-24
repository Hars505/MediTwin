import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ══════════════════════════════════════════════════════════════════════
// Date of birth + age helpers
// ══════════════════════════════════════════════════════════════════════

/** Earliest allowed date of birth (year 1900-01-01). */
export const DOB_MIN = "1900-01-01";

/**
 * Latest allowed date of birth: today minus `minAge` years.
 * Defaults to 10 years (children under 10 cannot self-register).
 */
export function dobMax(minAge = 10) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate integer age in years from a "YYYY-MM-DD" string.
 * Returns null if the value is empty or unparseable.
 */
export function calculateAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ══════════════════════════════════════════════════════════════════════
// Field validators — each returns "" when valid, or an error string.
// ══════════════════════════════════════════════════════════════════════

const NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/;
const USERNAME_RE = /^[A-Za-z0-9_]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

export function validateName(v, label = "Name") {
  const s = (v || "").trim();
  if (!s) return `${label} is required.`;
  if (s.length > 50) return `${label} must be 50 characters or fewer.`;
  if (!NAME_RE.test(s)) return `${label} can only contain letters, spaces, hyphens, and apostrophes.`;
  return "";
}

export function validateUsername(v) {
  const s = (v || "").trim();
  if (!s) return "Username is required.";
  if (s.length < 3) return "Username must be at least 3 characters.";
  if (s.length > 30) return "Username must be 30 characters or fewer.";
  if (!USERNAME_RE.test(s)) return "Username can only contain letters, numbers, and underscores.";
  return "";
}

export function validateEmail(v) {
  const s = (v || "").trim();
  if (!s) return "Email is required.";
  if (!EMAIL_RE.test(s)) return "Enter a valid email address.";
  return "";
}

export function validatePhone(v) {
  const s = (v || "").trim();
  if (!s) return ""; // phone is optional in most forms
  // Strip common formatting characters before validating digits.
  const cleaned = s.replace(/[\s\-()]/g, "");
  if (!PHONE_RE.test(cleaned)) return "Phone must be 7-15 digits (a leading + is allowed).";
  return "";
}

export function validatePassword(v) {
  const s = v || "";
  if (!s) return "Password is required.";
  if (s.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(s)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(s)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(s)) return "Password must include a digit.";
  return "";
}

export function validateDateOfBirth(v) {
  if (!v) return "Date of birth is required.";
  if (v < DOB_MIN) return "Date of birth cannot be before 1900.";
  if (v > dobMax()) return "You must be at least 10 years old to register.";
  return "";
}

export function validateGender(v) {
  if (!v) return "Please select a gender.";
  if (!["male", "female", "other"].includes(v)) return "Invalid gender selection.";
  return "";
}

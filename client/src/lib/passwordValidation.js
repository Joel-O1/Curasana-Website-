const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~]/;

export function validatePassword(password, confirmPassword = "") {
  const checks = [
    {
      id: "length",
      label: "At least 12 characters long",
      met: password.length >= 12,
      error: "Password must be at least 12 characters long.",
    },
    {
      id: "upper",
      label: "At least 1 uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
      error: "Password must include at least one uppercase letter.",
    },
    {
      id: "number",
      label: "At least 1 number (0-9)",
      met: /\d/.test(password),
      error: "Password must include at least one number.",
    },
    {
      id: "special",
      label: "At least 1 special character (!@#$%^&*...)",
      met: SPECIAL_CHAR_REGEX.test(password),
      error: "Password must include at least one special character.",
    },
    {
      id: "match",
      label: "Must match the confirm password field",
      met: password.length > 0 && password === confirmPassword,
      error: "Passwords do not match.",
    },
  ];

  const allMet = password.length > 0 && checks.every((check) => check.met);
  const firstError = checks.find((check) => !check.met)?.error ?? null;

  return { checks, allMet, firstError };
}

export function getPasswordStrength(checks, allMet) {
  if (!checks.some((check) => check.id !== "match" && check.met) && !allMet) {
    return { label: "Weak", percent: 0, color: "var(--coral)" };
  }

  if (allMet) {
    return { label: "Strong", percent: 100, color: "var(--teal-d)" };
  }

  const scoredChecks = checks.filter((check) => check.id !== "match");
  const metCount = scoredChecks.filter((check) => check.met).length;
  const percent = Math.round((metCount / scoredChecks.length) * 100);

  if (percent >= 75) {
    return { label: "Good", percent, color: "var(--blue)" };
  }

  if (percent >= 45) {
    return { label: "Fair", percent, color: "var(--amber)" };
  }

  return { label: "Weak", percent, color: "var(--coral)" };
}

// src/lib/utils/severity.js

export const getSeverityConfig = (severity) => {
  // 1. TEAL ZONE: Managed (1 - 3)
  if (severity <= 1) {
    return {
      dotBg: "var(--teal)",
      badgeClass: "bg-[var(--teal-light)] text-[var(--teal-d)] border-transparent",
      label: "Minimal",
    };
  }
  if (severity <= 2) {
    return {
      dotBg: "var(--teal)",
      badgeClass: "bg-[var(--teal-light)] text-[var(--teal-d)] border-transparent",
      label: "Mild",
    };
  }
  if (severity <= 3) {
    return {
      dotBg: "var(--teal)",
      badgeClass: "bg-[var(--teal-light)] text-[var(--teal-d)] border-transparent",
      label: "Mild-moderate",
    };
  }

  // 2. AMBER ZONE: Warning / Elevated (4 - 6)
  if (severity <= 5) {
    return {
      dotBg: "var(--amber)",
      badgeClass: "bg-[var(--amber-light)] text-[var(--amber-d)] border-transparent",
      label: "Moderate",
    };
  }
  if (severity <= 6) {
    return {
      dotBg: "var(--amber)",
      badgeClass: "bg-[var(--amber-light)] text-[var(--amber-d)] border-transparent",
      label: "Moderate-severe",
    };
  }

  // 3. CORAL CRITICAL ZONE: High Alert + Pulse (7 - 10)
  if (severity <= 7) {
    return {
      dotBg: "var(--coral)",
      badgeClass: "bg-[var(--coral-light)] text-[var(--coral-d)] border-transparent",
      label: "Severe",
    };
  }
  if (severity <= 8) {
    return {
      dotBg: "var(--coral)",
      // Added animate-pulse here
      badgeClass: "bg-[var(--coral-light)] text-[var(--coral-d)] border-transparent animate-pulse font-medium",
      label: "Very Severe",
    };
  }
  if (severity <= 9) {
    return {
      dotBg: "var(--coral)",
      // Added animate-pulse here
      badgeClass: "bg-[var(--coral-light)] text-[var(--coral-d)] border-transparent animate-pulse font-semibold",
      label: "Extremely Severe",
    };
  }
  
  // Level 10: Maximum Severity Ceiling
  return {
    dotBg: "var(--coral-hard)",
    badgeClass: "bg-[var(--coral-light)] text-[var(--coral-hard)] border-transparent animate-pulse font-bold shadow-sm",
    label: "Worst Imaginable",
  };
};
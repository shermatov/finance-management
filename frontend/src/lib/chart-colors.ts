// Categorical order + hues taken verbatim from the dataviz skill's validated
// reference palette (references/palette.md) — hand-picked brand-adjacent
// substitutes failed the validator's adjacent-pair CVD/lightness checks, so
// this order is kept exactly as documented rather than re-tuned. It is the
// CVD-safety mechanism, not cosmetic — do not reorder.
const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#008300", // green
  "#e87ba4", // magenta
  "#eda100", // yellow
  "#1baf7a", // aqua
  "#eb6834", // orange
  "#4a3aa7", // violet
  "#e34948", // red
];

const CATEGORICAL_DARK = [
  "#3987e5",
  "#008300",
  "#d55181",
  "#c98500",
  "#199e70",
  "#d95926",
  "#9085e9",
  "#e66767",
];

export function categoricalColor(index: number, mode: "light" | "dark" = "light"): string {
  const ramp = mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  if (index < ramp.length) return ramp[index];
  return mode === "dark" ? "#71717A" : "#94A3B8"; // "Other" — beyond the validated slot count
}

export const chartSeries = {
  income: { light: "#059669", dark: "#34D399" },
  expense: { light: "#DC2626", dark: "#F87171" },
};

export const chartInk = {
  muted: "#898781",
  gridline: { light: "#e1e0d9", dark: "#2c2c2a" },
};

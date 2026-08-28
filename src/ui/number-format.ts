export type FormattedNumber = {
  readonly exact: string;
  readonly text: string;
};

const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"] as const;
const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const significant = (value: number): number => {
  if (value < 10) return Math.round(value * 100) / 100;
  if (value < 100) return Math.round(value * 10) / 10;
  return Math.round(value);
};

const text = (value: number, suffixIndex: number): string => {
  if (suffixIndex >= suffixes.length)
    return value
      .toExponential(2)
      .replace(/(\.\d*?[1-9])0+e/, "$1e")
      .replace(/\.0+e/, "e")
      .replace("e+", "e");
  const scale = 1_000 ** suffixIndex;
  const scaled = value / scale;
  if (suffixIndex > 0 && scaled >= 999.95) return text(value, suffixIndex + 1);
  const rounded = significant(scaled);
  return `${Math.min(999, rounded).toString()}${suffixes[suffixIndex]}`;
};

export const formatNumber = (value: number): FormattedNumber => {
  if (!Number.isFinite(value) || value < 0) return { exact: "—", text: "—" };
  if (value < 10_000) {
    const exact = grouped.format(value);
    return { exact, text: exact };
  }
  const suffixIndex = Math.floor(Math.log10(value) / 3);
  return { exact: grouped.format(value), text: text(value, suffixIndex) };
};

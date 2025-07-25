import { isNumeric } from "metabase-lib/v1/types/utils/isa";

export function dimensionIsNumeric({ cols, rows }, i = 0) {
  if (isNumeric(cols[i])) {
    return true;
  }

  const hasAtLeastOneNumber = rows.some((row) => typeof row[i] === "number");
  const hasNumbersOrNullsOnly = rows.every(
    (row) => typeof row[i] === "number" || row[i] === null,
  );

  return hasNumbersOrNullsOnly && hasAtLeastOneNumber;
}

export const isMultipleOf = (value, base) => {
  // Ideally we could use Number.EPSILON as constant diffThreshold here.
  // However, we sometimes see very small errors that are bigger than EPSILON.
  // For example, when called 1.23456789 and 1e-8 we see a diff of ~1e-16.
  const diffThreshold = Math.pow(10, SMALLEST_PRECISION_EXP);
  return Math.abs(value - Math.round(value / base) * base) < diffThreshold;
};

// We seem to run into float bugs if we get any more precise than this.
const SMALLEST_PRECISION_EXP = -13;

export function precision(a) {
  if (!isFinite(a)) {
    return 0;
  }
  if (!a) {
    return 0;
  }

  // Find the largest power of ten needed to evenly divide the value. We start
  // with the power of ten greater than the value and walk backwards until we
  // hit our limit of SMALLEST_PRECISION_EXP or isMultipleOf returns true.
  let e = Math.ceil(Math.log10(Math.abs(a)));
  while (e > SMALLEST_PRECISION_EXP && !isMultipleOf(a, Math.pow(10, e))) {
    e--;
  }
  return Math.pow(10, e);
}

export function decimalCount(a) {
  if (!isFinite(a)) {
    return 0;
  }
  let e = 1,
    p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
}

export function computeNumericDataInterval(xValues) {
  let bestPrecision = Infinity;
  for (const value of xValues) {
    const p = precision(value) || 1;
    if (p < bestPrecision) {
      bestPrecision = p;
    }
  }
  return bestPrecision;
}

export function computeChange(comparisonVal, currVal) {
  if (comparisonVal === 0) {
    return currVal === 0 ? 0 : currVal > 0 ? Infinity : -Infinity;
  }

  return (currVal - comparisonVal) / Math.abs(comparisonVal);
}

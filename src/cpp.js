function toBigInt(value) {
  if (typeof value === "bigint") {
    return value;
  }
  return BigInt(Math.trunc(value));
}
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;
function toInt(value) {
  return Number(BigInt.asIntN(32, toBigInt(value)));
}
function abs(value) {
  return value < 0 ? -value : value;
}
function truncDiv(a, b) {
  return toInt(toBigInt(a) / toBigInt(b));
}
function multiplyF16(a, b) {
  return toInt(toBigInt(a) * toBigInt(b) >> 16n);
}
function divideF16(a, b) {
  return toInt((toBigInt(a) << 32n) / toBigInt(b) >> 16n);
}
function roundfToInt(value) {
  const rounded = Math.round(Math.abs(value));
  return value < 0 ? -rounded : rounded;
}
export {
  INT_MAX,
  INT_MIN,
  abs,
  divideF16,
  multiplyF16,
  roundfToInt,
  toInt,
  truncDiv
};

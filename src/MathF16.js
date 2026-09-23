import {
  abs,
  divideF16 as divideF16Compat,
  roundfToInt
} from "./cpp.js";
class MathF16 {
  static PiHalfF16 = 102944;
  static PiF16 = 205887;
  static divideF16(a, b) {
    return divideF16Compat(a, b);
  }
  static atanF16(angle) {
    return roundfToInt(Math.atan(angle / 65535) * 65536);
  }
  static sinF16(angle) {
    return roundfToInt(Math.sin(angle / 65535) * 65536);
  }
  static cosF16(angle) {
    return MathF16.sinF16(MathF16.PiHalfF16 - angle);
  }
  static atan2F16(dx, dy) {
    if (abs(dy) < 3) {
      return (dx > 0 ? 1 : -1) * MathF16.PiHalfF16;
    }
    const atanVal = MathF16.atanF16(MathF16.divideF16(dx, dy));
    if (dx > 0) {
      return dy > 0 ? atanVal : MathF16.PiF16 + atanVal;
    }
    return dy > 0 ? atanVal : atanVal - MathF16.PiF16;
  }
}
export {
  MathF16
};

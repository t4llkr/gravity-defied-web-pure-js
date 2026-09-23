import { Font } from "./Font.js";
class FontStorage {
  static fontsMap = /* @__PURE__ */ new Map();
  static getFont(style, size) {
    const key = `${style}:${size}`;
    const existing = FontStorage.fontsMap.get(key);
    if (existing !== void 0) {
      return existing;
    }
    const font = new Font(style, size);
    FontStorage.fontsMap.set(key, font);
    return font;
  }
  static clearAll() {
    FontStorage.fontsMap.clear();
  }
}
export {
  FontStorage
};

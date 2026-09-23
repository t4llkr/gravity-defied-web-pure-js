class Font {
  static SIZE_SMALL = 8;
  static SIZE_MEDIUM = 0;
  static SIZE_LARGE = 16;
  static STYLE_PLAIN = "normal";
  static STYLE_BOLD = "bold";
  static STYLE_ITALIC = "italic";
  static FACE_SYSTEM = 0;
  static measureCanvas = null;
  static measureCtx = null;
  cssFont;
  height;
  constructor(style, pointSize) {
    this.height = Font.getRealFontSize(pointSize);
    this.cssFont = `${style} ${this.height}px "Trebuchet MS", "Segoe UI", sans-serif`;
  }
  getBaselinePosition() {
    return this.height;
  }
  getHeight() {
    return this.height;
  }
  getCssFont() {
    return this.cssFont;
  }
  charWidth(c) {
    return this.stringWidth(c.slice(0, 1));
  }
  stringWidth(s) {
    const ctx = Font.getMeasureCtx();
    ctx.font = this.cssFont;
    return Math.ceil(ctx.measureText(s).width);
  }
  substringWidth(string, offset, len) {
    return this.stringWidth(string.substring(offset, offset + len));
  }
  static getMeasureCtx() {
    if (Font.measureCtx !== null) {
      return Font.measureCtx;
    }
    Font.measureCanvas = document.createElement("canvas");
    Font.measureCtx = Font.measureCanvas.getContext("2d");
    if (Font.measureCtx === null) {
      throw new Error("Canvas 2D context is not available");
    }
    return Font.measureCtx;
  }
  static getRealFontSize(size) {
    switch (size) {
      case Font.SIZE_LARGE:
        return 32;
      case Font.SIZE_MEDIUM:
        return 16;
      case Font.SIZE_SMALL:
        return 12;
      default:
        throw new Error(`unknown font size: ${size}`);
    }
  }
}
export {
  Font
};

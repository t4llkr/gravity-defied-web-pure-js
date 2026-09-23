import { Graphics } from "./lcdui/Graphics.js";
class TextRender {
  text;
  static defaultFont;
  font = null;
  dx = 0;
  static fieldMaxWidth = 100;
  static fieldMaxHeightUnused = 100;
  isDrawSprite = false;
  spriteNo = 0;
  micro;
  constructor(text, var2) {
    this.text = text;
    this.micro = var2;
  }
  static getBaselinePosition() {
    return TextRender.defaultFont.getBaselinePosition();
  }
  setFont(font) {
    this.font = font;
  }
  static setDefaultFont(font) {
    TextRender.defaultFont = font;
  }
  static setMaxArea(w, h) {
    TextRender.fieldMaxWidth = w;
    TextRender.fieldMaxHeightUnused = h;
    void TextRender.fieldMaxHeightUnused;
  }
  setText(text) {
    this.text = text;
  }
  isNotTextRender() {
    return false;
  }
  menuElemMethod(_var1) {
  }
  render(graphics, y, x) {
    const preservedFont = graphics.getFont();
    graphics.setFont(TextRender.defaultFont);
    if (this.font !== null) {
      graphics.setFont(this.font);
    }
    graphics.drawString(this.text, x + this.dx, y, Graphics.LEFT | Graphics.TOP);
    if (this.isDrawSprite && this.micro.gameCanvas !== null) {
      this.micro.gameCanvas.drawSprite(graphics, this.spriteNo, x, y);
    }
    graphics.setFont(preservedFont);
  }
  static makeMultilineTextRenders(text, micro) {
    let startPos = 0;
    let endPos = 0;
    const var4 = 25;
    const vector = [];
    while (endPos < text.length) {
      let var6 = text.indexOf(" ", startPos);
      if (var6 === -1) {
        endPos = text.length;
        var6 = text.length;
      }
      while (endPos < text.length && TextRender.defaultFont.substringWidth(text, startPos, var6 - startPos) < TextRender.fieldMaxWidth - var4) {
        endPos = var6 + 1;
        var6 = text.indexOf(" ", var6 + 1);
        if (var6 === -1) {
          if (TextRender.defaultFont.substringWidth(text, startPos, text.length - 1 - startPos) <= TextRender.fieldMaxWidth - var4) {
            endPos = text.length;
          }
          break;
        }
      }
      vector.push(new TextRender(text.substring(startPos, endPos), micro));
      startPos = ++endPos - 1;
    }
    return vector;
  }
  setDx(var1) {
    this.dx = var1;
  }
  setDrawSprite(isDrawSprite, spriteNo) {
    this.isDrawSprite = isDrawSprite;
    this.spriteNo = spriteNo;
  }
}
export {
  TextRender
};

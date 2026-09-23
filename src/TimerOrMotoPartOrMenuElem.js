import { Graphics } from "./lcdui/Graphics.js";
class TimerOrMotoPartOrMenuElem {
  text = "";
  targetMenu = null;
  menuManager = null;
  xF16 = 0;
  yF16 = 0;
  angleF16 = 0;
  velocityXF16 = 0;
  velocityYF16 = 0;
  angularVelocityF16 = 0;
  forceXF16 = 0;
  forceYF16 = 0;
  torqueF16 = 0;
  timerNo = 0;
  micro = null;
  constructor(var1, var2, var3) {
    this.resetState();
    if (typeof var1 === "number") {
      this.micro = var2;
      this.timerNo = var1;
      return;
    }
    if (typeof var1 === "string") {
      this.text = var1 + ">";
      this.targetMenu = var2 ?? null;
      this.menuManager = var3 ?? null;
    }
  }
  resetState() {
    this.xF16 = 0;
    this.yF16 = 0;
    this.angleF16 = 0;
    this.velocityXF16 = 0;
    this.velocityYF16 = 0;
    this.angularVelocityF16 = 0;
    this.forceXF16 = 0;
    this.forceYF16 = 0;
    this.torqueF16 = 0;
  }
  setText(text) {
    this.text = text + ">";
  }
  getText() {
    return this.text;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(_var1) {
    switch (_var1) {
      case 1:
      case 2:
        this.menuManager?.handleMenuSelection(this);
        this.targetMenu?.setParentMenu(this.menuManager?.getCurrentMenu() ?? null);
        this.menuManager?.openMenu(this.targetMenu, false);
        break;
      default:
        break;
    }
  }
  setParentMenu(parentMenu) {
    this.targetMenu = parentMenu;
  }
  render(graphics, y, x) {
    graphics.drawString(this.text, x, y, Graphics.LEFT | Graphics.TOP);
  }
}
export {
  TimerOrMotoPartOrMenuElem
};

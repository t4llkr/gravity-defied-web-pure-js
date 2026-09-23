import { GameCanvas } from "./GameCanvas.js";
import { Graphics } from "./lcdui/Graphics.js";
import { GameMenu as GameMenuClass } from "./GameMenu.js";
class SettingsStringRender {
  optionsList = [];
  currentOptionPos = 0;
  maxAvailableOption = 0;
  text;
  menuManager;
  currentGameMenu = null;
  parentGameMenu = null;
  isToggleSetting;
  selectionMenuRequested = false;
  selectedOptionName = "";
  micro;
  settingsStringRenders = [];
  hasSprite = false;
  isDrawSprite8 = false;
  useColon;
  constructor(text, isDisabled, menuManager, optionsList, isToggleSetting, micro, parentGameMenu, useColon) {
    this.micro = micro;
    this.menuManager = menuManager;
    this.useColon = useColon;
    this.isToggleSetting = isToggleSetting;
    this.parentGameMenu = parentGameMenu;
    if (useColon) {
      this.text = text;
      this.isDrawSprite8 = true;
      return;
    }
    this.text = `${text}:`;
    this.currentOptionPos = isDisabled;
    this.optionsList = optionsList.length === 0 ? [""] : optionsList;
    this.maxAvailableOption = optionsList.length - 1;
    this.setCurrentOptionPos(isDisabled);
    if (isToggleSetting) {
      this.selectedOptionName = isDisabled === 1 ? "Off" : "On";
    } else {
      this.selectCurrentOptionName();
      this.init();
    }
  }
  setFlags(hasSprite, isDrawSprite8) {
    this.hasSprite = hasSprite;
    this.isDrawSprite8 = isDrawSprite8;
  }
  setOptionsList(var1) {
    this.optionsList = var1;
    if (this.currentOptionPos > this.optionsList.length - 1) {
      this.currentOptionPos = this.optionsList.length - 1;
    }
    if (this.maxAvailableOption > this.optionsList.length - 1) {
      this.maxAvailableOption = this.optionsList.length - 1;
    }
    this.selectCurrentOptionName();
    this.init();
  }
  init() {
    this.currentGameMenu = new GameMenuClass(this.text, this.micro, this.parentGameMenu);
    this.settingsStringRenders = new Array(this.optionsList.length);
    for (let var1 = 0; var1 < this.settingsStringRenders.length; ++var1) {
      this.settingsStringRenders[var1] = new SettingsStringRender(this.optionsList[var1], 0, this, [], false, this.micro, this.parentGameMenu, true);
      if (var1 > this.maxAvailableOption) {
        this.settingsStringRenders[var1].setFlags(true, true);
      }
      this.currentGameMenu.addMenuElement(this.settingsStringRenders[var1]);
    }
  }
  setParentGameMenu(parentGameMenu) {
    this.parentGameMenu = parentGameMenu;
  }
  setText(text) {
    this.text = this.useColon ? text : `${text}:`;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(var1) {
    if (this.useColon) {
      if (var1 === 1) {
        this.menuManager.handleMenuSelection(this);
      }
      return;
    }
    switch (var1) {
      case 1:
        if (this.isToggleSetting) {
          ++this.currentOptionPos;
          if (this.currentOptionPos > 1) {
            this.currentOptionPos = 0;
          }
          this.selectedOptionName = this.currentOptionPos === 1 ? "Off" : "On";
          this.menuManager.handleMenuSelection(this);
          return;
        }
        this.selectionMenuRequested = true;
        this.menuManager.handleMenuSelection(this);
        return;
      case 2:
        if (this.isToggleSetting) {
          if (this.currentOptionPos === 1) {
            this.currentOptionPos = 0;
            this.selectedOptionName = "On";
            this.menuManager.handleMenuSelection(this);
          }
          return;
        }
        ++this.currentOptionPos;
        if (this.currentOptionPos > this.optionsList.length - 1) {
          this.currentOptionPos = this.optionsList.length - 1;
        } else {
          this.menuManager.handleMenuSelection(this);
        }
        this.selectCurrentOptionName();
        return;
      case 3:
        if (this.isToggleSetting) {
          if (this.currentOptionPos === 0) {
            this.currentOptionPos = 1;
            this.selectedOptionName = "Off";
            this.menuManager.handleMenuSelection(this);
          }
          return;
        }
        --this.currentOptionPos;
        if (this.currentOptionPos < 0) {
          this.currentOptionPos = 0;
        } else {
          this.selectCurrentOptionName();
          this.menuManager.handleMenuSelection(this);
        }
        this.selectCurrentOptionName();
    }
  }
  selectCurrentOptionName() {
    this.selectedOptionName = this.optionsList[this.currentOptionPos];
  }
  render(graphics, y, x) {
    if (this.useColon) {
      if (!this.hasSprite) {
        graphics.drawString(this.text, x, y, Graphics.LEFT | Graphics.TOP);
      } else if (this.micro.gameCanvas !== null) {
        graphics.drawString(this.text, x + GameCanvas.spriteSizeX[8] + 3, y, Graphics.LEFT | Graphics.TOP);
        this.micro.gameCanvas.drawSprite(graphics, this.isDrawSprite8 ? 8 : 9, x, y - Math.trunc(GameCanvas.spriteSizeY[this.isDrawSprite8 ? 8 : 9] / 2) + Math.trunc(graphics.getFont().getHeight() / 2));
      }
      return;
    }
    graphics.drawString(this.text, x, y, Graphics.LEFT | Graphics.TOP);
    let shiftedX = x + graphics.getFont().stringWidth(this.text);
    if (this.currentOptionPos > this.maxAvailableOption && !this.isToggleSetting && this.micro.gameCanvas !== null) {
      this.micro.gameCanvas.drawSprite(graphics, 8, shiftedX + 1, y - Math.trunc(GameCanvas.spriteSizeY[8] / 2) + Math.trunc(graphics.getFont().getHeight() / 2));
      shiftedX += GameCanvas.spriteSizeX[9] + 1;
    }
    shiftedX += 2;
    graphics.drawString(this.selectedOptionName, shiftedX, y, Graphics.LEFT | Graphics.TOP);
  }
  setAvailableOptions(maxAvailableOption) {
    this.maxAvailableOption = maxAvailableOption;
    if (maxAvailableOption > this.optionsList.length - 1) {
      maxAvailableOption = this.optionsList.length - 1;
    }
    if (this.currentGameMenu !== null) {
      for (let i = 0; i < this.settingsStringRenders.length; ++i) {
        this.settingsStringRenders[i].setFlags(i > maxAvailableOption, i > maxAvailableOption);
      }
    }
  }
  getMaxAvailableOptionPos() {
    return this.maxAvailableOption;
  }
  getMaxOptionPos() {
    return this.optionsList.length - 1;
  }
  getOptionsList() {
    return this.optionsList;
  }
  setCurrentOptionPos(pos) {
    this.currentOptionPos = pos;
    if (this.currentOptionPos > this.optionsList.length - 1) {
      this.currentOptionPos = 0;
    }
    if (this.currentOptionPos < 0) {
      this.currentOptionPos = this.optionsList.length - 1;
    }
    this.selectCurrentOptionName();
  }
  getCurrentOptionPos() {
    return this.currentOptionPos;
  }
  getCurrentMenu() {
    return this.currentGameMenu;
  }
  openMenu(menu, preserveSelection) {
    this.menuManager.openMenu(menu, preserveSelection);
  }
  saveAndClose() {
    this.menuManager.saveAndClose();
  }
  handleMenuSelection(var1) {
    for (let var2 = 0; var2 < this.settingsStringRenders.length; ++var2) {
      if (var1 === this.settingsStringRenders[var2]) {
        this.currentOptionPos = var2;
        this.selectCurrentOptionName();
        break;
      }
    }
    this.menuManager.openMenu(this.parentGameMenu, true);
    this.menuManager.handleMenuSelection(this);
  }
  getSettingsStringRenders() {
    return this.settingsStringRenders;
  }
  consumeSelectionMenuRequested() {
    const var1 = this.selectionMenuRequested;
    this.selectionMenuRequested = false;
    return var1;
  }
}
export {
  SettingsStringRender
};

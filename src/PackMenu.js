import { GameMenu } from "./GameMenu.js";
import { LevelLoader } from "./LevelLoader.js";
import { TextRender } from "./TextRender.js";
import { TimerOrMotoPartOrMenuElem } from "./TimerOrMotoPartOrMenuElem.js";
import { Graphics } from "./lcdui/Graphics.js";
class PackMenu {
  micro;
  menuManager;
  packManager;
  gameMenuPacks;
  gameMenuPackList;
  gameMenuCachedPacks;
  taskBrowsePacks;
  taskCachedPacks;
  taskBack;
  currentPage = 1;
  packList = [];
  statusMessage = "";
  constructor(micro, menuManager, packManager) {
    this.micro = micro;
    this.menuManager = menuManager;
    this.packManager = packManager;
    const mainMenu = menuManager.gameMenuMain;
    this.gameMenuPacks = new GameMenu("Level Packs", this.micro, mainMenu);
    this.gameMenuPackList = new GameMenu("Browse", this.micro, this.gameMenuPacks);
    this.gameMenuCachedPacks = new GameMenu("Cached", this.micro, this.gameMenuPacks);
    this.taskBrowsePacks = new TimerOrMotoPartOrMenuElem(
      "Browse Packs",
      this.gameMenuPackList,
      this.menuManager
    );
    this.taskCachedPacks = new TimerOrMotoPartOrMenuElem(
      "Cached Packs",
      this.gameMenuCachedPacks,
      this.menuManager
    );
    this.taskBack = new BackItem("Back", mainMenu, this.menuManager);
    this.gameMenuPacks.addMenuElement(this.taskBrowsePacks);
    this.gameMenuPacks.addMenuElement(this.taskCachedPacks);
    this.gameMenuPacks.addMenuElement(this.taskBack);
  }
  getMainMenu() {
    return this.gameMenuPacks;
  }
  getBrowseMenu() {
    return this.gameMenuPackList;
  }
  getCachedMenu() {
    return this.gameMenuCachedPacks;
  }
  async loadPackListPage() {
    this.statusMessage = "Loading...";
    this.rebuildPackListMenu();
    try {
      this.packList = await this.packManager.fetchPackList(this.currentPage);
      this.statusMessage = `Page ${this.currentPage}: ${this.packList.length} packs`;
    } catch (err) {
      this.statusMessage = "Error loading packs";
      console.error(err);
    }
    this.rebuildPackListMenu();
  }
  async loadCachedPacksPage() {
    this.statusMessage = "Loading...";
    this.rebuildCachedPacksMenu();
    try {
      const cached = await this.packManager.getCachedPacks();
      this.statusMessage = `${cached.length} cached packs`;
      this.rebuildCachedPacksMenu(cached);
    } catch (err) {
      this.statusMessage = "Error loading cached";
      console.error(err);
      this.rebuildCachedPacksMenu();
    }
  }
  rebuildPackListMenu() {
    this.gameMenuPackList.clearVector();
    this.gameMenuPackList.addMenuElement(new TextRender(this.statusMessage, this.micro));
    for (const pack of this.packList) {
      const item = new PackMenuItem(pack.name, pack, this);
      this.gameMenuPackList.addMenuElement(item);
    }
    if (this.currentPage > 1) {
      const prevItem = new PrevPageItem(this);
      this.gameMenuPackList.addMenuElement(prevItem);
    }
    const nextItem = new NextPageItem(this);
    this.gameMenuPackList.addMenuElement(nextItem);
    const back = new BackItem("Back", this.gameMenuPacks, this.menuManager);
    this.gameMenuPackList.addMenuElement(back);
  }
  rebuildCachedPacksMenu(cachedPacks) {
    this.gameMenuCachedPacks.clearVector();
    this.gameMenuCachedPacks.addMenuElement(new TextRender(this.statusMessage, this.micro));
    const packs = cachedPacks ?? [];
    if (packs.length === 0) {
      this.gameMenuCachedPacks.addMenuElement(new TextRender("No cached packs", this.micro));
    } else {
      for (const meta of packs) {
        const item = new CachedPackItem(meta.name, meta, this);
        this.gameMenuCachedPacks.addMenuElement(item);
      }
    }
    const backCached = new BackItem("Back", this.gameMenuPacks, this.menuManager);
    this.gameMenuCachedPacks.addMenuElement(backCached);
  }
  goToPrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      void this.loadPackListPage();
    }
  }
  goToNextPage() {
    this.currentPage++;
    void this.loadPackListPage();
  }
  async onPackSelected(pack) {
    this.showPackDetail(pack);
  }
  showPackDetail(pack) {
    const detailMenu = new GameMenu(pack.name, this.micro, this.gameMenuPackList);
    detailMenu.addMenuElement(new TextRender(`Author: ${pack.author}`, this.micro));
    detailMenu.addMenuElement(new TextRender(`Levels: ${pack.levels}`, this.micro));
    detailMenu.addMenuElement(new TextRender(`Size: ${pack.mrgSize}`, this.micro));
    const downloadItem = new DownloadPackItem("Download & Load", pack, this);
    detailMenu.addMenuElement(downloadItem);
    const back = new BackItem("Back", this.gameMenuPackList, this.menuManager);
    detailMenu.addMenuElement(back);
    this.menuManager.openMenu(detailMenu, false);
  }
  async downloadAndLoadPack(pack) {
    try {
      await this.packManager.downloadPack(pack.id);
      const blobUrl = await this.packManager.getPackBlobUrl(pack.id);
      if (!blobUrl) {
        this.menuManager.showAlert("Error", "Failed to load pack", null);
        return;
      }
      const newLoader = await LevelLoader.create(blobUrl);
      this.micro.levelLoader = newLoader;
      this.menuManager.levelNames = newLoader.levelNames;
      this.menuManager.unlockedTracksByLevel = [0, 0, 0];
      this.menuManager.availableLeagues = 0;
      this.menuManager.maxAvailableLevel = 1;
      this.menuManager.showAlert("Pack Loaded", `${pack.name} ready!`, null);
      this.menuManager.openMenu(this.menuManager.gameMenuMain, false);
    } catch (err) {
      console.error("Failed to load pack:", err);
      this.menuManager.showAlert("Error", "Failed to download pack", null);
    }
  }
  async onCachedPackSelected(meta) {
    await this.downloadAndLoadPack({
      id: meta.id,
      name: meta.name,
      author: meta.author,
      authorId: meta.authorId,
      levels: meta.levels,
      mrgSize: meta.mrgSize,
      hasGdlvl: meta.hasGdlvl
    });
  }
}
class BackItem {
  label;
  targetMenu;
  menuManager;
  constructor(label, targetMenu, menuManager) {
    this.label = label;
    this.targetMenu = targetMenu;
    this.menuManager = menuManager;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      this.menuManager.openMenu(this.targetMenu, true);
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString(this.label, x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
class PackMenuItem {
  label;
  pack;
  packMenu;
  constructor(label, pack, packMenu) {
    this.label = label;
    this.pack = pack;
    this.packMenu = packMenu;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      this.packMenu.onPackSelected(this.pack);
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString(this.label, x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
class PrevPageItem {
  packMenu;
  constructor(packMenu) {
    this.packMenu = packMenu;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      this.packMenu.goToPrevPage();
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString("< Prev Page", x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
class NextPageItem {
  packMenu;
  constructor(packMenu) {
    this.packMenu = packMenu;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      this.packMenu.goToNextPage();
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString("Next Page >", x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
class DownloadPackItem {
  label;
  pack;
  packMenu;
  constructor(label, pack, packMenu) {
    this.label = label;
    this.pack = pack;
    this.packMenu = packMenu;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      void this.packMenu.downloadAndLoadPack(this.pack);
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString(this.label, x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
class CachedPackItem {
  label;
  meta;
  packMenu;
  constructor(label, meta, packMenu) {
    this.label = label;
    this.meta = meta;
    this.packMenu = packMenu;
  }
  isNotTextRender() {
    return true;
  }
  menuElemMethod(action) {
    if (action === 1) {
      void this.packMenu.onCachedPackSelected(this.meta);
    }
  }
  render(graphics, y, x) {
    graphics.setColor(0, 0, 0);
    graphics.drawString(this.label, x, y, Graphics.LEFT | Graphics.TOP);
  }
  consumeSelectionMenuRequested() {
    return false;
  }
  getCurrentOptionPos() {
    return 0;
  }
  getMaxOptionPos() {
    return 0;
  }
  getCurrentMenu() {
    return null;
  }
  setAvailableOptions() {
  }
  setCurrentOptionPos() {
  }
  setOptionsList() {
  }
  init() {
  }
  getOptionsList() {
    return [];
  }
  getMaxAvailableOptionPos() {
    return 0;
  }
  setParentGameMenu() {
  }
  setText() {
  }
}
export {
  CachedPackItem,
  DownloadPackItem,
  NextPageItem,
  PackMenu,
  PackMenuItem,
  PrevPageItem
};

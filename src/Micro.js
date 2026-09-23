class Micro {
  gameCanvas = null;
  levelLoader = null;
  gamePhysics = null;
  menuManager = null;
  isLoadingBlocked = false;
  numPhysicsLoops = 2;
  timeMs = 0;
  gameTimeMs = 0;
  crashRestartDeadlineMs = 0;
  isInited = false;
  isTimerRunning = false;
  static isGameVisible = false;
  static isInGameMenu = false;
  static gameLoadingStateStage = 0;
  gameToMenu() {
    this.gameCanvas?.hideMenuButton();
    if (this.gameCanvas !== null) {
      this.gameCanvas.isDrawingTime = false;
      this.gameCanvas.hideBackButton();
    }
    Micro.isInGameMenu = true;
  }
  menuToGame() {
    Micro.isInGameMenu = false;
    if (this.gameCanvas !== null) {
      this.gameCanvas.isDrawingTime = true;
      this.gameCanvas.hideBackButton();
    }
    this.gameCanvas?.showMenuButton();
  }
}
export {
  Micro
};

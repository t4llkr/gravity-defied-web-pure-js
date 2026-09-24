import { LevelLoader } from "./LevelLoader.js";
import { MathF16 } from "./MathF16.js";
import { Micro } from "./Micro.js";
import { TimerOrMotoPartOrMenuElem } from "./TimerOrMotoPartOrMenuElem.js";
import { class_10 } from "./class_10.js";
import { abs, divideF16, multiplyF16 } from "./cpp.js";
import { GameCanvas } from "./GameCanvas.js";
function max3(a, b, c) {
  return Math.max(a, b, c);
}
function min3(a, b, c) {
  return Math.min(a, b, c);
}
class GamePhysics {
  index01 = 0;
  index10 = 1;
  collisionBodyIndex = -1;
  constraints = [];
  wheelTorqueF16 = 0;
  levelLoader;
  collisionNormalXF16 = 0;
  collisionNormalYF16 = 0;
  isCrashed = false;
  isRiderDown = false;
  riderPoseBlendF16 = 32768;
  leanStepF16 = 3276;
  rotationSpeedF16 = 0;
  unusedFlag42 = false;
  motoComponents = new Array(6);
  unusedCounter44 = 0;
  isInputAcceleration = false;
  isInputBreak = false;
  isInputBack = false;
  isInputForward = false;
  isInputUp = false;
  isInputDown = false;
  isInputLeft = false;
  isInputRight = false;
  finishTriggerLatched = false;
  isEnableLookAhead = true;
  camShiftX = 0;
  camShiftY = 0;
  lookAheadClampF16 = 655360;
  hardcodedArr1 = [[183500, -52428], [262144, -163840], [406323, -65536], [445644, -39321], [235929, 39321], [16384, -144179], [13107, -78643], [288358, 81920]];
  hardcodedArr2 = [[190054, -111411], [308019, -235929], [334233, -114688], [393216, -58982], [262144, 98304], [65536, -124518], [13107, -78643], [288358, 81920]];
  hardcodedArr3 = [[157286, 13107], [294912, -13107], [367001, 91750], [406323, 190054], [347340, 72089], [39321, -98304], [13107, -52428], [294912, 81920]];
  hardcodedArr4 = [[183500, -39321], [262144, -131072], [393216, -65536], [458752, -39321], [294912, 6553], [16384, -144179], [13107, -78643], [288358, 85196]];
  hardcodedArr5 = [[190054, -91750], [255590, -235929], [334233, -114688], [393216, -42598], [301465, 6553], [65536, -78643], [13107, -78643], [288358, 85196]];
  hardcodedArr6 = [[157286, 13107], [294912, -13107], [367001, 104857], [406323, 176947], [347340, 72089], [39321, -98304], [13107, -52428], [288358, 85196]];
  riderPoseBlendTable;
  static physicsStepCount = 0;
  static gravityForceF16 = 0;
  static tireGripF16 = 0;
  static tireDampingF16 = 0;
  static tireAngularDampingF16 = 0;
  static motoParam1 = 0;
  static motoParam2 = 0;
  static massScaleF16 = 0;
  static motoParam10 = 0;
  static constraintAngleF16 = 0;
  static const175_1_half = [114688, 65536, 32768];
  static motoParam3 = 0;
  static torqueDampingF16 = 0;
  static motoParam4 = 0;
  static motoParam5 = 0;
  static motoParam6 = 0;
  static motoParam7 = 0;
  static motoParam8 = 0;
  static motoParam9 = 0;
  bikeParts = [];
  unusedFlag41 = false;
  mode = 0;
  isRenderDriverWithSprites = false;
  isRenderMotoWithSprites = false;
  static curentMotoLeague = 0;
  isTrackFinished = false;
  isGenerateInputAI = false;
  constructor(levelLoader) {
    void this.leanStepF16;
    void this.unusedFlag42;
    void this.unusedCounter44;
    for (let var2 = 0; var2 < 6; ++var2) {
      this.motoComponents[var2] = new TimerOrMotoPartOrMenuElem();
    }
    this.riderPoseBlendTable = [[45875], [32768], [52428]];
    this.levelLoader = levelLoader;
    this.resetSmth(true);
    this.isGenerateInputAI = false;
    this.syncRenderStateFromSimulation();
    this.isCrashed = false;
  }
  getLoadedSpriteFlags() {
    if (this.isRenderDriverWithSprites && this.isRenderMotoWithSprites) {
      return 3;
    }
    if (this.isRenderMotoWithSprites) {
      return 1;
    }
    return this.isRenderDriverWithSprites ? 2 : 0;
  }
  applyLoadedSpriteFlags(var1) {
    this.isRenderDriverWithSprites = false;
    this.isRenderMotoWithSprites = false;
    if ((var1 & 2) !== 0) {
      this.isRenderDriverWithSprites = true;
    }
    if ((var1 & 1) !== 0) {
      this.isRenderMotoWithSprites = true;
    }
  }
  setMode(mode) {
    this.mode = mode;
    switch (mode) {
      case 1:
      default:
        GamePhysics.physicsStepCount = 1310;
        GamePhysics.gravityForceF16 = 1638400;
        this.setMotoLeague(1);
        this.resetSmth(true);
    }
  }
  setMotoLeague(league) {
    GamePhysics.curentMotoLeague = league;
    GamePhysics.tireGripF16 = 45875;
    GamePhysics.tireDampingF16 = 13107;
    GamePhysics.tireAngularDampingF16 = 39321;
    GamePhysics.massScaleF16 = 1310720;
    GamePhysics.constraintAngleF16 = 262144;
    GamePhysics.torqueDampingF16 = 6553;
    switch (league) {
      case 0:
      default:
        GamePhysics.motoParam1 = 19660;
        GamePhysics.motoParam2 = 19660;
        GamePhysics.motoParam3 = 1114112;
        GamePhysics.motoParam4 = 52428800;
        GamePhysics.motoParam5 = 3276800;
        GamePhysics.motoParam6 = 327;
        GamePhysics.motoParam7 = 0;
        GamePhysics.motoParam8 = 32768;
        GamePhysics.motoParam9 = 327680;
        GamePhysics.motoParam10 = 19660800;
        break;
      case 1:
        GamePhysics.motoParam1 = 32768;
        GamePhysics.motoParam2 = 32768;
        GamePhysics.motoParam3 = 1114112;
        GamePhysics.motoParam4 = 65536e3;
        GamePhysics.motoParam5 = 3276800;
        GamePhysics.motoParam6 = 6553;
        GamePhysics.motoParam7 = 26214;
        GamePhysics.motoParam8 = 26214;
        GamePhysics.motoParam9 = 327680;
        GamePhysics.motoParam10 = 19660800;
        break;
      case 2:
        GamePhysics.motoParam1 = 32768;
        GamePhysics.motoParam2 = 32768;
        GamePhysics.motoParam3 = 1310720;
        GamePhysics.motoParam4 = 75366400;
        GamePhysics.motoParam5 = 3473408;
        GamePhysics.motoParam6 = 6553;
        GamePhysics.motoParam7 = 26214;
        GamePhysics.motoParam8 = 39321;
        GamePhysics.motoParam9 = 327680;
        GamePhysics.motoParam10 = 21626880;
        break;
      case 3:
        GamePhysics.motoParam1 = 32768;
        GamePhysics.motoParam2 = 32768;
        GamePhysics.motoParam3 = 1441792;
        GamePhysics.motoParam4 = 78643200;
        GamePhysics.motoParam5 = 3538944;
        GamePhysics.motoParam6 = 6553;
        GamePhysics.motoParam7 = 26214;
        GamePhysics.motoParam8 = 65536;
        GamePhysics.motoParam9 = 1310720;
        GamePhysics.motoParam10 = 21626880;
    }
    this.resetSmth(true);
  }
  resetSmth(unused) {
    void unused;
    this.unusedCounter44 = 0;
    this.initializeBikeState(this.levelLoader.getStartPosX(), this.levelLoader.getStartPosY());
    this.wheelTorqueF16 = 0;
    this.rotationSpeedF16 = 0;
    this.isCrashed = false;
    this.isRiderDown = false;
    this.finishTriggerLatched = false;
    this.isTrackFinished = false;
    this.isGenerateInputAI = false;
    this.unusedFlag41 = false;
    this.unusedFlag42 = false;
    this.levelLoader.gameLevel?.setShadowProjectionRange(
      this.bikeParts[2].motoComponents[5].xF16 + 98304 - GamePhysics.const175_1_half[0],
      this.bikeParts[1].motoComponents[5].xF16 - 98304 + GamePhysics.const175_1_half[0]
    );
  }
  applyPerspectiveOffset(var1) {
    const var2 = (var1 ? 65536 : -65536) << 1;
    for (let var3 = 0; var3 < 6; ++var3) {
      for (let var4 = 0; var4 < 6; ++var4) {
        this.bikeParts[var3].motoComponents[var4].yF16 += var2;
      }
    }
  }
  initializeBikeState(var1, var2) {
    if (this.bikeParts.length === 0) {
      this.bikeParts = new Array(6);
    }
    if (this.constraints.length === 0) {
      this.constraints = new Array(10);
    }
    let var4 = 0;
    let var5 = 0;
    let var6 = 0;
    let var7 = 0;
    for (let i = 0; i < 6; ++i) {
      let var8 = 0;
      switch (i) {
        case 0:
          var5 = 1;
          var4 = 360448;
          var6 = 0;
          var7 = 0;
          break;
        case 1:
          var5 = 0;
          var4 = 98304;
          var6 = 229376;
          var7 = 0;
          break;
        case 2:
          var5 = 0;
          var4 = 360448;
          var6 = -229376;
          var7 = 0;
          var8 = 21626;
          break;
        case 3:
          var5 = 1;
          var4 = 229376;
          var6 = 131072;
          var7 = 196608;
          break;
        case 4:
          var5 = 1;
          var4 = 229376;
          var6 = -131072;
          var7 = 196608;
          break;
        case 5:
          var5 = 2;
          var4 = 294912;
          var6 = 0;
          var7 = 327680;
      }
      if (!this.bikeParts[i]) {
        this.bikeParts[i] = new class_10();
      }
      this.bikeParts[i].reset();
      this.bikeParts[i].collisionRadiusF16 = GamePhysics.const175_1_half[var5];
      this.bikeParts[i].collisionShapeIndex = var5;
      this.bikeParts[i].inverseMassF16 = multiplyF16(divideF16(65536, var4), GamePhysics.massScaleF16);
      this.bikeParts[i].motoComponents[this.index01].xF16 = var1 + var6;
      this.bikeParts[i].motoComponents[this.index01].yF16 = var2 + var7;
      this.bikeParts[i].motoComponents[5].xF16 = var1 + var6;
      this.bikeParts[i].motoComponents[5].yF16 = var2 + var7;
      this.bikeParts[i].angularForceFactorF16 = var8;
    }
    for (let i = 0; i < 10; ++i) {
      if (!this.constraints[i]) {
        this.constraints[i] = new TimerOrMotoPartOrMenuElem();
      }
      this.constraints[i].resetState();
      this.constraints[i].xF16 = GamePhysics.motoParam10;
      this.constraints[i].angleF16 = GamePhysics.constraintAngleF16;
    }
    this.constraints[0].yF16 = 229376;
    this.constraints[1].yF16 = 229376;
    this.constraints[2].yF16 = 236293;
    this.constraints[3].yF16 = 236293;
    this.constraints[4].yF16 = 262144;
    this.constraints[5].yF16 = 219814;
    this.constraints[6].yF16 = 219814;
    this.constraints[7].yF16 = 185363;
    this.constraints[8].yF16 = 185363;
    this.constraints[9].yF16 = 327680;
    this.constraints[5].angleF16 = multiplyF16(GamePhysics.constraintAngleF16, 45875);
    this.constraints[6].xF16 = multiplyF16(6553, GamePhysics.motoParam10);
    this.constraints[5].xF16 = multiplyF16(6553, GamePhysics.motoParam10);
    this.constraints[9].xF16 = multiplyF16(72089, GamePhysics.motoParam10);
    this.constraints[8].xF16 = multiplyF16(72089, GamePhysics.motoParam10);
    this.constraints[7].xF16 = multiplyF16(72089, GamePhysics.motoParam10);
  }
  setRenderMinMaxX(minX, maxX) {
    this.levelLoader.setMinMaxX(minX, maxX);
  }
  processPointerReleased() {
    this.isInputUp = false;
    this.isInputDown = false;
    this.isInputRight = false;
    this.isInputLeft = false;
  }
  setInputDirection(var1, var2) {
    if (!this.isGenerateInputAI) {
      this.isInputUp = false;
      this.isInputDown = false;
      this.isInputRight = false;
      this.isInputLeft = false;
      if (var1 > 0) {
        this.isInputUp = true;
      } else if (var1 < 0) {
        this.isInputDown = true;
      }
      if (var2 > 0) {
        this.isInputRight = true;
        return;
      }
      if (var2 < 0) {
        this.isInputLeft = true;
      }
    }
  }
  enableGenerateInputAI() {
    this.resetSmth(true);
    this.isGenerateInputAI = true;
  }
  disableGenerateInputAI() {
    this.isGenerateInputAI = false;
  }
  setInputFromAI() {
    const var1 = this.bikeParts[1].motoComponents[this.index01].xF16 - this.bikeParts[2].motoComponents[this.index01].xF16;
    let var2 = this.bikeParts[1].motoComponents[this.index01].yF16 - this.bikeParts[2].motoComponents[this.index01].yF16;
    const var3 = GamePhysics.getSmthLikeMaxAbs(var1, var2);
    var2 = divideF16(var2, var3);
    this.isInputBreak = false;
    if (var2 < 0) {
      this.isInputBack = true;
      this.isInputForward = false;
    } else if (var2 > 0) {
      this.isInputForward = true;
      this.isInputBack = false;
    }
    const var4 = (this.bikeParts[2].motoComponents[this.index01].yF16 - this.bikeParts[0].motoComponents[this.index01].yF16 > 0 ? 1 : -1) * (this.bikeParts[2].motoComponents[this.index01].velocityXF16 - this.bikeParts[0].motoComponents[this.index01].velocityXF16 > 0 ? 1 : -1) > 0;
    if ((!var4 || !this.isInputForward) && (var4 || !this.isInputBack)) {
      this.isInputAcceleration = false;
    } else {
      this.isInputAcceleration = true;
    }
  }
  updateBikeControl() {
    if (!this.isCrashed) {
      let var1 = this.bikeParts[1].motoComponents[this.index01].xF16 - this.bikeParts[2].motoComponents[this.index01].xF16;
      let var2 = this.bikeParts[1].motoComponents[this.index01].yF16 - this.bikeParts[2].motoComponents[this.index01].yF16;
      const var3 = GamePhysics.getSmthLikeMaxAbs(var1, var2);
      var1 = divideF16(var1, var3);
      var2 = divideF16(var2, var3);
      if (this.isInputAcceleration && this.wheelTorqueF16 >= -GamePhysics.motoParam4) {
        this.wheelTorqueF16 -= GamePhysics.motoParam5;
      }
      if (this.isInputBreak) {
        this.wheelTorqueF16 = 0;
        this.bikeParts[1].motoComponents[this.index01].angularVelocityF16 = multiplyF16(this.bikeParts[1].motoComponents[this.index01].angularVelocityF16, 65536 - GamePhysics.motoParam6);
        this.bikeParts[2].motoComponents[this.index01].angularVelocityF16 = multiplyF16(this.bikeParts[2].motoComponents[this.index01].angularVelocityF16, 65536 - GamePhysics.motoParam6);
        if (this.bikeParts[1].motoComponents[this.index01].angularVelocityF16 < 6553) {
          this.bikeParts[1].motoComponents[this.index01].angularVelocityF16 = 0;
        }
        if (this.bikeParts[2].motoComponents[this.index01].angularVelocityF16 < 6553) {
          this.bikeParts[2].motoComponents[this.index01].angularVelocityF16 = 0;
        }
      }
      this.bikeParts[0].inverseMassF16 = multiplyF16(11915, GamePhysics.massScaleF16);
      this.bikeParts[0].inverseMassF16 = multiplyF16(11915, GamePhysics.massScaleF16);
      this.bikeParts[4].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
      this.bikeParts[3].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
      this.bikeParts[1].inverseMassF16 = multiplyF16(43690, GamePhysics.massScaleF16);
      this.bikeParts[2].inverseMassF16 = multiplyF16(11915, GamePhysics.massScaleF16);
      this.bikeParts[5].inverseMassF16 = multiplyF16(14563, GamePhysics.massScaleF16);
      if (this.isInputBack) {
        this.bikeParts[0].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
        this.bikeParts[4].inverseMassF16 = multiplyF16(14563, GamePhysics.massScaleF16);
        this.bikeParts[3].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
        this.bikeParts[1].inverseMassF16 = multiplyF16(43690, GamePhysics.massScaleF16);
        this.bikeParts[2].inverseMassF16 = multiplyF16(10082, GamePhysics.massScaleF16);
      } else if (this.isInputForward) {
        this.bikeParts[0].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
        this.bikeParts[4].inverseMassF16 = multiplyF16(18724, GamePhysics.massScaleF16);
        this.bikeParts[3].inverseMassF16 = multiplyF16(14563, GamePhysics.massScaleF16);
        this.bikeParts[1].inverseMassF16 = multiplyF16(26214, GamePhysics.massScaleF16);
        this.bikeParts[2].inverseMassF16 = multiplyF16(11915, GamePhysics.massScaleF16);
      }
      if (this.isInputBack || this.isInputForward) {
        const var4 = -var2;
        let var6;
        let var7;
        let var8;
        let var9;
        let var10;
        let var11;
        if (this.isInputBack && this.rotationSpeedF16 > -GamePhysics.motoParam9) {
          var6 = 65536;
          if (this.rotationSpeedF16 < 0) {
            var6 = divideF16(GamePhysics.motoParam9 - abs(this.rotationSpeedF16), GamePhysics.motoParam9);
          }
          var7 = multiplyF16(GamePhysics.motoParam8, var6);
          var8 = multiplyF16(var4, var7);
          var9 = multiplyF16(var1, var7);
          var10 = multiplyF16(var1, var7);
          var11 = multiplyF16(var2, var7);
          if (this.riderPoseBlendF16 > 32768) {
            this.riderPoseBlendF16 = this.riderPoseBlendF16 - 1638 < 0 ? 0 : this.riderPoseBlendF16 - 1638;
          } else {
            this.riderPoseBlendF16 = this.riderPoseBlendF16 - 3276 < 0 ? 0 : this.riderPoseBlendF16 - 3276;
          }
          this.bikeParts[4].motoComponents[this.index01].velocityXF16 -= var8;
          this.bikeParts[4].motoComponents[this.index01].velocityYF16 -= var9;
          this.bikeParts[3].motoComponents[this.index01].velocityXF16 += var8;
          this.bikeParts[3].motoComponents[this.index01].velocityYF16 += var9;
          this.bikeParts[5].motoComponents[this.index01].velocityXF16 -= var10;
          this.bikeParts[5].motoComponents[this.index01].velocityYF16 -= var11;
        }
        if (this.isInputForward && this.rotationSpeedF16 < GamePhysics.motoParam9) {
          var6 = 65536;
          if (this.rotationSpeedF16 > 0) {
            var6 = divideF16(GamePhysics.motoParam9 - this.rotationSpeedF16, GamePhysics.motoParam9);
          }
          var7 = multiplyF16(GamePhysics.motoParam8, var6);
          var8 = multiplyF16(var4, var7);
          var9 = multiplyF16(var1, var7);
          var10 = multiplyF16(var1, var7);
          var11 = multiplyF16(var2, var7);
          if (this.riderPoseBlendF16 > 32768) {
            this.riderPoseBlendF16 = this.riderPoseBlendF16 + 1638 < 65536 ? this.riderPoseBlendF16 + 1638 : 65536;
          } else {
            this.riderPoseBlendF16 = this.riderPoseBlendF16 + 3276 < 65536 ? this.riderPoseBlendF16 + 3276 : 65536;
          }
          this.bikeParts[4].motoComponents[this.index01].velocityXF16 += var8;
          this.bikeParts[4].motoComponents[this.index01].velocityYF16 += var9;
          this.bikeParts[3].motoComponents[this.index01].velocityXF16 -= var8;
          this.bikeParts[3].motoComponents[this.index01].velocityYF16 -= var9;
          this.bikeParts[5].motoComponents[this.index01].velocityXF16 += var10;
          this.bikeParts[5].motoComponents[this.index01].velocityYF16 += var11;
        }
        return;
      }
      if (this.riderPoseBlendF16 < 26214) {
        this.riderPoseBlendF16 += 3276;
        return;
      }
      if (this.riderPoseBlendF16 > 39321) {
        this.riderPoseBlendF16 -= 3276;
        return;
      }
      this.riderPoseBlendF16 = 32768;
    }
  }
  updatePhysics() {
    this.isInputAcceleration = this.isInputUp;
    this.isInputBreak = this.isInputDown;
    this.isInputBack = this.isInputLeft;
    this.isInputForward = this.isInputRight;
    if (this.isGenerateInputAI) {
      this.setInputFromAI();
    }
    GameCanvas.advanceFlagAnimation();
    this.updateBikeControl();
    const var1 = this.solvePhysicsStep(GamePhysics.physicsStepCount);
    if (var1 !== 5 && !this.isRiderDown) {
      if (this.isCrashed) {
        return 3;
      }
      if (this.isTrackStarted()) {
        this.isTrackFinished = false;
        return 4;
      }
      return var1;
    }
    return 5;
  }
  isTrackStarted() {
    return this.bikeParts[1].motoComponents[this.index01].xF16 < this.levelLoader.getStartX();
  }
  hasPassedFinishLine() {
    return this.bikeParts[1].motoComponents[this.index10].xF16 > this.levelLoader.getFinishX() || this.bikeParts[2].motoComponents[this.index10].xF16 > this.levelLoader.getFinishX();
  }
  solvePhysicsStep(var1) {
    const var2 = this.finishTriggerLatched;
    let var3 = 0;
    let var4 = var1;
    while (true) {
      while (var3 < var1) {
        this.stepSimulation(var4 - var3);
        const var52 = !var2 && this.hasPassedFinishLine() ? 3 : this.detectCollisionForStep(this.index10);
        if (!var2 && this.finishTriggerLatched) {
          return var52 !== 3 ? 2 : 1;
        }
        if (var52 === 0) {
          var4 = var3 + var4 >> 1;
          if (((var4 - var3) >= 0 ? var4 - var3 : -(var4 - var3)) < 65) {
            return 5;
          }
          continue;
        }
        if (var52 === 3) {
          this.finishTriggerLatched = true;
          var4 = var3 + var4 >> 1;
        } else {
          if (var52 === 1) {
            let var6 = 0;
            do {
              this.resolveCollision(this.index10);
              var6 = this.detectCollisionForStep(this.index10);
              if (var6 === 0) {
                return 5;
              }
            } while (var6 !== 2);
          }
          var3 = var4;
          var4 = var1;
          this.index01 = this.index01 === 1 ? 0 : 1;
          this.index10 = this.index10 === 1 ? 0 : 1;
        }
      }
      const var5 = multiplyF16(
        this.bikeParts[1].motoComponents[this.index01].xF16 - this.bikeParts[2].motoComponents[this.index01].xF16,
        this.bikeParts[1].motoComponents[this.index01].xF16 - this.bikeParts[2].motoComponents[this.index01].xF16
      ) + multiplyF16(
        this.bikeParts[1].motoComponents[this.index01].yF16 - this.bikeParts[2].motoComponents[this.index01].yF16,
        this.bikeParts[1].motoComponents[this.index01].yF16 - this.bikeParts[2].motoComponents[this.index01].yF16
      );
      if (var5 < 983040) {
        this.isCrashed = true;
      }
      if (var5 > 4587520) {
        this.isCrashed = true;
      }
      return 0;
    }
  }
  accumulateForces(var1) {
    for (let var42 = 0; var42 < 6; ++var42) {
      const var2 = this.bikeParts[var42];
      const var32 = var2.motoComponents[var1];
      var32.forceXF16 = 0;
      var32.forceYF16 = 0;
      var32.torqueF16 = 0;
      var32.forceYF16 -= divideF16(GamePhysics.gravityForceF16, var2.inverseMassF16);
    }
    if (!this.isCrashed) {
      this.solveConstraint(this.bikeParts[0], this.constraints[1], this.bikeParts[2], var1, 65536);
      this.solveConstraint(this.bikeParts[0], this.constraints[0], this.bikeParts[1], var1, 65536);
      this.solveConstraint(this.bikeParts[2], this.constraints[6], this.bikeParts[4], var1, 131072);
      this.solveConstraint(this.bikeParts[1], this.constraints[5], this.bikeParts[3], var1, 131072);
    }
    this.solveConstraint(this.bikeParts[0], this.constraints[2], this.bikeParts[3], var1, 65536);
    this.solveConstraint(this.bikeParts[0], this.constraints[3], this.bikeParts[4], var1, 65536);
    this.solveConstraint(this.bikeParts[3], this.constraints[4], this.bikeParts[4], var1, 65536);
    this.solveConstraint(this.bikeParts[5], this.constraints[8], this.bikeParts[3], var1, 65536);
    this.solveConstraint(this.bikeParts[5], this.constraints[7], this.bikeParts[4], var1, 65536);
    this.solveConstraint(this.bikeParts[5], this.constraints[9], this.bikeParts[0], var1, 65536);
    const var3 = this.bikeParts[2].motoComponents[var1];
    this.wheelTorqueF16 = multiplyF16(this.wheelTorqueF16, 65536 - GamePhysics.torqueDampingF16);
    var3.torqueF16 = this.wheelTorqueF16;
    if (var3.angularVelocityF16 > GamePhysics.motoParam3) {
      var3.angularVelocityF16 = GamePhysics.motoParam3;
    }
    if (var3.angularVelocityF16 < -GamePhysics.motoParam3) {
      var3.angularVelocityF16 = -GamePhysics.motoParam3;
    }
    let var4 = 0;
    let var5 = 0;
    for (let var6 = 0; var6 < 6; ++var6) {
      var4 += this.bikeParts[var6].motoComponents[var1].velocityXF16;
      var5 += this.bikeParts[var6].motoComponents[var1].velocityYF16;
    }
    var4 = divideF16(var4, 393216);
    var5 = divideF16(var5, 393216);
    let var10 = 0;
    for (let var112 = 0; var112 < 6; ++var112) {
      const var6 = this.bikeParts[var112].motoComponents[var1].velocityXF16 - var4;
      const var7 = this.bikeParts[var112].motoComponents[var1].velocityYF16 - var5;
      if ((var10 = GamePhysics.getSmthLikeMaxAbs(var6, var7)) > 1966080) {
        const var8 = divideF16(var6, var10);
        const var9 = divideF16(var7, var10);
        this.bikeParts[var112].motoComponents[var1].velocityXF16 -= var8;
        this.bikeParts[var112].motoComponents[var1].velocityYF16 -= var9;
      }
    }
    const var11 = this.bikeParts[2].motoComponents[var1].yF16 - this.bikeParts[0].motoComponents[var1].yF16 >= 0 ? 1 : -1;
    const var12 = this.bikeParts[2].motoComponents[var1].velocityXF16 - this.bikeParts[0].motoComponents[var1].velocityXF16 >= 0 ? 1 : -1;
    this.rotationSpeedF16 = var11 * var12 > 0 ? var10 : -var10;
  }
  static getSmthLikeMaxAbs(xF16, yF16) {
    const absXF16 = abs(xF16);
    const absYF16 = abs(yF16);
    let maxAbs;
    let minAbs;
    if (absYF16 >= absXF16) {
      maxAbs = absYF16;
      minAbs = absXF16;
    } else {
      maxAbs = absXF16;
      minAbs = absYF16;
    }
    return multiplyF16(64448, maxAbs) + multiplyF16(28224, minAbs);
  }
  solveConstraint(var1, var2, var3, var4, var5) {
    const var6 = var1.motoComponents[var4];
    const var7 = var3.motoComponents[var4];
    let var8 = var6.xF16 - var7.xF16;
    let var9 = var6.yF16 - var7.yF16;
    const var10 = GamePhysics.getSmthLikeMaxAbs(var8, var9);
    if (abs(var10) >= 3) {
      var8 = divideF16(var8, var10);
      var9 = divideF16(var9, var10);
      const var11 = var10 - var2.yF16;
      let var12 = multiplyF16(var8, multiplyF16(var11, var2.xF16));
      let var13 = multiplyF16(var9, multiplyF16(var11, var2.xF16));
      const var14 = var6.velocityXF16 - var7.velocityXF16;
      const var15 = var6.velocityYF16 - var7.velocityYF16;
      const var16 = multiplyF16(multiplyF16(var8, var14) + multiplyF16(var9, var15), var2.angleF16);
      var12 += multiplyF16(var8, var16);
      var13 += multiplyF16(var9, var16);
      var12 = multiplyF16(var12, var5);
      var13 = multiplyF16(var13, var5);
      var6.forceXF16 -= var12;
      var6.forceYF16 -= var13;
      var7.forceXF16 += var12;
      var7.forceYF16 += var13;
    }
  }
  integrateVelocities(var1, var2, var3) {
    for (let var7 = 0; var7 < 6; ++var7) {
      const var4 = this.bikeParts[var7].motoComponents[var1];
      const var5 = this.bikeParts[var7].motoComponents[var2];
      var5.xF16 = multiplyF16(var4.velocityXF16, var3);
      var5.yF16 = multiplyF16(var4.velocityYF16, var3);
      const var6 = multiplyF16(var3, this.bikeParts[var7].inverseMassF16);
      var5.velocityXF16 = multiplyF16(var4.forceXF16, var6);
      var5.velocityYF16 = multiplyF16(var4.forceYF16, var6);
    }
  }
  blendState(var1, var2, var3) {
    for (let var7 = 0; var7 < 6; ++var7) {
      const var4 = this.bikeParts[var7].motoComponents[var1];
      const var5 = this.bikeParts[var7].motoComponents[var2];
      const var6 = this.bikeParts[var7].motoComponents[var3];
      var4.xF16 = var5.xF16 + (var6.xF16 >> 1);
      var4.yF16 = var5.yF16 + (var6.yF16 >> 1);
      var4.velocityXF16 = var5.velocityXF16 + (var6.velocityXF16 >> 1);
      var4.velocityYF16 = var5.velocityYF16 + (var6.velocityYF16 >> 1);
    }
  }
  stepSimulation(var1) {
    this.accumulateForces(this.index01);
    this.integrateVelocities(this.index01, 2, var1);
    this.blendState(4, this.index01, 2);
    this.accumulateForces(4);
    this.integrateVelocities(4, 3, var1 >> 1);
    this.blendState(4, this.index01, 3);
    this.blendState(this.index10, this.index01, 2);
    this.blendState(this.index10, this.index10, 3);
    for (let var4 = 1; var4 <= 2; ++var4) {
      const var2 = this.bikeParts[var4].motoComponents[this.index01];
      const var3 = this.bikeParts[var4].motoComponents[this.index10];
      var3.angleF16 = var2.angleF16 + multiplyF16(var1, var2.angularVelocityF16);
      var3.angularVelocityF16 = var2.angularVelocityF16 + multiplyF16(var1, multiplyF16(this.bikeParts[var4].angularForceFactorF16, var2.torqueF16));
    }
  }
  detectCollisionForStep(var1) {
    let var2 = 2;
    const var4 = max3(this.bikeParts[1].motoComponents[var1].xF16, this.bikeParts[2].motoComponents[var1].xF16, this.bikeParts[5].motoComponents[var1].xF16);
    const var5 = min3(this.bikeParts[1].motoComponents[var1].xF16, this.bikeParts[2].motoComponents[var1].xF16, this.bikeParts[5].motoComponents[var1].xF16);
    this.levelLoader.updateVisiblePointRange(var5 - GamePhysics.const175_1_half[0], var4 + GamePhysics.const175_1_half[0], this.bikeParts[5].motoComponents[var1].yF16);
    let var6 = this.bikeParts[1].motoComponents[var1].xF16 - this.bikeParts[2].motoComponents[var1].xF16;
    const var7 = this.bikeParts[1].motoComponents[var1].yF16 - this.bikeParts[2].motoComponents[var1].yF16;
    const var8 = GamePhysics.getSmthLikeMaxAbs(var6, var7);
    var6 = divideF16(var6, var8);
    const var9 = -divideF16(var7, var8);
    const var10 = var6;
    for (let var11 = 0; var11 < 6; ++var11) {
      if (var11 !== 4 && var11 !== 3) {
        const var3 = this.bikeParts[var11].motoComponents[var1];
        if (var11 === 0) {
          var3.xF16 += var9;
          var3.yF16 += var10;
        }
        const var12 = this.levelLoader.detectCollision(var3, this.bikeParts[var11].collisionShapeIndex);
        if (var11 === 0) {
          var3.xF16 -= var9;
          var3.yF16 -= var10;
        }
        this.collisionNormalXF16 = this.levelLoader.collisionNormalXF16;
        this.collisionNormalYF16 = this.levelLoader.collisionNormalYF16;
        if (var11 === 5 && var12 !== 2) {
          this.isRiderDown = true;
        }
        if (var11 === 1 && var12 !== 2) {
          this.isTrackFinished = true;
        }
        if (var12 === 1) {
          this.collisionBodyIndex = var11;
          var2 = 1;
        } else if (var12 === 0) {
          this.collisionBodyIndex = var11;
          var2 = 0;
          break;
        }
      }
    }
    return var2;
  }
  resolveCollision(var1) {
    const var2 = this.bikeParts[this.collisionBodyIndex];
    const var3 = var2.motoComponents[var1];
    var3.xF16 += multiplyF16(this.collisionNormalXF16, 3276);
    var3.yF16 += multiplyF16(this.collisionNormalYF16, 3276);
    let var4;
    let var5;
    let var6;
    let var7;
    let var8;
    if (this.isInputBreak && (this.collisionBodyIndex === 2 || this.collisionBodyIndex === 1) && var3.angularVelocityF16 < 6553) {
      var4 = GamePhysics.tireGripF16 - GamePhysics.motoParam7;
      var5 = 13107;
      var6 = 39321;
      var7 = 26214 - GamePhysics.motoParam7;
      var8 = 26214 - GamePhysics.motoParam7;
    } else {
      var4 = GamePhysics.tireGripF16;
      var5 = GamePhysics.tireDampingF16;
      var6 = GamePhysics.tireAngularDampingF16;
      var7 = GamePhysics.motoParam1;
      var8 = GamePhysics.motoParam2;
    }
    const var9 = GamePhysics.getSmthLikeMaxAbs(this.collisionNormalXF16, this.collisionNormalYF16);
    this.collisionNormalXF16 = divideF16(this.collisionNormalXF16, var9);
    this.collisionNormalYF16 = divideF16(this.collisionNormalYF16, var9);
    const var10 = var3.velocityXF16;
    const var11 = var3.velocityYF16;
    const var12 = -(multiplyF16(var10, this.collisionNormalXF16) + multiplyF16(var11, this.collisionNormalYF16));
    const var13 = -(multiplyF16(var10, -this.collisionNormalYF16) + multiplyF16(var11, this.collisionNormalXF16));
    const var14 = multiplyF16(var4, var3.angularVelocityF16) - multiplyF16(var5, divideF16(var13, var2.collisionRadiusF16));
    const var15 = multiplyF16(var7, var13) - multiplyF16(var6, multiplyF16(var3.angularVelocityF16, var2.collisionRadiusF16));
    const var16 = -multiplyF16(var8, var12);
    const var17 = multiplyF16(-var15, -this.collisionNormalYF16);
    const var18 = multiplyF16(-var15, this.collisionNormalXF16);
    const var19 = multiplyF16(-var16, this.collisionNormalXF16);
    const var20 = multiplyF16(-var16, this.collisionNormalYF16);
    var3.angularVelocityF16 = var14;
    var3.velocityXF16 = var17 + var19;
    var3.velocityYF16 = var18 + var20;
  }
  setEnableLookAhead(value) {
    this.isEnableLookAhead = value;
  }
  setMinimalScreenWH(minWH) {
    this.lookAheadClampF16 = divideF16(multiplyF16(655360, minWH << 16), 8388608);
  }
  getCamPosX() {
    if (this.isEnableLookAhead) {
      this.camShiftX = divideF16(this.motoComponents[0].velocityXF16, 1572864) + multiplyF16(this.camShiftX, 57344);
    } else {
      this.camShiftX = 0;
    }
    this.camShiftX = this.camShiftX < this.lookAheadClampF16 ? this.camShiftX : this.lookAheadClampF16;
    this.camShiftX = this.camShiftX < -this.lookAheadClampF16 ? -this.lookAheadClampF16 : this.camShiftX;
    return this.motoComponents[0].xF16 + this.camShiftX << 2 >> 16;
  }
  getCamPosY() {
    if (this.isEnableLookAhead) {
      this.camShiftY = divideF16(this.motoComponents[0].velocityYF16, 1572864) + multiplyF16(this.camShiftY, 57344);
    } else {
      this.camShiftY = 0;
    }
    this.camShiftY = this.camShiftY < this.lookAheadClampF16 ? this.camShiftY : this.lookAheadClampF16;
    this.camShiftY = this.camShiftY < -this.lookAheadClampF16 ? -this.lookAheadClampF16 : this.camShiftY;
    return this.motoComponents[0].yF16 + this.camShiftY << 2 >> 16;
  }
  getProgressF16() {
    const var1 = this.motoComponents[1].xF16 < this.motoComponents[2].xF16 ? this.motoComponents[2].xF16 : this.motoComponents[1].xF16;
    return this.isCrashed ? this.levelLoader.getProgressF16(this.motoComponents[0].xF16) : this.levelLoader.getProgressF16(var1);
  }
  syncRenderStateFromSimulation() {
    for (let var2 = 0; var2 < 6; ++var2) {
      this.bikeParts[var2].motoComponents[5].xF16 = this.bikeParts[var2].motoComponents[this.index01].xF16;
      this.bikeParts[var2].motoComponents[5].yF16 = this.bikeParts[var2].motoComponents[this.index01].yF16;
      this.bikeParts[var2].motoComponents[5].angleF16 = this.bikeParts[var2].motoComponents[this.index01].angleF16;
    }
    this.bikeParts[0].motoComponents[5].velocityXF16 = this.bikeParts[0].motoComponents[this.index01].velocityXF16;
    this.bikeParts[0].motoComponents[5].velocityYF16 = this.bikeParts[0].motoComponents[this.index01].velocityYF16;
    this.bikeParts[2].motoComponents[5].angularVelocityF16 = this.bikeParts[2].motoComponents[this.index01].angularVelocityF16;
  }
  setMotoComponents() {
    for (let i = 0; i < 6; ++i) {
      this.motoComponents[i].xF16 = this.bikeParts[i].motoComponents[5].xF16;
      this.motoComponents[i].yF16 = this.bikeParts[i].motoComponents[5].yF16;
      this.motoComponents[i].angleF16 = this.bikeParts[i].motoComponents[5].angleF16;
    }
    this.motoComponents[0].velocityXF16 = this.bikeParts[0].motoComponents[5].velocityXF16;
    this.motoComponents[0].velocityYF16 = this.bikeParts[0].motoComponents[5].velocityYF16;
    this.motoComponents[2].angularVelocityF16 = this.bikeParts[2].motoComponents[5].angularVelocityF16;
  }
  renderEngine(gameCanvas, var2, var3) {
    const engineAngle4F16 = MathF16.atan2F16(this.motoComponents[0].xF16 - this.motoComponents[3].xF16, this.motoComponents[0].yF16 - this.motoComponents[3].yF16);
    const fenderAngle4F16 = MathF16.atan2F16(this.motoComponents[0].xF16 - this.motoComponents[4].xF16, this.motoComponents[0].yF16 - this.motoComponents[4].yF16);
    let engineXF16 = (this.motoComponents[0].xF16 >> 1) + (this.motoComponents[3].xF16 >> 1);
    let engineYF16 = (this.motoComponents[0].yF16 >> 1) + (this.motoComponents[3].yF16 >> 1);
    let fenderXF16 = (this.motoComponents[0].xF16 >> 1) + (this.motoComponents[4].xF16 >> 1);
    let fenderYF16 = (this.motoComponents[0].yF16 >> 1) + (this.motoComponents[4].yF16 >> 1);
    const var10 = -var3;
    engineXF16 += multiplyF16(var10, 65536) - multiplyF16(var2, 32768);
    engineYF16 += multiplyF16(var2, 65536) - multiplyF16(var3, 32768);
    fenderXF16 += multiplyF16(var10, 65536) - multiplyF16(var2, 117964);
    fenderYF16 += multiplyF16(var2, 65536) - multiplyF16(var3, 131072);
    gameCanvas.renderFender(fenderXF16 << 2 >> 16, fenderYF16 << 2 >> 16, fenderAngle4F16);
    gameCanvas.renderEngine(engineXF16 << 2 >> 16, engineYF16 << 2 >> 16, engineAngle4F16);
  }
  renderMotoFork(canvas) {
    canvas.setColor(128, 128, 128);
    canvas.drawLineF16(this.motoComponents[3].xF16, this.motoComponents[3].yF16, this.motoComponents[1].xF16, this.motoComponents[1].yF16);
  }
  renderWheelTires(canvas) {
    let backWheelIsThin = 1;
    let forwardWheelIsThin = 1;
    switch (GamePhysics.curentMotoLeague) {
      case 1:
        backWheelIsThin = 0;
        break;
      case 2:
      case 3:
        forwardWheelIsThin = 0;
        backWheelIsThin = 0;
    }
    canvas.drawWheelTires(this.motoComponents[2].xF16 << 2 >> 16, this.motoComponents[2].yF16 << 2 >> 16, backWheelIsThin);
    canvas.drawWheelTires(this.motoComponents[1].xF16 << 2 >> 16, this.motoComponents[1].yF16 << 2 >> 16, forwardWheelIsThin);
  }
  renderWheelSpokes(gameCanvas) {
    const var2 = this.bikeParts[1].collisionRadiusF16;
    const xxxF16 = multiplyF16(var2, 58982);
    const yyyF16 = multiplyF16(var2, 45875);
    gameCanvas.setColor(0, 0, 0);
    if (Micro.isInGameMenu) {
      gameCanvas.drawCircle(this.motoComponents[1].xF16 << 2 >> 16, this.motoComponents[1].yF16 << 2 >> 16, var2 + var2 << 2 >> 16);
      gameCanvas.drawCircle(this.motoComponents[1].xF16 << 2 >> 16, this.motoComponents[1].yF16 << 2 >> 16, xxxF16 + xxxF16 << 2 >> 16);
      gameCanvas.drawCircle(this.motoComponents[2].xF16 << 2 >> 16, this.motoComponents[2].yF16 << 2 >> 16, var2 + var2 << 2 >> 16);
      gameCanvas.drawCircle(this.motoComponents[2].xF16 << 2 >> 16, this.motoComponents[2].yF16 << 2 >> 16, yyyF16 + yyyF16 << 2 >> 16);
    }
    let var6 = 0;
    let angle = this.motoComponents[1].angleF16;
    let cosF16 = MathF16.cosF16(angle);
    let sinF16 = MathF16.sinF16(angle);
    let dxF16 = multiplyF16(cosF16, xxxF16) + multiplyF16(-sinF16, var6);
    let dyF16 = multiplyF16(sinF16, xxxF16) + multiplyF16(cosF16, var6);
    angle = 82354;
    cosF16 = MathF16.cosF16(82354);
    sinF16 = MathF16.sinF16(angle);
    for (let i = 0; i < 5; ++i) {
      gameCanvas.drawLineF16(this.motoComponents[1].xF16, this.motoComponents[1].yF16, this.motoComponents[1].xF16 + dxF16, this.motoComponents[1].yF16 + dyF16);
      const var10 = dxF16;
      dxF16 = multiplyF16(cosF16, dxF16) + multiplyF16(-sinF16, dyF16);
      dyF16 = multiplyF16(sinF16, var10) + multiplyF16(cosF16, dyF16);
    }
    var6 = 0;
    angle = this.motoComponents[2].angleF16;
    cosF16 = MathF16.cosF16(angle);
    sinF16 = MathF16.sinF16(angle);
    dxF16 = multiplyF16(cosF16, xxxF16) + multiplyF16(-sinF16, var6);
    dyF16 = multiplyF16(sinF16, xxxF16) + multiplyF16(cosF16, var6);
    angle = 82354;
    cosF16 = MathF16.cosF16(82354);
    sinF16 = MathF16.sinF16(angle);
    for (let i = 0; i < 5; ++i) {
      gameCanvas.drawLineF16(this.motoComponents[2].xF16, this.motoComponents[2].yF16, this.motoComponents[2].xF16 + dxF16, this.motoComponents[2].yF16 + dyF16);
      const var10 = dxF16;
      dxF16 = multiplyF16(cosF16, dxF16) + multiplyF16(-sinF16, dyF16);
      dyF16 = multiplyF16(sinF16, var10) + multiplyF16(cosF16, dyF16);
    }
    if (GamePhysics.curentMotoLeague > 0) {
      gameCanvas.setColor(255, 0, 0);
      if (GamePhysics.curentMotoLeague > 2) {
        gameCanvas.setColor(100, 100, 255);
      }
      gameCanvas.drawCircle(this.motoComponents[2].xF16 << 2 >> 16, this.motoComponents[2].yF16 << 2 >> 16, 4);
      gameCanvas.drawCircle(this.motoComponents[1].xF16 << 2 >> 16, this.motoComponents[1].yF16 << 2 >> 16, 4);
    }
  }
  renderSmth(gameCanvas, var2, var3, var4, var5) {
    let var6 = 0;
    let var7 = 65536;
    const var8 = this.motoComponents[0].xF16;
    const var9 = this.motoComponents[0].yF16;
    let x6F16 = 0;
    let y6F16 = 0;
    let xF16 = 0;
    let yF16 = 0;
    let var14 = 0;
    let var15 = 0;
    let x2F16 = 0;
    let y2F16 = 0;
    let x3F16 = 0;
    let y3F16 = 0;
    let x4F16 = 0;
    let y4F16 = 0;
    let circleXF16 = 0;
    let circleYF16 = 0;
    let x5F16 = 0;
    let y5F16 = 0;
    let var27 = [];
    let var28 = [];
    let var29 = [];
    if (this.isRenderDriverWithSprites) {
      if (this.riderPoseBlendF16 < 32768) {
        var28 = this.hardcodedArr2;
        var29 = this.hardcodedArr1;
        var7 = multiplyF16(this.riderPoseBlendF16, 131072);
      } else if (this.riderPoseBlendF16 > 32768) {
        var6 = 1;
        var28 = this.hardcodedArr1;
        var29 = this.hardcodedArr3;
        var7 = multiplyF16(this.riderPoseBlendF16 - 32768, 131072);
      } else {
        var27 = this.hardcodedArr1;
      }
    } else if (this.riderPoseBlendF16 < 32768) {
      var28 = this.hardcodedArr5;
      var29 = this.hardcodedArr4;
      var7 = multiplyF16(this.riderPoseBlendF16, 131072);
    } else if (this.riderPoseBlendF16 > 32768) {
      var6 = 1;
      var28 = this.hardcodedArr4;
      var29 = this.hardcodedArr6;
      var7 = multiplyF16(this.riderPoseBlendF16 - 32768, 131072);
    } else {
      var27 = this.hardcodedArr4;
    }
    for (let var30 = 0; var30 < this.hardcodedArr1.length; ++var30) {
      let var31;
      let var32;
      if (var28.length !== 0) {
        var32 = multiplyF16(var28[var30][0], 65536 - var7) + multiplyF16(var29[var30][0], var7);
        var31 = multiplyF16(var28[var30][1], 65536 - var7) + multiplyF16(var29[var30][1], var7);
      } else {
        var32 = var27[var30][0];
        var31 = var27[var30][1];
      }
      const xxF16 = var8 + multiplyF16(var4, var32) + multiplyF16(var2, var31);
      const yyF16 = var9 + multiplyF16(var5, var32) + multiplyF16(var3, var31);
      switch (var30) {
        case 0:
          x2F16 = xxF16;
          y2F16 = yyF16;
          break;
        case 1:
          x3F16 = xxF16;
          y3F16 = yyF16;
          break;
        case 2:
          x4F16 = xxF16;
          y4F16 = yyF16;
          break;
        case 3:
          circleXF16 = xxF16;
          circleYF16 = yyF16;
          break;
        case 4:
          x5F16 = xxF16;
          y5F16 = yyF16;
          break;
        case 5:
          xF16 = xxF16;
          yF16 = yyF16;
          break;
        case 6:
          var14 = xxF16;
          var15 = yyF16;
          break;
        case 7:
          x6F16 = xxF16;
          y6F16 = yyF16;
      }
    }
    const var26 = multiplyF16(this.riderPoseBlendTable[var6][0], 65536 - var7) + multiplyF16(this.riderPoseBlendTable[var6 + 1][0], var7);
    if (this.isRenderDriverWithSprites) {
      gameCanvas.renderBodyPart(xF16 << 2, yF16 << 2, x2F16 << 2, y2F16 << 2, 1);
      gameCanvas.renderBodyPart(x2F16 << 2, y2F16 << 2, x3F16 << 2, y3F16 << 2, 1);
      gameCanvas.renderBodyPart(x3F16 << 2, y3F16 << 2, x4F16 << 2, y4F16 << 2, 2, var26);
      gameCanvas.renderBodyPart(x4F16 << 2, y4F16 << 2, x5F16 << 2, y5F16 << 2, 0);
      let var30 = MathF16.atan2F16(var2, var3);
      if (this.riderPoseBlendF16 > 32768) {
        var30 += 20588;
      }
      gameCanvas.drawHelmet(circleXF16 << 2 >> 16, circleYF16 << 2 >> 16, var30);
    } else {
      gameCanvas.setColor(0, 0, 0);
      gameCanvas.drawLineF16(xF16, yF16, x2F16, y2F16);
      gameCanvas.drawLineF16(x2F16, y2F16, x3F16, y3F16);
      gameCanvas.setColor(0, 0, 128);
      gameCanvas.drawLineF16(x3F16, y3F16, x4F16, y4F16);
      gameCanvas.drawLineF16(x4F16, y4F16, x5F16, y5F16);
      gameCanvas.drawLineF16(x5F16, y5F16, x6F16, y6F16);
      const var30 = 65536;
      gameCanvas.setColor(156, 0, 0);
      gameCanvas.drawCircle(circleXF16 << 2 >> 16, circleYF16 << 2 >> 16, var30 + var30 << 2 >> 16);
    }
    gameCanvas.setColor(0, 0, 0);
    gameCanvas.drawForthSpriteByCenter(x6F16 << 2 >> 16, y6F16 << 2 >> 16);
    gameCanvas.drawForthSpriteByCenter(var14 << 2 >> 16, var15 << 2 >> 16);
  }
  renderMotoAsLines(gameCanvas, var2, var3, var4, var5) {
    const var7 = this.motoComponents[2].xF16;
    const var8 = this.motoComponents[2].yF16;
    const var9 = var7 + multiplyF16(var4, 32768);
    const var10 = var8 + multiplyF16(var5, 32768);
    const var11 = var7 - multiplyF16(var4, 32768);
    const var12 = var8 - multiplyF16(var5, 32768);
    const var13 = this.motoComponents[0].xF16 + multiplyF16(var2, 32768);
    const var14 = this.motoComponents[0].yF16 + multiplyF16(var3, 32768);
    const var15 = var13 - multiplyF16(var2, 131072);
    const var16 = var14 - multiplyF16(var3, 131072);
    const var17 = var15 + multiplyF16(var4, 65536);
    const var18 = var16 + multiplyF16(var5, 65536);
    const var19 = var15 + multiplyF16(var2, 49152) + multiplyF16(var4, 49152);
    const var20 = var16 + multiplyF16(var3, 49152) + multiplyF16(var5, 49152);
    const var21 = var15 + multiplyF16(var4, 32768);
    const var22 = var16 + multiplyF16(var5, 32768);
    const var23 = this.motoComponents[1].xF16;
    const var24 = this.motoComponents[1].yF16;
    const var25 = this.motoComponents[4].xF16 - multiplyF16(var2, 49152);
    const var26 = this.motoComponents[4].yF16 - multiplyF16(var3, 49152);
    const var27 = var25 - multiplyF16(var4, 32768);
    const var28 = var26 - multiplyF16(var5, 32768);
    const var29 = var25 - multiplyF16(var2, 131072) + multiplyF16(var4, 16384);
    const var30 = var26 - multiplyF16(var3, 131072) + multiplyF16(var5, 16384);
    const var31 = this.motoComponents[3].xF16;
    const var32 = this.motoComponents[3].yF16;
    const var33 = var31 + multiplyF16(var4, 32768);
    const var34 = var32 + multiplyF16(var5, 32768);
    const var35 = var31 + multiplyF16(var4, 114688) - multiplyF16(var2, 32768);
    const var36 = var32 + multiplyF16(var5, 114688) - multiplyF16(var3, 32768);
    gameCanvas.setColor(50, 50, 50);
    gameCanvas.drawCircle(var21 << 2 >> 16, var22 << 2 >> 16, 32768 + 32768 << 2 >> 16);
    if (!this.isCrashed) {
      gameCanvas.drawLineF16(var9, var10, var17, var18);
      gameCanvas.drawLineF16(var11, var12, var15, var16);
    }
    gameCanvas.drawLineF16(var13, var14, var15, var16);
    gameCanvas.drawLineF16(var13, var14, var31, var32);
    gameCanvas.drawLineF16(var19, var20, var33, var34);
    gameCanvas.drawLineF16(var33, var34, var35, var36);
    if (!this.isCrashed) {
      gameCanvas.drawLineF16(var31, var32, var23, var24);
      gameCanvas.drawLineF16(var35, var36, var23, var24);
    }
    gameCanvas.drawLineF16(var17, var18, var27, var28);
    gameCanvas.drawLineF16(var19, var20, var25, var26);
    gameCanvas.drawLineF16(var25, var26, var29, var30);
    gameCanvas.drawLineF16(var27, var28, var29, var30);
  }
  renderGame(gameCanvas) {
    gameCanvas.clearScreenWithWhite();
    let xxF16 = this.motoComponents[3].xF16 - this.motoComponents[4].xF16;
    let yyF16 = this.motoComponents[3].yF16 - this.motoComponents[4].yF16;
    const maxAbs = GamePhysics.getSmthLikeMaxAbs(xxF16, yyF16);
    if (maxAbs !== 0) {
      xxF16 = divideF16(xxF16, maxAbs);
      yyF16 = divideF16(yyF16, maxAbs);
    }
    const var5 = -yyF16;
    if (this.isCrashed) {
      let var8 = this.motoComponents[4].xF16;
      let var7 = this.motoComponents[3].xF16;
      if (var7 >= var8) {
        const var9 = var7;
        var7 = var8;
        var8 = var9;
      }
      this.levelLoader.gameLevel?.setShadowProjectionRange(var7, var8);
    }
    if (LevelLoader.isEnabledPerspective) {
      this.levelLoader.renderLevel3D(gameCanvas, this.motoComponents[0].xF16, this.motoComponents[0].yF16);
    }
    if (this.isRenderMotoWithSprites) {
      this.renderEngine(gameCanvas, xxF16, yyF16);
    }
    if (!Micro.isInGameMenu) {
      this.renderWheelTires(gameCanvas);
    }
    this.renderWheelSpokes(gameCanvas);
    if (this.isRenderMotoWithSprites) {
      gameCanvas.setColor(170, 0, 0);
    } else {
      gameCanvas.setColor(50, 50, 50);
    }
    gameCanvas.drawWheelArc(this.motoComponents[1].xF16 << 2 >> 16, this.motoComponents[1].yF16 << 2 >> 16, GamePhysics.const175_1_half[0] << 2 >> 16, MathF16.atan2F16(xxF16, yyF16));
    if (!this.isCrashed) {
      this.renderMotoFork(gameCanvas);
    }
    this.renderSmth(gameCanvas, xxF16, yyF16, var5, xxF16);
    if (!this.isRenderMotoWithSprites) {
      this.renderMotoAsLines(gameCanvas, xxF16, yyF16, var5, xxF16);
    }
    this.levelLoader.renderTrackNearestLine(gameCanvas);
  }
}
export {
  GamePhysics
};

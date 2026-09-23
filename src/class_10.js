import { TimerOrMotoPartOrMenuElem } from "./TimerOrMotoPartOrMenuElem.js";
class class_10 {
  unusedBool = true;
  collisionRadiusF16 = 0;
  collisionShapeIndex = 0;
  inverseMassF16 = 0;
  angularForceFactorF16 = 0;
  motoComponents = new Array(6);
  constructor() {
    for (let var1 = 0; var1 < 6; ++var1) {
      this.motoComponents[var1] = new TimerOrMotoPartOrMenuElem();
    }
    this.reset();
  }
  reset() {
    this.collisionRadiusF16 = 0;
    this.inverseMassF16 = 0;
    this.angularForceFactorF16 = 0;
    this.unusedBool = true;
    for (let i = 0; i < 6; ++i) {
      this.motoComponents[i].resetState();
    }
  }
}
export {
  class_10
};

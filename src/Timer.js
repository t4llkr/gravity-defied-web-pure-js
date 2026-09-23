import { Time } from "./utils/Time.js";
class Timer {
  id;
  startTimeMs;
  timeoutMs;
  constructor(id, timeoutMs) {
    this.id = id;
    this.timeoutMs = timeoutMs;
    this.startTimeMs = Time.currentTimeMillis();
  }
  ready() {
    return Time.currentTimeMillis() - this.startTimeMs > this.timeoutMs;
  }
  getId() {
    return this.id;
  }
}
export {
  Timer
};

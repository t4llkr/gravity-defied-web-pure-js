class Time {
  static currentTimeMillis() {
    return Date.now();
  }
  static sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
export {
  Time
};

class Image {
  image;
  constructor(image) {
    this.image = image;
  }
  static fromSrc(src) {
    const image = new window.Image();
    image.src = src;
    return new Image(image);
  }
  static async load(src) {
    return await new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(new Image(image));
      image.onerror = () => reject(new Error(`Failed to load ${src}`));
      image.src = src;
    });
  }
  getWidth() {
    return this.image.naturalWidth || this.image.width;
  }
  getHeight() {
    return this.image.naturalHeight || this.image.height;
  }
  getElement() {
    return this.image;
  }
}
export {
  Image
};

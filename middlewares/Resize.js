const sharp = require('sharp');
const uuidv4 = require('uuidv4');
const path = require('path');

class Resize {
  constructor(folder, name) {
    this.folder = folder;
    this.userName = name;
  }
  async save(buffer) {
    const filename = this.userName + ".jpg";
    const filepath = this.filepath(filename);

    await sharp(buffer)
      .resize(1000, 1000, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .toFile(filepath);
    
    return filename;
  }
  
  filepath(filename) {
    return path.resolve(`${this.folder}/${filename}`)
  }
}

module.exports = Resize;
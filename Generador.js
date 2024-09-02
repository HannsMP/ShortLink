const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { isAbsolute, extname, dirname, resolve } = require('path');
let random = (num) => Math.floor(Math.random() * num);

class Generador {
  #characters = [
    { l: 10, v: '0123456789' },
    { l: 26, v: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
    { l: 52, v: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' }
  ];
  #limit = 13520;
  #limitTotal = 13520;

  #format = "";
  #option = [];

  #cache;
  #fileSave;
  /**
   * @param { number | string } size
   * @param {{ numeric: boolean, letters: boolean, symbol: boolean }} option 
   */
  constructor(size = 1, option = { numeric: true, letters: true, symbol: true }, fileSave) {
    if (size.constructor.name == 'Number')
      this.#format = " ".repeat(size);

    else if (size.constructor.name == 'String')
      this.#format = size;
    else
      throw new TypeError(`El parametro size no es ni un number ni un string`);

    let { numeric, symbol, letters } = option;

    this.#option = [numeric, symbol, letters];

    this.#limit = this.#limitTotal
      = this.#format.length
      * (numeric ? this.#characters[0].l : 1)
      * (symbol ? this.#characters[2].l : 1)
      * (letters ? this.#characters[1].l : 1);

    if (this.#limit == 1)
      throw new Error(`Todas las opciones son falsas, seleccion una`);

    if (!fileSave) return;

    if (typeof fileSave != 'string')
      throw new TypeError('El tipo del Directorio no es un string.');

    if (extname(fileSave).toLowerCase() != '.json')
      throw new Error('Nombre del direcctorio no válido. Asegúrese de proporcionar un nombre de direcctorio válido.');

    this.#fileSave = isAbsolute(fileSave) ? fileSave : resolve(fileSave);

    mkdirSync(dirname(this.#fileSave), { recursive: true });

    try {
      this.#cache = JSON.parse(readFileSync(this.#fileSave, 'utf-8'));
    } catch (e) {
      this.#cache = {};
    }
  }
  generate() {
    let result = this.#format
      .split("")
      .map((w) => {
        if (w != ' ')
          return w;

        let type;
        do {
          type = random(3);
        } while (!this.#option[type]);

        const { l, v } = this.#characters[type];
        return v[random(l)];
      });

    return result.join("");
  }
  exist(key) {
    return this.#cache.hasOwnProperty(key);
  }
  read(key) {
    return this.#cache[key];
  }
  create(memory) {
    if (this.#limit === 0)
      throw new Error(`Limite alcanzado`);

    let exist = true,
      key;

    while (exist) {
      key = this.generate();
      exist = this.exist(key);
    }

    this.#cache[key] = memory;
    this.#limit--;

    this.#fileSave && writeFileSync(this.#fileSave, JSON.stringify(this.#cache));

    return key;
  }
  delete(key) {
    if (!this.exist(key))
      return false;

    delete this.#cache[key];
    this.#limit++;

    this.#fileSave && writeFileSync(this.#fileSave, JSON.stringify(this.#cache));

    return true;
  }
  reset() {
    this.#cache = {};
    this.#limit = this.#limitTotal;

    this.#fileSave && writeFileSync(this.#fileSave, JSON.stringify(this.#cache));
    return true;
  }
  forEach(callback) {
    for (let key in this.#cache)
      callback(this.#cache[key], key, this.#cache);
  }
  find(callback) {
    for (let key in this.#cache) {
      let state = callback(this.#cache[key], key, this.#cache);
      if (state) return this.#cache[key];
    }
  }
  findKey(callback) {
    for (let key in this.#cache) {
      let state = callback(this.#cache[key], key, this.#cache);
      if (state) return key;
    }
  }
}

module.exports = Generador;
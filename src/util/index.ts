/**
 * Copyright (c) 2020 August
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Static class to handle any repeating code
 */
export default class Util {
  constructor() {
    throw new SyntaxError('Use the static methods, this class isn\'t avaliable to be constructed');
  }

  /**
   * Returns the seperator for the correspondant Operating System
   */
  static get sep() {
    return process.platform === 'win32' ? '\\' : '/';
  }

  /**
   * Converts a float number to a percentage string
   * @param float The float
   * @returns The percentage string
   */
  static toPercent(float: string) {
    const fl = parseFloat(float);
    return `${fl.toFixed(2)}%`;
  }

  /**
   * Joins the current directory with any other appending directories
   * @param paths The paths to conjoin
   * @returns The paths conjoined 
   */
  static getPath(...paths: string[]) {
    return `${process.cwd()}${Util.sep}${paths.join(Util.sep)}`;
  }

  /**
   * Formats any byte-integers to a humanizable string
   * @param bytes The number of bytes the file is
   */
  static formatSize(bytes: number) {
    const kilo = bytes / 1024;
    const mega = kilo / 1024;
    const giga = mega / 1024;

    if (kilo < 1024) return `${kilo.toFixed(1)}KB`;
    if (kilo > 1024 && mega < 1024) return `${mega.toFixed(1)}MB`;
    else return `${giga.toFixed(1)}GB`;
  }

  /**
   * If the OS is running Node.js 10 or higher
   */
  static isNode10() {
    const ver = process.version.split('.')[0].replace('v', '');
    const num = Number(ver);

    return num === 10 || num > 10;
  }
}
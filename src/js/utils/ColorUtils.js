'use strict';


class ColorUtils {


  /** @summary ColorUtils provides several method to abstract color manipulation for canvas
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>This class doesn't need to be instantiated, as all its methods are static in order to
   * make those utils methods available without constraints. Refer to each method for their associated documentation.</blockquote> */
  constructor() {}


  /** @method
   * @name drawRadialGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fill context with radial gradient according to options object.</blockquote>
   * @param {object} canvas - The canvas to draw radial gradient in
   * @param {object} options - Radial gradient options
   * @param {number} options.x0 - The x origin in canvas dimension
   * @param {number} options.y0 - The y origin in canvas dimension
   * @param {number} options.r0 - The radius of the start circle in Float[0,2PI]
   * @param {number} options.x1 - The x endpoint in canvas dimension
   * @param {number} options.y1 - The y endpoint in canvas dimension
   * @param {number} options.r1 - The radius of the end circle in Float[0,2PI]
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties **/
  static drawRadialGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.x0, options.y0, options.r0,
      options.x1, options.y1, options.r1
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].index, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  /** @method
   * @name drawVerticalGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fill context with vertical gradient according to options object.</blockquote>
   * @param {object} canvas - The canvas to draw vertical gradient in
   * @param {object} options - Vertical gradient options
   * @param {number} options.originX - The bar x origin in canvas dimension
   * @param {number} options.height - The bar height in canvas dimension
   * @param {number} options.width - The bar width in canvas dimension
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties **/
  static drawVerticalGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(
      0, canvas.height,
      0, 0
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].index, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(options.originX, canvas.height - options.height, options.width, options.height);
  }


  /** @method
   * @name drawRadialGlowGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fill context with radial glowing gradient according to options object.</blockquote>
   * @param {object} canvas - The canvas to draw radial glowing gradient in
   * @param {object} options - Radial glowing gradient options
   * @param {number} options.centerX - The center x origin in canvas dimension
   * @param {number} options.centerY - The center y origin in canvas dimension
   * @param {number} options.radius - The circle radius in canvas dimension
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties **/
  static drawRadialGlowGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.centerX, options.centerY, 0,
      options.centerX, options.centerY, options.radius
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].index, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  }


  /** @method
   * @name peakMeterGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fill peakmeter context with audio gradient according to options.</blockquote>
   * @param {object} canvas - The canvas to draw radial glowing gradient in
   * @param {object} options - Radial glowing gradient options
   * @param {string} options.orientation - The peak meter orientation (<code>vertical</code> or <code>horizontal</code>)
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties **/
  static peakMeterGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    let gradient = null;

    if (options.orientation === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    } else if (options.orientation === 'vertical') {
      gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    } else {
      return;
    }

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].center, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  }


  /** @method
   * @name lightenDarkenColor
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Lighten or darken a given color from an amount. Inspired from https://jsfiddle.net/gabrieleromanato/hrJ4X/</blockquote>
   * @param {string} color - The color to alter in Hex/RGB/HSL
   * @param {number} amount - The percentage amount to lighten or darken in Float[-100,100]
   * @return {string} The altered color in Hex/RGB/HSL **/
  static lightenDarkenColor(color, amount) {
    let usePound = false;
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }

    amount += 16;
    const num = parseInt(color, 16);
    // Red channel bounding
    let r = (num >> 16) + amount;
    if (r > 255) {
      r = 255;
    } else if (r < 0) {
      r = 0;
    }
    // Blue channel bounding
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) {
      b = 255;
    } else if (b < 0) {
      b = 0;
    }
    // Green channel bounding
    let g = (num & 0x0000FF) + amount;
    if (g > 255) {
      g = 255;
    } else if (g < 0) {
      g = 0;
    }

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }


  static _alphaColor(color, alpha) {
    const num = parseInt(color, 16);
    return `rgba(${num >> 16}, ${(num >> 8) & 0x00FF}, ${num & 0x0000FF}, ${alpha})`;
  }


  /** @method
   * @name rainbowGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Return a vertical or horizontal rainbow gradient.</blockquote>
   * @param {object} canvas - The canvas to create gradient from
   * @param {boolean} [vertical=false] - The gradient orientation, default to horizontal
   * @return {object} The rainbow gradient to apply **/
  static rainbowGradient(canvas, vertical = false) {
    const ctx = canvas.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    if (vertical === true) {
      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    }
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1 / 7, 'orange');
    gradient.addColorStop(2 / 7, 'yellow');
    gradient.addColorStop(3 / 7, 'green');
    gradient.addColorStop(4 / 7, 'blue');
    gradient.addColorStop(5 / 7, 'indigo');
    gradient.addColorStop(6 / 7, 'violet');
    gradient.addColorStop(1, 'red');
    return gradient;
  }


  /** @public
   * @static
   * @member {string} - The default background color, #1D1E25 */
  static get defaultBackgroundColor() {
    return '#1D1E25';
  }


  /** @public
   * @static
   * @member {string} - The default text color, #E7E9E7 */
  static get defaultTextColor() {
    return '#E7E9E7';
  }


  /** @public
   * @static
   * @member {string} - The default primary color, #56D45B */
  static get defaultPrimaryColor() {
    return '#56D45B';
  }


  /** @public
   * @static
   * @member {string} - The default anti primary color, #FF6B67 */
  static get defaultAntiPrimaryColor() {
    return '#FF6B67';
  }


  /** @public
   * @static
   * @member {string} - The default dark primary color, #12B31D */
  static get defaultDarkPrimaryColor() {
    return '#12B31D';
  }


  /** @public
   * @static
   * @member {string} - The default dark primary color, #FFAD67 */
  static get defaultLoopColor() {
    return '#FFAD67';
  }


  /** @public
   * @static
   * @member {string} - The default dark primary color, #FFAD67 */
  static get defaultLoopAlphaColor() {
    return this._alphaColor('FFAD67', '.5');
  }


  /** @public
   * @static
   * @member {string[]} - The default color array to be used in gradient, <code>['#56D45B', '#AFF2B3', '#FFAD67', '#FF6B67', '#FFBAB8']</code> */
  static get defaultAudioGradient() {
    // Green, Light Green, Orange, Red, Light Red
    return ['#56D45B', '#AFF2B3', '#FFAD67', '#FF6B67', '#FFBAB8'];
  }


};


export default ColorUtils;

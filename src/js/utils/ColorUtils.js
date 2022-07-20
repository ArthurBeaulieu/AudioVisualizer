class ColorUtils {


  /** @summary ColorUtils provides several method to abstract color manipulation for canvas
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>This class doesn't need to be instantiated, as all its methods are static in order to
   * make those utils methods available without constraints. Refer to each method for their associated documentation.</blockquote> */
  constructor() {}


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  --------------------------------------------  GRADIENT METHOD  -----------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


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
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('ColorUtils.drawRadialGradient : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('ColorUtils.drawRadialGradient : Invalid type for canvas or options');
    }
    // Test if options.colors is properly formed
    if (!options.colors || !Array.isArray(options.colors)) {
      return new Error('ColorUtils.drawRadialGradient : Options object is not properly formed');
    }
    // Test if sent colors if properly formed of color/index objects
    for (let i = 0; i < options.colors.length; ++i) {
      if (options.colors[i].index === undefined || options.colors[i].index === null || typeof options.colors[i].index !== 'number' || options.colors[i].color === undefined || options.colors[i].color === null || typeof options.colors[i].color !== 'string') {
        return new Error('ColorUtils.drawRadialGradient : Invalid type for a color sent in options object');
      } else {
        // Test tha index is in [0,1]
        if (options.colors[i].index < 0 || options.colors[i].index > 1) {
          return new Error('ColorUtils.drawRadialGradient : An index sent in options object is not a valid float in [0, 1]');
        }
      }
    }
    // Test if options contains other mandatory args (origin)
    if ((options.x0 === undefined || options.x0 === null) || (options.y0 === undefined || options.y0 === null) || (options.r0 === undefined || options.r0 === null)) {
      return new Error('ColorUtils.drawRadialGradient : Missing arguments options.x0 or options.y0 or options.r0');
    }
    // Test mandatory arguments proper types (origin)
    if (typeof options.x0 !== 'number' || typeof options.y0 !== 'number' || typeof options.r0 !== 'number') {
      return new Error('ColorUtils.drawRadialGradient : Invalid type for options.x0 or options.y0 or options.r0');
    }
    // Test if options contains other mandatory args (destination)
    if ((options.x1 === undefined || options.x1 === null) || (options.y1 === undefined || options.y1 === null) || (options.r1 === undefined || options.r1 === null)) {
      return new Error('ColorUtils.drawRadialGradient : Missing arguments options.x1 or options.y1 or options.r1');
    }
    // Test mandatory arguments proper types (destination)
    if (typeof options.x1 !== 'number' || typeof options.y1 !== 'number' || typeof options.r1 !== 'number') {
      return new Error('ColorUtils.drawRadialGradient : Invalid type for options.x1 or options.y1 or options.r1');
    }
    // Perform method purpose
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
   * @name radialGlowGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Returns a radial glowing gradient according to options object.</blockquote>
   * @param {object} canvas - The canvas to draw radial glowing gradient in
   * @param {object} options - Radial glowing gradient options
   * @param {number} options.centerX - The center x origin in canvas dimension
   * @param {number} options.centerY - The center y origin in canvas dimension
   * @param {number} options.radius - The circle radius in canvas dimension
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties
   * @return {object} The radial glowing gradient to apply **/
  static radialGlowGradient(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('ColorUtils.radialGlowGradient : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('ColorUtils.radialGlowGradient : Invalid type for canvas or options');
    }
    // Test if options.colors is properly formed
    if (!options.colors || !Array.isArray(options.colors)) {
      return new Error('ColorUtils.radialGlowGradient : Options object is not properly formed');
    }
    // Test if sent colors if properly formed of color/index objects
    for (let i = 0; i < options.colors.length; ++i) {
      if (options.colors[i].index === undefined || options.colors[i].index === null || typeof options.colors[i].index !== 'number' || options.colors[i].color === undefined || options.colors[i].color === null || typeof options.colors[i].color !== 'string') {
        return new Error('ColorUtils.radialGlowGradient : Invalid type for a color sent in options object');
      } else {
        // Test tha index is in [0,1]
        if (options.colors[i].index < 0 || options.colors[i].index > 1) {
          return new Error('ColorUtils.radialGlowGradient : An index sent in options object is not a valid float in [0, 1]');
        }
      }
    }
    // Test if options contains other mandatory args
    if ((options.centerX === undefined || options.centerX === null) || (options.centerY === undefined || options.centerY === null) || (options.radius === undefined || options.radius === null)) {
      return new Error('ColorUtils.radialGlowGradient : Missing arguments options.centerX or options.centerY or options.radius');
    }
    // Test mandatory arguments proper types
    if (typeof options.centerX !== 'number' || typeof options.centerY !== 'number' || typeof options.radius !== 'number') {
      return new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius');
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.centerX, options.centerY, 0,
      options.centerX, options.centerY, options.radius
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].index, options.colors[i].color);
    }

    return gradient;
  }


  /** @method
   * @name linearGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2021
   * @description <blockquote>Returns a linear gradient according to options object.</blockquote>
   * @param {object} canvas - The canvas to draw radial glowing gradient in
   * @param {object} options - Linear gradient options
   * @param {boolean} [options.vertical] - Draw the gradient vertically
   * @param {object[]} options.colors - The color gradient, must be objects with color (in Hex or css colors) and index (in Float[0,1]) properties
   * @return {object} The linear gradient to apply **/
  static linearGradient(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('ColorUtils.linearGradient : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('ColorUtils.linearGradient : Invalid type for canvas or options');
    }
    // Test if options.colors is properly formed
    if (!options.colors || !Array.isArray(options.colors)) {
      return new Error('ColorUtils.linearGradient : Options object is not properly formed');
    }
    // Test if sent colors if properly formed of color/index objects
    for (let i = 0; i < options.colors.length; ++i) {
      if (options.colors[i].index === undefined || options.colors[i].index === null || typeof options.colors[i].index !== 'number' || options.colors[i].color === undefined || options.colors[i].color === null || typeof options.colors[i].color !== 'string') {
        return new Error('ColorUtils.linearGradient : Invalid type for a color sent in options object');
      } else {
        // Test tha index is in [0,1]
        if (options.colors[i].index < 0 || options.colors[i].index > 1) {
          return new Error('ColorUtils.linearGradient : An index sent in options object is not a valid float in [0, 1]');
        }
      }
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    if (options.vertical === true) {
      gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    }

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].index, options.colors[i].color);
    }

    return gradient;
  }


  /** @method
   * @name rainbowLinearGradient
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Returns a vertical or horizontal rainbow gradient.</blockquote>
   * @param {object} canvas - The canvas to create gradient from
   * @param {boolean} [vertical=false] - The gradient orientation, default to horizontal
   * @return {object} The rainbow gradient to apply **/
  static rainbowLinearGradient(canvas, vertical = false) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null)) {
      return new Error('ColorUtils.rainbowLinearGradient : Missing arguments canvas');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof vertical !== 'boolean') {
      return new Error('ColorUtils.rainbowLinearGradient : Invalid type for canvas or vertical');
    }
    // Perform method purpose
    return ColorUtils.linearGradient(canvas, {
      vertical: vertical,
      colors: [{
        color: 'red',
        index: 0
      }, {
        color: 'orange',
        index: 1 / 7
      }, {
        color: 'yellow',
        index: 2 / 7
      }, {
        color: 'green',
        index: 3 / 7
      }, {
        color: 'blue',
        index: 4 / 7
      }, {
        color: 'indigo',
        index: 5 / 7
      }, {
        color: 'violet',
        index: 6 / 7
      }, {
        color: 'red',
        index: 1
      }]
    });
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  ---------------------------------------  COLOR MANIPULATION METHOD  ------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name lightenDarkenColor
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Lighten or darken a given color from an amount. Inspired from https://jsfiddle.net/gabrieleromanato/hrJ4X/</blockquote>
   * @param {string} color - The color to alter in Hex
   * @param {number} amount - The percentage amount to lighten or darken in Float[-100,100]
   * @return {string} The altered color in Hex **/
  static lightenDarkenColor(color, amount) {
    // Test that caller sent mandatory arguments
    if ((color === undefined || color === null) || (amount === undefined || amount === null)) {
      return new Error('ColorUtils.lightenDarkenColor : Missing arguments color or amount');
    }
    // Test those arguments proper types
    if (typeof color !== 'string' || typeof amount !== 'number') {
      return new Error('ColorUtils.lightenDarkenColor : Invalid type for color or amount');
    }
    // Pound color value to remove # char and memorize it had one
    let usePound = false;
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }
    // Test that color is an hex code
    if (!/^[a-fA-F0-9]+$/i.test(color)) {
      return new Error('ColorUtils.lightenDarkenColor : Color is not a valid hexadecimal value');
    }
    // Check that alpha value is properly bounded to [0, 1]
    if (amount < -100 || amount > 100) {
      return new Error('ColorUtils.lightenDarkenColor : Amount is not a valid float in [-100, 100]');
    }

    if (amount === 0) {
      return (usePound ? '#' : '') + color.toLowerCase();
    }

    if (amount > 0) {
      amount += 16;
    } else {
       amount -= 16;
    }
    // Perform method purpose
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
    // Format returned hex value
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }


  /** @method
   * @name alphaColor
   * @public
   * @memberof ColorUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Add transparency on an existing color.</blockquote>
   * @param {string} color - The color to make transparent in Hex
   * @param {number} alpha - The amount of transparency applied on color in Float[0,1]
   * @return {string} The transparent color in rgba **/
  static alphaColor(color, alpha) {
    // Test that caller sent mandatory arguments
    if ((color === undefined || color === null) || (alpha === undefined || alpha === null)) {
      return new Error('ColorUtils.alphaColor : Missing arguments color or alpha');
    }
    // Test those arguments proper types
    if (typeof color !== 'string' || typeof alpha !== 'number') {
      return new Error('ColorUtils.alphaColor : Invalid type for color or alpha');
    }
    // Remove # symbol if any on color value
    if (color[0] === '#') {
      color = color.slice(1);
    }
    // Test that color is an hex code
    if (!/^[a-fA-F0-9]+$/i.test(color)) {
      return new Error('ColorUtils.alphaColor : Color is not a valid hexadecimal value');
    }
    // Check that alpha value is properly bounded to [0, 1]
    if (alpha < 0 || alpha > 1) {
      return new Error('ColorUtils.alphaColor : Alpha is not a valid float in [0, 1]');
    }
    // Perform method purpose
    const num = parseInt(color, 16);
    return `rgba(${num >> 16}, ${(num >> 8) & 0x00FF}, ${num & 0x0000FF}, ${alpha})`;
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  ------------------------------------  COMPONENT DEFAULT COLORS METHOD  ---------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


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
    return this.alphaColor('FFAD67', 0.5);
  }


  /** @public
   * @static
   * @member {string[]} - The default color array to be used in gradient, <code>['#56D45B', '#AFF2B3', '#FFAD67', '#FF6B67', '#FFBAB8']</code> */
  static get defaultAudioGradient() {
    return [
      { color: '#56D45B', index: 0 }, // Green
      { color: '#AFF2B3', index: 0.7 }, // Light Green
      { color: '#FFAD67', index: 0.833 }, // Orange
      { color: '#FF6B67', index: 0.9 }, // Red
      { color: '#FFBAB8', index: 1 } // Light Red
    ];
  }


}


export default ColorUtils;

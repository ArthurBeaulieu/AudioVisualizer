import ColorUtils from './ColorUtils.js';


class CanvasUtils {


  /** @summary CanvasUtils provides several method to manipulate basic geometries in canvas
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>This class doesn't need to be instantiated, as all its methods are static in order to
   * make those utils methods available with constraints. Refer to each method for their associated documentation.</blockquote> */
  constructor() {}


  /** @method
   * @name drawRadialBar
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a radial bar with its height and color being computed from the frequency intensity.</blockquote>
   * @param {object} canvas - The canvas to draw radial bar in
   * @param {object} options - Radial bar options
   * @param {object} options.frequencyValue - The frequency value in Int[0,255]
   * @param {number} options.x0 - The x origin in canvas dimension
   * @param {number} options.y0 - The y origin in canvas dimension
   * @param {number} options.x1 - The x endpoint in canvas dimension
   * @param {number} options.y1 - The y endpoint in canvas dimension
   * @param {number} options.width - The bar line width in N
   * @param {string} options.color - The bar base color (will be lighten/darken according to frequency value) in Hex/RGB/HSL **/
  static drawRadialBar(canvas, options) {
    const ctx = canvas.getContext('2d');
    let amount = options.frequencyValue / 255;
    // Draw on canvas context
    ctx.beginPath();
    ctx.moveTo(options.x0, options.y0);
    ctx.lineTo(options.x1, options.y1);
    ctx.strokeStyle = ColorUtils.lightenDarkenColor(options.color, amount * 100);
    ctx.lineWidth = options.width;
    ctx.stroke();
    ctx.closePath();
  }


  /** @method
   * @name drawCircle
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a circle in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw circle in
   * @param {object} options - Circle options
   * @param {number} options.centerX - The circle x origin in canvas dimension
   * @param {number} options.centerY - The circle y origin in canvas dimension
   * @param {number} options.radius - The circle radius
   * @param {number} options.radStart - The rotation start angle in rad
   * @param {number} options.radEnd - The rotation end angle in rad
   * @param {number} options.width - The circle line width in N
   * @param {string} options.color - The circle color in Hex/RGB/HSL **/
  static drawCircle(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ctx.lineWidth = options.width;
    ctx.strokeStyle = options.color;
    ctx.stroke();
    ctx.closePath();
  }


  /** @method
   * @name drawCircleGlow
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a circle with glow effect made with radial gradients in inner and outer circle.</blockquote>
   * @param {object} canvas - The canvas to draw circle glow in
   * @param {object} options - Circle glow options
   * @param {number} options.centerX - The circle x origin in canvas dimension
   * @param {number} options.centerY - The circle y origin in canvas dimension
   * @param {number} options.radius - The circle radius
   * @param {number} options.radStart - The rotation start angle in rad
   * @param {number} options.radEnd - The rotation end angle in rad
   * @param {number} options.width - The circle line width in N
   * @param {object[]} options.colors - the glow color, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1], 0.5 being the circle line) properties  **/
  static drawCircleGlow(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ctx.fillStyle = ColorUtils.radialGlowGradient(canvas, options);
    ctx.fill();
    ctx.closePath();
  }


  /** @method
   * @name drawDisc
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a disc in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Disc options
   * @param {number} options.centerX - The circle x origin in canvas dimension
   * @param {number} options.centerY - The circle y origin in canvas dimension
   * @param {number} options.radius - The circle radius
   * @param {number} options.radStart - The rotation start angle in rad
   * @param {number} options.radEnd - The rotation end angle in rad
   * @param {string} options.color - The circle color in Hex/RGB/HSL **/
  static drawDisc(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ctx.fillStyle = options.color;
    ctx.fill();
    ctx.closePath();
  }


  /** @method
   * @name drawVerticalBar
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a disc vertical bar in given canvas with given gradient.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Vertical bar options
   * @param {number} options.originX - The x origin in canvas dimension
   * @param {number} options.height - The height of the frequency bin in canvas dimension
   * @param {number} options.width - The width of the frequency bin in canvas dimension
   * @param {object[]} options.colors - the gradient colors, must be objects with color and index (in Float[0,1]) properties **/
  static drawVerticalBar(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillRect(options.originX, canvas.height - options.height, options.width, options.height);
    options.vertical = true; // Enforce vertical gradient
    ctx.fillStyle = ColorUtils.linearGradient(canvas, options);
    ctx.fillRect(options.originX, canvas.height - options.height, options.width, options.height);
    ctx.closePath();
  }


  /** @method
   * @name drawOscilloscope
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw an oscilloscope of frequencies in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Oscilloscope options
   * @param {number} options.samples - The x origin in canvas dimension
   * @param {number} options.timeDomain - The height of the frequency bin in canvas dimension
   * @param {string|array} options.color - the oscilloscope color in Hex/RGB/HSL or <code>rainbow</code> **/
  static drawOscilloscope(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    // Iterate over data to build each bar
    let cursorX = 0;
    const frequencyWidth = canvas.width / options.samples;
    for (let i = 0; i < options.samples; ++i) {
      // Compute frequency height percentage relative to canvas height to determine Y origin
      const frequencyHeight = options.timeDomain[i] / 255; // Get value between 0 and 1
      const cursorY = canvas.height * frequencyHeight;

      if (i > 0) { // General case
        ctx.lineTo(cursorX, cursorY);
      } else { // 0 index case
        ctx.moveTo(cursorX, cursorY);
      }
      // Update cursor position
      cursorX += frequencyWidth;
    }

    if (options.colors === 'rainbow') {
      ctx.strokeStyle = ColorUtils.rainbowLinearGradient(canvas);
    } else if (Array.isArray(options.colors)) {
      ctx.strokeStyle = ColorUtils.linearGradient(canvas, options);
    } else {
      ctx.strokeStyle = options.colors;
    }

    ctx.stroke();
    ctx.closePath();
  }


  /** @method
   * @name drawPointsOscilloscope
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw an oscilloscope as points only in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Oscilloscope options
   * @param {number} options.length - the oscilloscope length (half FFT)
   * @param {number} options.times - The time domain bins
   * @param {string} options.color - The point color in Hex/RGB/HSL **/
  static drawPointsOscilloscope(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();

    for (let i = 0; i < options.length; ++i) {
      let height = canvas.height * (options.times[i] / 255);
      let offset = canvas.height - height - 1;
      let barWidth = canvas.width / options.length;
      ctx.fillStyle = options.color;
      ctx.fillRect(i * barWidth, offset, 2, 2);
    }

    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }


  /** @method
   * @name drawRadialOscilloscope
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a radial oscilloscope as points only in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Oscilloscope options
   * @param {number} options.centerX - the x center position
   * @param {number} options.centerY - the y center position
   * @param {number} options.rotation - the rotation offset
   * @param {number} options.length - the oscilloscope length (half FFT)
   * @param {number[]} options.times - The time domain bins
   * @param {number[]} options.points - The oscilloscope radial points objects
   * @param {string} options.color - The point color in Hex/RGB/HSL **/
  static drawRadialOscilloscope(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.save();
    ctx.translate(options.centerX, options.centerY);
    ctx.rotate(options.rotation)
    ctx.translate(-options.centerX, -options.centerY);
    ctx.moveTo(options.points[0].dx, options.points[0].dy);
    ctx.strokeStyle = options.color;

    for (let i = 0; i < options.length - 1; ++i) {
      let point = options.points[i];
      point.dx = point.x + options.times[i] * Math.sin((Math.PI / 180) * point.angle);
      point.dy = point.y + options.times[i] * Math.cos((Math.PI / 180) * point.angle);
      let xc = (point.dx + options.points[i + 1].dx) / 2;
      let yc = (point.dy + options.points[i + 1].dy) / 2;
      ctx.quadraticCurveTo(point.dx, point.dy, xc, yc);
    }
    // Handle last point manually
    let value = options.times[options.length - 1];
    let point = options.points[options.length - 1];
    point.dx = point.x + value * Math.sin((Math.PI / 180) * point.angle);
    point.dy = point.y + value * Math.cos((Math.PI / 180) * point.angle);
    let xc = (point.dx + options.points[0].dx) / 2;
    let yc = (point.dy + options.points[0].dy) / 2;
    ctx.quadraticCurveTo(point.dx, point.dy, xc, yc);
    ctx.quadraticCurveTo(xc, yc, options.points[0].dx, options.points[0].dy);
    // Fill context for current path
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    ctx.closePath();
  }


  /** @method
   * @name drawPeakMeter
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a peakmeter in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Peak meter options
   * @param {string} options.orientation - The peak meter orientation, either <code>horizontal</code> or <code>vertical</code>
   * @param {number} options.amplitude - The sample amplitude value
   * @param {number} options.peak - The peak value
   * @param {object[]} options.colors - The peak meter gradient colors, must be objects with color and index (in Float[0,1]) properties **/
  static drawPeakMeter(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('CanvasUtils.drawPeakMeter : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('CanvasUtils.drawPeakMeter : Invalid type for canvas or options');
    }
    // Test if options contains other mandatory args
    if ((options.orientation === undefined || options.orientation === null) || (options.amplitude === undefined || options.amplitude === null) || (options.peak === undefined || options.peak === null) || (options.colors === undefined || options.colors === null)) {
      return new Error('CanvasUtils.drawPeakMeter : Missing arguments options.orientation or options.amplitude or options.peak or options.top');
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    options.vertical = (options.orientation === 'vertical');
    ctx.fillStyle = ColorUtils.linearGradient(canvas, options);
    ctx.fill();

    if (options.orientation === 'horizontal') {
      const ledWidth = canvas.width - options.amplitude;
      ctx.fillRect(0, 0, ledWidth, canvas.height);
    } else if (options.orientation === 'vertical') {
      const ledHeight = canvas.height - options.amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, ledHeight);
    }
    // Draw maximus bar
    ctx.fillStyle = '#FF6B67';
    if (options.orientation === 'horizontal') {
      const ledWidth = canvas.width - options.peak;
      ctx.fillRect(ledWidth, 0, 1, canvas.height);
    } else if (options.orientation === 'vertical') {
      const ledHeight = canvas.height - options.peak;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, 1);
    }
  }


  /** @method
   * @name drawTriangle
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a triangle in given canvas.</blockquote>
   * @param {object} canvas - The canvas to draw disc in
   * @param {object} options - Peak meter options
   * @param {number} options.x - The triangle x origin
   * @param {number} options.y - The triangle y origin
   * @param {number} options.radius - The triangle base
   * @param {number} options.top - The triangle top position **/
  static drawTriangle(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('CanvasUtils.drawTriangle : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('CanvasUtils.drawTriangle : Invalid type for canvas or options');
    }
    // Test if options contains other mandatory args
    if ((options.x === undefined || options.x === null) || (options.y === undefined || options.y === null) || (options.radius === undefined || options.radius === null) || (options.top === undefined || options.top === null)) {
      return new Error('CanvasUtils.drawTriangle : Missing arguments options.x or options.y or options.radius or options.top');
    }
    // Test mandatory arguments proper types
    if (typeof options.x !== 'number' || typeof options.y !== 'number' || typeof options.radius !== 'number' || typeof options.top !== 'number') {
      return new Error('CanvasUtils.drawTriangle : Invalid type for options.x or options.y or options.radius or options.top');
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(options.x - options.radius, options.y);
    ctx.lineTo(options.x + options.radius, options.y);
    ctx.lineTo(options.x, options.top);
    ctx.fill();
    ctx.closePath();
  }


  /** @method
   * @name drawHotCue
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a hotcue in given canvas. HotCue is a square with a label in it.</blockquote>
   * @param {object} canvas - The canvas to draw hotcue in
   * @param {object} options - Hot cue options
   * @param {number} options.x - The hotcue x origin
   * @param {number} options.y - The hotcue y origin
   * @param {number} options.size - The hotcue dimension (height/width)
   * @param {string} [options.color] - The hotcue color in Hex or css color
   * @param {number} options.label - The hotcue label **/
  static drawHotCue(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('CanvasUtils.drawHotCue : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('CanvasUtils.drawHotCue : Invalid type for canvas or options');
    }
    // Test if options contains other mandatory args
    if ((options.x === undefined || options.x === null) || (options.y === undefined || options.y === null) || (options.size === undefined || options.size === null) || (options.label === undefined || options.label === null)) {
      return new Error('CanvasUtils.drawHotCue : Missing arguments options.x or options.y or options.size or options.label');
    }
    // Test mandatory arguments proper types
    if (typeof options.x !== 'number' || typeof options.y !== 'number' || typeof options.size !== 'number' || typeof options.label !== 'string') {
      return new Error('CanvasUtils.drawHotCue : Invalid type for options.x or options.y or options.size or options.label');
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    // HotCue border
    ctx.fillStyle = ColorUtils.defaultBackgroundColor;
    ctx.fillRect(options.x - (options.size / 2) - 1, options.y - 1, options.size + 2, options.size + 2);
    // Background rectangle
    ctx.fillStyle = options.color || ColorUtils.defaultPrimaryColor;
    ctx.fillRect(options.x - (options.size / 2), options.y, options.size, options.size);
    // Label text drawing
    ctx.fillStyle = ColorUtils.defaultBackgroundColor;
    ctx.font = 'bold 8pt sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.label || '', options.x, options.y + (3 * options.size / 4));
    ctx.closePath();
  }


  /** @method
   * @name drawBeatCount
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw in canvas the beat count and the bar count of current playback.</blockquote>
   * @param {object} canvas - The canvas to draw hotcue in
   * @param {object} options - Peak meter options
   * @param {number} options.x - The hotcue x origin
   * @param {number} options.y - The hotcue y origin
   * @param {string} options.label - The bar count label **/
  static drawBeatCount(canvas, options) {
    // Test that caller sent mandatory arguments
    if ((canvas === undefined || canvas === null) || (options === undefined || options === null)) {
      return new Error('CanvasUtils.drawBeatCount : Missing arguments canvas or options');
    }
    // Test those arguments proper types
    if (canvas.nodeName !== 'CANVAS' || typeof options !== 'object') {
      return new Error('CanvasUtils.drawBeatCount : Invalid type for canvas or options');
    }
    // Test if options contains other mandatory args
    if ((options.x === undefined || options.x === null) || (options.y === undefined || options.y === null) || (options.label === undefined || options.label === null)) {
      return new Error('CanvasUtils.drawBeatCount : Missing arguments options.x or options.y or options.label');
    }
    // Test mandatory arguments proper types
    if (typeof options.x !== 'number' || typeof options.y !== 'number' || typeof options.label !== 'string') {
      return new Error('CanvasUtils.drawBeatCount : Invalid type for options.x or options.y or options.label');
    }
    // Perform method purpose
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    // Label text drawing
    ctx.fillStyle = ColorUtils.defaultPrimaryColor;
    ctx.font = 'bold 10pt sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${options.label} Bars`, options.x, options.y);
    ctx.closePath();
  }


  /** @method
   * @name precisionRound
   * @public
   * @memberof CanvasUtils
   * @static
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Round a floating number with a given precision after coma.</blockquote>
   * @param {number} value - The floating value to round
   * @param {number} precision - the amount of number we want to have after floating point
   * @return {number} - The rounded value **/
  static precisionRound(value, precision) {
    // Test that caller sent mandatory arguments
    if ((value === undefined || value === null) || (precision === undefined || precision === null)) {
      return new Error('CanvasUtils.precisionRound : Missing arguments value or precision');
    }
    // Test those arguments proper types
    if (typeof value !== 'number' || typeof precision !== 'number') {
      return new Error('CanvasUtils.precisionRound : Invalid type for value or precision');
    }
    // Perform method purpose
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }


}


export default CanvasUtils;

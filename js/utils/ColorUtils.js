class ColorUtils {


  constructor() {}


  static drawRadialGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.x0, options.y0, options.r0,
      options.x1, options.y1, options.r1
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].center, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  static drawVerticalFrequencyGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(
      0, canvas.height,
      0, 0
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].center, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(options.originX, canvas.height - options.frequencyHeight, options.frequencyWidth, options.frequencyHeight);
  }


  static drawRadialGlowGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.centerX, options.centerY, 0,
      options.centerX, options.centerY, options.radius
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(options.colors[i].center, options.colors[i].color);
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  }


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


  static lightenDarkenColor(color, amount) {
    // https://jsfiddle.net/gabrieleromanato/hrJ4X/
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


  static rainbowGradient(canvas, vertical = false) {
    const ctx = canvas.getContext("2d");
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


  static get defaultBackgroundColor() {
    return '#1D1E25';
  }


  static get defaultTextColor() {
    return '#E7E9E7';
  }


  static get defaultPrimaryColor() {
    return '#56D45B';
  }


  static get defaultAntiPrimaryColor() {
    return '#FF6B67';
  }


  static get defaultDarkPrimaryColor() {
    return '#12B31D';
  }


  static get defaultAudioGradient() {
    // Green, Light Green, Orange, Red, Light Red
    return ['#56D45B', '#AFF2B3', '#FFAD67', '#FF6B67', '#FFBAB8'];
  }


}


export default ColorUtils;

class ColorUtils {


  constructor() {}


  static drawRadialGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.x0, options.y0, options.r0,
      options.x1, options.y1, options.r1
    );

    for (let i = 0; i < options.colors.length; ++i) {
      gradient.addColorStop(i, options.colors[i]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  static drawRadialGlowGradient(canvas, options) {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      options.centerX, options.centerY, 0,
      options.centerX, options.centerY, options.radius
    );
    gradient.addColorStop(0.48, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, options.color);
    gradient.addColorStop(0.52, 'rgba(0,0,0,0)');

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


}


export default ColorUtils;

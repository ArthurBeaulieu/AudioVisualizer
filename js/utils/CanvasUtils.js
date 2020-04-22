import ColorUtils from './ColorUtils.js';


class CanvasUtils {


  constructor() {}


  static drawBar(canvas, options) {
    const ctx = canvas.getContext('2d');
    let amount = options.frequency / 255;
    if (amount < 0.05) {
      amount = -amount;
    } else {
      amount = amount * 2;
    }

    const lineColor = ColorUtils.lightenDarkenColor(options.color, amount * 100);
    ctx.beginPath();
    ctx.moveTo(options.x0, options.y0);
    ctx.lineTo(options.x1, options.y1);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = options.width;
    ctx.stroke();
    ctx.closePath();
  }


  static drawCircle(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ctx.lineWidth = options.width;
    ctx.strokeStyle = options.color || '#FFF';
    ctx.stroke();
    ctx.closePath();
  }


  static drawCircleGlow(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ColorUtils.drawRadialGlowGradient(canvas, options);
    ctx.closePath();
  }


  static drawDisc(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(options.centerX, options.centerY, options.radius, options.radStart, options.radEnd);
    ctx.fillStyle = options.color || '#FFF';
    ctx.fill();
    ctx.closePath();
  }


}


export default CanvasUtils;

import ColorUtils from './ColorUtils.js';


class CanvasUtils {


  constructor() {}


  static drawRadialBar(canvas, options) {
    const ctx = canvas.getContext('2d');
    let amount = options.frequency / 255;
    if (amount < 0.05) {
      amount = -amount;
    } else {
      amount = amount * 1.33;
    }

    ctx.beginPath();
    ctx.moveTo(options.x0, options.y0);
    ctx.lineTo(options.x1, options.y1);
    ctx.strokeStyle = ColorUtils.lightenDarkenColor(options.color, amount * 100);
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


  static drawVerticalFrequencyBar(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillRect(options.originX, canvas.height - options.frequencyHeight, options.frequencyWidth, options.frequencyHeight);
    ColorUtils.drawVerticalFrequencyGradient(canvas, options);
    ctx.closePath();
  }


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

    ctx.strokeStyle = options.color;
    ctx.stroke();
    ctx.closePath();
  }


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


  static drawRadialOscilloscope(canvas, options) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.save();
    ctx.translate(options.centerX, options.centerY);
    ctx.rotate(options.rotation)
    ctx.translate(-options.centerX, -options.centerY);
    ctx.moveTo(options.points[0].dx, options.points[0].dy);

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


  static drawPeakMeter(canvas, options) {
    const ctx = canvas.getContext('2d');
    ColorUtils.peakMeterGradient(canvas, options);

    if (options.orientation === 'horizontal') {
      const ledWidth = canvas.width - options.amplitude;
      ctx.fillRect(0, 0, ledWidth, canvas.height);
    } else if (options.orientation === 'vertical') {
      const ledHeight = canvas.height - options.amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, ledHeight);
    }

    ctx.fillStyle = '#FF6B67';
    if (options.orientation === 'horizontal') {
      const ledWidth = canvas.width - options.peak;
      ctx.fillRect(ledWidth, 0, 1, canvas.height);
    } else if (options.orientation === 'vertical') {
      const ledHeight = canvas.height - options.peak;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, 1);
    }
  }


  static drawTriangle(canvas, x, y, radius, top) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x, top);
    ctx.fill();
    ctx.closePath();
  }


  static precisionRound(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }


}


export default CanvasUtils;

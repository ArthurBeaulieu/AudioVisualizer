import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';


class MzkFrequencyCircle extends VisuComponentMono {


  constructor(options) {
    super(options);

    this._imageSrc = options.image;
    this._centerX = null;
    this._centerY = null;
    this._radius = null;
    this._radialSection = null;
    this._barCount = null;
    this._barMaxHeight = null;
    this._circleStrokeWidth = null;
    this._stars = [];
    this._points = [];
    this._waveformRotation = null;
    // Dom specific elements for frequency circle
    this._dom.logo = null;
    // Intensity modifier
    this._averageBreakpoint = 128; // Putting breakpoint on mid amplitude [0, 255]
    this._averageHit = false;
    // Append only once the given logo if any
    this._setupFrenquencyCircle();
  }


  _setupFrenquencyCircle() {
    if (this._imageSrc) {
      this._dom.logo = document.createElement('IMG');
      this._dom.logo.src = this._imageSrc;
      this._dom.container.appendChild(this._dom.logo);
    }
  }


  _buildCanvasUI() {
    // Build background radial gradient
    ColorUtils.drawRadialGradient(this._canvas, {
      colors: ['#3C405D', '#060609'], // Color value according to ManaZeak's linear background colors
      x0: this._centerX,
      y0: this._centerY,
      r0: this._radius,
      x1: this._centerX,
      y1: this._centerY,
      r1: this._canvas.width / 2.66,
    });
    // Build logo circle border
    CanvasUtils.drawCircle(this._canvas, {
      centerX: this._centerX,
      centerY: this._centerY,
      radius: this._radius,
      radStart: 0,
      radEnd: Math.PI * 2,
      width: this._circleStrokeWidth * 2 // Times two because stroke is centered on circle
    });
  }


  _processAudioBin() {
    this._clearCanvas();
    this._buildCanvasUI();

    if (this._isPlaying === true) {
      const frequencies = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      const times = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      this._nodes.analyser.getByteFrequencyData(frequencies);
      this._nodes.analyser.getByteTimeDomainData(times);
      // Draw circle bars while retrieving aaverage amplitude
      let average = this._animateCircleBars(frequencies);
      // Compute frequencies average value
      average = average / frequencies.length;
      this._averageHit = (average > this._averageBreakpoint);
      // Animate each star
      this._animateStars(average);
      // Draw average circle with its glow effect around center
      this._animateCircleGlow(average);
      // Draw circular oscilloscope
      this._animateOscilloscope(times);
      // Request for next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


  _animateCircleBars(frequencies) {
    let average = 0; // Output average value
    for (let i = 0; i < frequencies.length; ++i) {
      // Compute current bar parameters
      const barHeight = (frequencies[i] / 255) * this._barMaxHeight;
      const barWidth = Math.round(this._radialSection * this._radius);
      const xStart = this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth);
      const yStart = this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth);
      const xEnd = this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight);
      const yEnd = this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight);
      // Use CanvasUtils to draw bar
      CanvasUtils.drawBar(this._canvas, {
        x0: xStart,
        y0: yStart,
        x1: xEnd,
        y1: yEnd,
        width: barWidth,
        color: '#37C340',
        frequency: frequencies[i]
      });
      // Update average amplitude value
      average += frequencies[i];
    }
    // Return average value of frequencies
    return average;
  }


  _animateStars(average) {
    let tick = (this._averageHit) ? average / 20 : average / 50;
    for (let i = 0; i < this._stars.length; i++) {
      let star = this._stars[i];
      // Update star position and variation
      star.addToPos(star.dx * tick, star.dy * tick, star.dz);
      star.addToVar(star.ddx, star.ddy, 0.6);
      // Create new star if current got out of canvas
      if (star.x < -this._centerX || star.x > this._centerX || star.y < -this._centerY || star.y > this._centerY) {
        star = new Star(this._centerX, this._centerY, average);
        this._stars[i] = star;
      }
      // Use CanvasUtils to draw star disc
      CanvasUtils.drawDisc(this._canvas, {
        centerX: star.x + this._centerX,
        centerY: star.y + this._centerY,
        radius: star.radius,
        radStart: Math.PI * 2,
        radEnd: false,
        color: star.color
      });
    }
  }


  _animateCircleGlow(average) {
    let glowColor = (this._averageHit) ? '#56D45B' : '#48ABAF';
    // Build average amplitude glow
    CanvasUtils.drawCircleGlow(this._canvas, {
      centerX: this._centerX,
      centerY: this._centerY,
      radius: ((this._radius * 1.33) + average) * 2, // Glow need twice radius to properly display gradient
      radStart: 0,
      radEnd: Math.PI * 2,
      color: glowColor
    });
  }


  _animateOscilloscope(times) {
    var tick = 0.05;
    if (this._averageHit) {
      this._waveformRotation += tick;
      this._ctx.strokeStyle = 'rgba(157, 242, 157, 0.8)';
      this._ctx.fillStyle = 'rgba(0,0,0,0)';
    } else {
      this._waveformRotation += -tick;
      this._ctx.strokeStyle = 'rgba(157, 242, 157, 0.11)';
      this._ctx.fillStyle = 'rgba(29, 36, 57, 0.05)';
    }

    this._ctx.beginPath();
    this._ctx.lineWidth = 1;
    this._ctx.lineCap = 'round';

    this._ctx.save();
    this._ctx.translate(this._centerX, this._centerY);
    this._ctx.rotate(this._waveformRotation)
    this._ctx.translate(-this._centerX, -this._centerY);
    this._ctx.moveTo(this._points[0].dx, this._points[0].dy);

    for (let i = 0; i < (this._fftSize / 2) - 1; ++i) {
      let point = this._points[i];
      point.dx = point.x + times[i] * Math.sin((Math.PI / 180) * point.angle);
      point.dy = point.y + times[i] * Math.cos((Math.PI / 180) * point.angle);
      let xc = (point.dx + this._points[i + 1].dx) / 2;
      let yc = (point.dy + this._points[i + 1].dy) / 2;

      this._ctx.quadraticCurveTo(point.dx, point.dy, xc, yc);
    }
    // Handle last point manually
    let value = times[(this._fftSize / 2) - 1];
    let point = this._points[(this._fftSize / 2) - 1];
    point.dx = point.x + value * Math.sin((Math.PI / 180) * point.angle);
    point.dy = point.y + value * Math.cos((Math.PI / 180) * point.angle);
    let xc = (point.dx + this._points[0].dx) / 2;
    let yc = (point.dy +this._points[0].dy) / 2;

    this._ctx.quadraticCurveTo(point.dx, point.dy, xc, yc);
    this._ctx.quadraticCurveTo(xc, yc, this._points[0].dx, this._points[0].dy);
    // Fill context for current path
    this._ctx.stroke();
    this._ctx.fill();
    this._ctx.restore();
    this._ctx.closePath();
    // If breakpoint is reached, we draw stillized oscilloscope
    if (this._averageHit) {
      this._ctx.beginPath();

      for (let i = 0; i < (this._fftSize / 2); i++) {
        let height = this._canvas.height * (times[i] / 255);
        let offset = (this._canvas.height - height - 1);
        let barWidth = (this._canvas.width / (this._fftSize / 2));
        this._ctx.fillStyle = 'rgba(86, 212, 91, 0.9)';
        this._ctx.fillRect(i * barWidth, offset, 1, 1);
      }

      this._ctx.stroke();
      this._ctx.fill();
      this._ctx.closePath();
    }
  }


  _onResizeOverride() {
    this._circleStrokeWidth = 2;
    this._barCount = this._nodes.analyser.frequencyBinCount;
    this._centerX = this._canvas.width / 2;
    this._centerY = this._canvas.height / 2;
    this._barMaxHeight = this._canvas.height / 8;
    this._radius = (this._canvas.height / 4) - (this._canvas.height / 16);
    this._radialSection = (Math.PI * 2) / this._barCount;
    // Populating stars
    this._stars = [];
    for (let i = 0; i < 1500; ++i) {
      this._stars.push(new Star(this._centerX, this._centerY));
    }
    // Define average circle
    this._averageCircle = new AvgCircle(this._canvas.height, this._canvas.width);
    // Populating circular waveform points
    this._points = [];
    for (let i = 0; i < (this._fftSize / 2); ++i) {
      this._points.push(new Point({
        index: i,
        height: this._canvas.height,
        width: this._canvas.width,
        total: (this._fftSize / 2)
      }));
    }
    // Build canvas fixed base
    this._buildCanvasUI();
  }


  _play() {
    super._play();
    this._dom.logo.classList.add('rotate');
  }


  _pause() {
    super._pause();
    this._dom.logo.classList.remove('rotate');
  }


}


class Star {
  constructor(centerX, centerY, average = 0) {
    this.x = Math.random() * (centerX * 2) - centerX;
    this.y = Math.random() * (centerY * 2) - centerY;
    this.z = this.max_depth = Math.max((centerX * 2) / (centerY * 2));
    this.radius = 0.2;

    var xc = (this.x > 0) ? 1 : -1;
    var yc = (this.y > 0) ? 1 : -1;

    if (Math.abs(this.x) > Math.abs(this.y)) {
      this.dx = 1.0;
      this.dy = Math.abs(this.y / this.x);
    } else {
      this.dx = Math.abs(this.x / this.y);
      this.dy = 1.0;
    }

    this.dx *= xc;
    this.dy *= yc;
    this.dz = -0.1;

    this.ddx = .001 * this.dx;
    this.ddy = .001 * this.dy;

    if (this.y > (centerY / 2)) {
      this.color = '#B5BFD4';
    } else {
      if (average > 145) {
        this.color = '#FF6B67';
      } else {
        this.color = '#465677';
      }
    }
  }

  addToPos(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
  }


  addToVar(dx, dy, radiusFactor) {
    this.dx += dx;
    this.dy += dy;
    this.radius = radiusFactor + ((this.max_depth - this.z) * .1);
  }


}


class Point {


  constructor(options) {
    this.height = options.height;
    this.width = options.width;
    this.total = options.total;
    this.index = options.index;
    this.angle = (this.index * 360) / this.total;

    this.updateDynamics();

    this.value = Math.random() * 256;
    this.dx = this.x + this.value * Math.sin((Math.PI / 180) * this.angle);
    this.dy = this.y + this.value * Math.cos((Math.PI / 180) * this.angle);
  }

  updateDynamics() {
    this.radius = Math.abs(this.width, this.height) / 8;
    this.x = (this.width / 2) + this.radius * Math.sin((Math.PI / 180) * this.angle);
    this.y = (this.height / 2) + this.radius * Math.cos((Math.PI / 180) * this.angle);
  }


}


class AvgCircle {
  constructor(height, width) {
    this._height = height;
    this._width = width;
    this.update();
  }

  update() {
    this.radius = (Math.abs(this._width, this._height) / 6);
  }
}


export default MzkFrequencyCircle;

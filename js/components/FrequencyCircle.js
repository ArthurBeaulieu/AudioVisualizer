import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';

// https://www.kkhaydarov.com/audio-visualizer/
// https://codepen.io/noeldelgado/pen/EaNjBy

class FrequencyCircle extends VisuComponentMono {


  constructor(options) {
    super(options);
  }


  /*  ----------  VisuComponentMono overrides  ----------  */



  _fillAttributes(options) {
    super._fillAttributes(options);
    // Frequency circle specific attributes
    this._imageSrc = null;
    this._centerX = null;
    this._centerY = null;
    this._radius = null;
    this._radialSection = null;
    this._barCount = null;
    this._barMaxHeight = null;
    this._circleStrokeWidth = null;
    this._stars = [];
    this._points = [];
    this._oscilloscopeRotation = null;
    // Dom specific elements for frequency circle
    this._dom.logo = null;
    // Intensity modifier
    this._averageBreakpoint = 132; // Putting breakpoint on mid amplitude [0, 255]
    this._averageHit = false;

    this._imageSrc = options.image;
    this._dom.logo = document.createElement('IMG');
    this._dom.logo.classList.add('paused');
    this._dom.logo.src = this._imageSrc ;
  }


  _buildUI() {
    super._buildUI();
    if (this._imageSrc) { this._dom.container.appendChild(this._dom.logo); }
    this._buildBackgroundBase();
  }


  _onResize() {
    super._onResize();
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
      this._stars.push(new Star(this._centerX, this._centerY, null, this._averageBreakpoint));
    }
    // Populating circular oscilloscope points
    this._points = [];
    for (let i = 0; i < (this._fftSize / 2); ++i) {
      this._points.push(new OscilloscopeRadialPoint({
        index: i,
        height: this._canvas.height,
        width: this._canvas.width,
        total: (this._fftSize / 2)
      }));
    }
    // Build canvas fixed base
    this._buildBackgroundBase();
  }


  _play() {
    super._play();
    this._dom.logo.classList.remove('paused'); // Resume scss animation
  }


  _pause() {
    super._pause();
    this._dom.logo.classList.add('paused'); // Pause scss animation
  }


  /*  ----------  FrequencyCircle internal methods  ----------  */


  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      this._buildBackgroundBase();
      // Extract frequencies and times data
      const frequencies = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      const times = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      this._nodes.analyser.getByteFrequencyData(frequencies);
      this._nodes.analyser.getByteTimeDomainData(times);
      // Get average frequency for proccessed bin
      let average = this._getAverageFrequency(frequencies);
      this._averageHit = (average > this._averageBreakpoint);
      // Draw circle bars while retrieving aaverage amplitude
      this._animateCircleBars(frequencies);
      // Animate each star
      this._animateStars(average);
      // Draw average circle with its glow effect around center
      this._animateCircleGlow(average);
      // Draw circular oscilloscope and horizontal one if average hit
      this._animateOscilloscopes(times);
      // Request for next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


  _buildBackgroundBase() {
    // Build background radial gradient
    // Color value according to ManaZeak's linear background colors
    ColorUtils.drawRadialGradient(this._canvas, {
      x0: this._centerX,
      y0: this._centerY,
      r0: this._radius,
      x1: this._centerX,
      y1: this._centerY,
      r1: this._canvas.width / 2.66,
      colors: [
        { color: '#3C405D', center: 0 },
        { color: '#060609', center: 1 }
      ]
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


  _animateCircleBars(frequencies) {
    // Compute radial width for each circular bar
    const barWidth = Math.round(this._radialSection * this._radius);
    // Iterate over frequencies to draw each correspondant frequency bin
    for (let i = 0; i < frequencies.length; ++i) {
      // Compute current bar height depending on intensity
      const barHeight = (frequencies[i] / 255) * this._barMaxHeight;
      // Use CanvasUtils to draw bar
      CanvasUtils.drawRadialBar(this._canvas, {
        x0: this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth),
        y0: this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth),
        x1: this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight),
        y1: this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight),
        width: barWidth,
        color: this._averageHit ? /* Green */ '#56D45B' : /* Dark Green */ '#37C340',
        frequency: frequencies[i]
      });
    }
  }


  _animateStars(average) {
    let tick = this._averageHit ? average / 20 : average / 60;
    for (let i = 0; i < this._stars.length; ++i) {
      let star = this._stars[i];
      // Update star position and variation
      star.updatePosition(tick, 0.6);
      // Replace star with new one if it went out canvas
      if (star.x < -this._centerX || star.x > this._centerX || star.y < -this._centerY || star.y > this._centerY) {
        star = new Star(this._centerX, this._centerY, average, this._averageBreakpoint); // Update local variable
        this._stars[i] = star; // Save new reference
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
    // Build average amplitude glow with color change when average breakpoint is hit
    CanvasUtils.drawCircleGlow(this._canvas, {
      centerX: this._centerX,
      centerY: this._centerY,
      radius: ((this._radius * 1.33) + average) * 2, // Glow need twice radius to properly display gradient
      radStart: 0,
      radEnd: Math.PI * 2,
      colors: [
        { color: 'rgba(0, 0, 0, 0)', center: 0.48 },
        { color: (this._averageHit ? /* Green */ '#56D45B' : /* Blue */ '#48ABAF'), center: 0.5 },
        { color: 'rgba(0, 0, 0, 0)', center: 0.52 }
      ]
    });
  }


  _animateOscilloscopes(times) {
    let tick = 0.05;
    if (this._averageHit) {
      this._oscilloscopeRotation += tick;
      this._ctx.strokeStyle = 'rgba(255, 193, 140, .7)'; // Orange
    } else {
      this._oscilloscopeRotation += -tick;
      this._ctx.strokeStyle = 'rgba(125, 228, 132, 0.25)'; // Green
    }
    // Update radial oscilloscope with time values
    CanvasUtils.drawRadialOscilloscope(this._canvas, {
      points: this._points,
      times: times,
      length: this._fftSize / 2,
      centerX: this._centerX,
      centerY: this._centerY,
      rotation: this._oscilloscopeRotation
    });
    // If breakpoint is reached, we draw stillized horizontal oscilloscope
    if (this._averageHit) {
      CanvasUtils.drawPointsOscilloscope(this._canvas, {
        times: times,
        length: this._fftSize / 2,
        color: 'rgba(113, 201, 205, .7)'
      });
    }
  }


  _getAverageFrequency(frequencies) {
    let average = 0; // Output average value
    for (let i = 0; i < frequencies.length; ++i) {
      // Update average amplitude value
      average += frequencies[i];
    }
    // Return average value of frequencies
    return average / frequencies.length;
  }


}


class Star {


  constructor(centerX, centerY, average = 0, breakpoint = 132) {
    // Public attributes
    this.radius = 0.4;
    this.color = '#0F8489'; // Dark blue
    this.x = Math.random() * (centerX * 2) - centerX;
    this.y = Math.random() * (centerY * 2) - centerY;
    // Private attributes
    this._z = Math.max((centerX * 2) / (centerY * 2));
    this._maxDepth = Math.max((centerX * 2) / (centerY * 2));
    // Set star variation in space
    if (Math.abs(this.x) > Math.abs(this.y)) {
      this._dx = 1.0;
      this._dy = Math.abs(this.y / this.x);
    } else {
      this._dx = Math.abs(this.x / this.y);
      this._dy = 1.0;
    }
    // Set variation relative to center
    this._dx *= (this.x > 0) ? 1 : -1;
    this._dy *= (this.y > 0) ? 1 : -1;
    this._dz = -0.1;
    // Determine color according to center or average intensity
    if (this.y > (centerY / 2)) {
      this.color = '#71C9CD'; // Light Blue
    } else if (average > breakpoint) {
      this.color = '#FF6B67'; // Red
    }
  }


  updatePosition(tick, radiusFactor) {
    // Update position
    this.x += this._dx * tick;
    this.y += this._dy * tick;
    this._z += this._dz; // Constant z variation
    // Update variation
    this._dx += this._dx * .001;
    this._dy += this._dy * .001;
    this.radius = radiusFactor + ((this._maxDepth - this._z) * .1);
  }


}


class OscilloscopeRadialPoint {


  constructor(options) {
    this._height = options.height;
    this._width = options.width;
    this._total = options.total;
    this._index = options.index;
    this._value = Math.random() * 256;
    this._radius = Math.abs(this._width, this._height) / 8;
    // Public attributes
    this.angle = (this._index * 360) / this._total;
    this.x = (this._width / 2) + this._radius * Math.sin((Math.PI / 180) * this.angle);
    this.y = (this._height / 2) + this._radius * Math.cos((Math.PI / 180) * this.angle);
    this.dx = this.x + this._value * Math.sin((Math.PI / 180) * this.angle);
    this.dy = this.y + this._value * Math.cos((Math.PI / 180) * this.angle);
  }


}


export default FrequencyCircle;

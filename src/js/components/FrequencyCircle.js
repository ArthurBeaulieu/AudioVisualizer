import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';
'use strict';


class FrequencyCircle extends VisuComponentMono {


  /** @summary FrequencyCircle displays a stylistic radial view in real time.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentMono
   * @description <blockquote>This will display a single canvas with frequency displayed in. Inspired from
   * https://www.kkhaydarov.com/audio-visualizer/ and https://codepen.io/noeldelgado/pen/EaNjBy aka real mvps
   * that helped going through WebAudioAPI. It will combine a radial gradient in the background, a spinning logo
   * in the canvas center, radial frequency bars, radial oscilloscope, linear oscilloscope with it visibility handled
   * by real time audio intensity, as well as circular pulsing and glowing circle around the logo.</blockquote>
   * @param {object} options - The frequency circle options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one **/
  constructor(options) {
    super(options);
  }


  /*  ----------  VisuComponentMono overrides  ----------  */



  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The frequency circle options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {string} [options.image] - The image to put in center of canvas with a spinning animation **/
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


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    super._buildUI();
    if (this._imageSrc) { this._dom.container.appendChild(this._dom.logo); }
    this._buildBackgroundBase();
  }


  /** @method
   * @name _play
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On play event callback.</blockquote> **/
  _play() {
    super._play();
    this._dom.logo.classList.remove('paused'); // Resume scss animation
  }


  /** @method
   * @name _pause
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On pause event callback.</blockquote> **/
  _pause() {
    super._pause();
    this._dom.logo.classList.add('paused'); // Pause scss animation
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
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
      this._stars.push(new BackgroundStar(this._centerX, this._centerY, null, this._averageBreakpoint));
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


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit frequency
   * and time analysis. Then we use utils method to draw radial oscilloscope, linear point oscilloscope, background points
   * and radial frequency bars.</blockquote> **/
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


  /*  ----------  FrequencyCircle internal methods  ----------  */


  /** @method
   * @name _processAudioBin
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw radial gradient background and circle that surround image.</blockquote> **/
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
        { color: '#3C405D', index: 0 },
        { color: '#060609', index: 1 }
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


  /** @method
   * @name _animateCircleBars
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Compute the frequency circle shape according to audio BIN frequency array.</blockquote>
   * @param {number[]} frequencies - The frequency array for a given audio bin **/
  _animateCircleBars(frequencies) {
    // Compute radial width for each circular bar
    const barWidth = Math.round(this._radialSection * this._radius);
    // Iterate over frequencies to draw each matching frequency bin
    for (let i = 0; i < frequencies.length; ++i) {
      // Compute current bar height depending on intensity
      const barHeight = (frequencies[i] / 255) * this._barMaxHeight;
      // Use CanvasUtils to draw bar
      CanvasUtils.drawRadialBar(this._canvas, {
        frequencyValue: frequencies[i],
        x0: this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth),
        y0: this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth),
        x1: this._centerX + Math.cos(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight),
        y1: this._centerY + Math.sin(this._radialSection * i - (Math.PI / 2)) * (this._radius + this._circleStrokeWidth + barHeight),
        width: barWidth,
        color: this._averageHit ? /* Green */ '#56D45B' : /* Dark Green */ '#37C340'
      });
    }
  }


  /** @method
   * @name _animateStars
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Animate background points to match intensity with color and radius.</blockquote>
   * @param {number} average - The average value that acts like a breakpoint for intensity **/
  _animateStars(average) {
    let tick = this._averageHit ? average / 20 : average / 60;
    for (let i = 0; i < this._stars.length; ++i) {
      let star = this._stars[i];
      // Update star position and variation
      star.updatePosition(tick, 0.6);
      // Replace star with new one if it went out canvas
      if (star.x < -this._centerX || star.x > this._centerX || star.y < -this._centerY || star.y > this._centerY) {
        star = new BackgroundStar(this._centerX, this._centerY, average, this._averageBreakpoint); // Update local variable
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


  /** @method
   * @name _animateCircleGlow
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Animate the glowing circle around centred logo.</blockquote>
   * @param {number} average - The average value that acts like a breakpoint for intensity **/
  _animateCircleGlow(average) {
    // Build average amplitude glow with color change when average breakpoint is hit
    CanvasUtils.drawCircleGlow(this._canvas, {
      centerX: this._centerX,
      centerY: this._centerY,
      radius: ((this._radius * 1.33) + average) * 2, // Glow need twice radius to properly display gradient
      radStart: 0,
      radEnd: Math.PI * 2,
      colors: [
        { color: 'rgba(0, 0, 0, 0)', index: 0.48 },
        { color: (this._averageHit ? /* Green */ '#56D45B' : /* Blue */ '#48ABAF'), index: 0.5 },
        { color: 'rgba(0, 0, 0, 0)', index: 0.52 }
      ]
    });
  }


  /** @method
   * @name _animateOscilloscopes
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw both radial and linear point oscilloscopes.</blockquote>
   * @param {number[]} times - The time domain for a given audio bin **/
  _animateOscilloscopes(times) {
    let tick = 0.05;
    let color = '#FFF';
    if (this._averageHit) {
      this._oscilloscopeRotation += tick;
      color = 'rgba(255, 193, 140, .7)'; // Orange
    } else {
      this._oscilloscopeRotation += -tick;
      color = 'rgba(125, 228, 132, 0.25)'; // Green
    }
    // Update radial oscilloscope with time values
    CanvasUtils.drawRadialOscilloscope(this._canvas, {
      points: this._points,
      times: times,
      length: this._fftSize / 2,
      centerX: this._centerX,
      centerY: this._centerY,
      rotation: this._oscilloscopeRotation,
      color: color
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


  /** @method
   * @name _getAverageFrequency
   * @private
   * @memberof FrequencyCircle
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Compute the average value for a given audio bin.</blockquote>
   * @param {number[]} frequencies - The frequency array for a given audio bin
   * @return {number} - The average value for a frequency bin **/
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


/*  ----------  Utils class for this visualisation  ----------  */


class BackgroundStar {


  /** @summary BackgroundStar handle stars in frequency circle.
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>This will display a single canvas with frequency displayed with.</blockquote>
   * @param {number} centerX - The start x origin
   * @param {number} centerY - The start y origin
   * @param {number} [average=0] - The audio bin average value
   * @param {number} [breakpoint=132] - The size and color breakpoint value to be compared with average **/
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


  /** @method
   * @name updatePosition
   * @public
   * @memberof BackgroundStar
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Update the background star position.</blockquote>
   * @param {number} tick - The multiplier value for position variation
   * @param {number} radiusFactor - The star radius variation factor **/
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


  /** @summary OscilloscopeRadialPoint handle each point in circular oscilloscope.
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create a container for oscilloscope point. Edit radius, x and y public attributes.</blockquote>
   * @param {object} options - The oscilloscope radial point option
   * @param {number} options.height - The point height
   * @param {number} options.width - The point width
   * @param {number} options.total - The divider value for angle
   * @param {number} options.index - The numerator value for angle **/
  constructor(options) {
    this._height = options.height;
    this._width = options.width;
    this._total = options.total;
    this._index = options.index;
    this._value = Math.random() * 256;
    this._radius = Math.abs(this._width) / 8;
    // Public attributes
    this.angle = (this._index * 360) / this._total;
    this.x = (this._width / 2) + this._radius * Math.sin((Math.PI / 180) * this.angle);
    this.y = (this._height / 2) + this._radius * Math.cos((Math.PI / 180) * this.angle);
    this.dx = this.x + this._value * Math.sin((Math.PI / 180) * this.angle);
    this.dy = this.y + this._value * Math.cos((Math.PI / 180) * this.angle);
  }


}


export default FrequencyCircle;

import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';
'use strict';


const MAX_CANVAS_WIDTH = 32000;


class Timeline extends VisuComponentMono {


  /** @summary Timeline displays a scrolling audio waveform.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentMono
   * @description <blockquote>Will display a waveform that scrolls over playback. If provided, BPM is visualised as
   * vertical bars with emphasis on main beats according to time signature. It is interactive and will update the player's
   * current time value to match the dragged one. This class extends VisuComponentMono only because it performs an offline
   * analysis on audio and the stereo information are already held in audio buffer.</blockquote>
   * @param {object} options - The timeline options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {object} [options.beat=null] - The beat configuration
   * @param {object} [options.beat.offset=null] - offset before first beat
   * @param {object} [options.beat.bpm=null] - The track bpm
   * @param {object} [options.beat.timeSignature=null] - The track time signature to put emphasis on main beats
   * @param {object} [options.colors] - Timeline color potions
   * @param {object} [options.colors.background='#1D1E25'] - Canvas background color in Hex/RGB/HSL
   * @param {object} [options.colors.track='#12B31D'] - The timeline color in Hex/RGB/HSL
   * @param {object} [options.colors.mainBeat='#56D45B'] - The main beat triangles color in Hex/RGB/HSL
   * @param {object} [options.colors.subBeat='#FF6B67'] - The sub beat triangles color in Hex/RGB/HSL **/
  constructor(options) {
    super(options);

    this._colors = {
      background: options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor,
      track: options.colors ? options.colors.track || ColorUtils.defaultDarkPrimaryColor : ColorUtils.defaultDarkPrimaryColor,
      mainBeat: options.colors ? options.colors.mainBeat || ColorUtils.defaultPrimaryColor : ColorUtils.defaultPrimaryColor,
      subBeat: options.colors ? options.colors.subBeat || ColorUtils.defaultAntiPrimaryColor : ColorUtils.defaultAntiPrimaryColor
    };

    this._canvas.style.backgroundColor = this._colors.background;

    this._canvasSpeed = options.speed ? options.speed : 5.0; // Time in seconds

    this._beat = {
      offset: options.beat ? options.beat.offset : null,
      bpm: options.beat ? options.beat.bpm : null,
      timeSignature: options.beat ? options.beat.timeSignature : null,
    };

    this._canvases = [];
    // Drag canvas utils
    this._isDragging = false;
    this._wasPlaying = false;
    this._draggedTime = 0;
    this._startDrag = {
      x: 0,
      y: 0
    };

    if (this._player.src !== '') {
      this._getPlayerSourceFile();
    }
  }


  /*  ----------  VisuComponentMono overrides  ----------  */



  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The frequency circle options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one **/
  _fillAttributes(options) {
    super._fillAttributes(options);
    this._offlineCtx = null;
    this._offlineBuffer = null;
    // Local event binding
    this._trackLoaded = this._trackLoaded.bind(this);
    this._onProgress = this._onProgress.bind(this);
    this._mouseDown = this._mouseDown.bind(this);
    this._mouseMove = this._mouseMove.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
  }


  /** @method
   * @name _addEvents
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Add component events (resize, play, pause, dbclick).</blockquote> **/
  _addEvents() {
    super._addEvents();
    this._player.addEventListener('loadedmetadata', this._trackLoaded, false);
    this._player.addEventListener('seeking', this._onProgress, false);
    this._canvas.addEventListener('mousedown', this._mouseDown, false);
  }


  /** @method
   * @name _removeEvents
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Remove component events (resize, play, pause, dbclick).</blockquote> **/
  _removeEvents() {
    super._removeEvents();
    this._player.removeEventListener('loadedmetadata', this._trackLoaded, false);
    this._player.removeEventListener('seeking', this._onProgress, false);
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
  _onResize() {
    super._onResize();
    this._fillData();
    this._clearCanvas();
    this._drawTimeline(this._player.currentTime);
  }


  /** @method
   * @name _dblClick
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On double click event callback.</blockquote> **/
  _dblClick() {
    // Required to revoke fullscreen toggle from parent class, as it interferes with drag feature
  }


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit frequency
   * and time analysis.</blockquote> **/
  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      this._drawTimeline(this._player.currentTime);
      requestAnimationFrame(this._processAudioBin);
    }
  }


  /*  ----------  Timeline internal methods  ----------  */


  /** @method
   * @name _trackLoaded
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Player callback on track loaded.</blockquote> **/
  _trackLoaded() {
    cancelAnimationFrame(this._processAudioBin);
    this._clearCanvas(); // Clear previous canvas
    // Do XHR to request file and parse it
    this._getPlayerSourceFile();
  }


  /** @method
   * @name _onProgress
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On progress callback.</blockquote> **/
  _onProgress() {
    this._clearCanvas()
    this._drawTimeline(this._player.currentTime || 0);
  }


  /** @method
   * @name _mouseDown
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Mouse down callback.</blockquote>
   * @param {object} event - The mouse down event **/
  _mouseDown(event) {
    this._isDragging = true;
    this._startDrag.x = event.clientX;
    this._startDrag.y = event.clientY;
    // Save previous playback status and pause only if required
    if (this._player.paused === false) {
      this._wasPlaying = true;
      this._player.pause();
    }

    // Subscribe to drag events
    this._canvas.addEventListener('mousemove', this._mouseMove, false);
    this._canvas.addEventListener('mouseup', this._mouseUp, false);
    this._canvas.addEventListener('mouseout', this._mouseUp, false);
  }


  /** @method
   * @name _mouseDown
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Mouse move callback.</blockquote>
   * @param {object} event - The mouse move event **/
  _mouseMove(event) {
    // Only perform drag code if mouse down was previously fired
    if (this._isDragging === true) {
      const variation = (this._startDrag.x - event.clientX);
      const timeOffset = ((variation * this._canvasSpeed) / this._canvas.width) * 2;
      this._draggedTime = this._player.currentTime + timeOffset;
      this._clearCanvas();
      this._drawTimeline(this._draggedTime);
    }
  }


  /** @method
   * @name _mouseUp
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Mouse up callback.</blockquote> **/
  _mouseUp() {
    this._isDragging = false;
    this._startDrag.x = 0;
    this._startDrag.y = 0;
    this._player.currentTime = this._draggedTime || this._player.currentTime;
    this._draggedTime = null;
    // Restore playback status
    if (this._wasPlaying === true) {
      this._wasPlaying = false;
      this._player.play();
    }
    // Remove drag events
    this._canvas.removeEventListener('mousemove', this._mouseMove, false);
    this._canvas.removeEventListener('mouseup', this._mouseUp, false);
    this._canvas.removeEventListener('mouseout', this._mouseUp, false);
  }


  /** @method
   * @name _processAudioFile
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform an offline analysis on whole track.</blockquote>
   * @param {object} response - HTTP response for audio track to extract buffer from **/
  _processAudioFile(response) {
    // Set offline context according to track duration to get its full samples
    this._offlineCtx = new OfflineAudioContext(2, this._audioCtx.sampleRate * this._player.duration, this._audioCtx.sampleRate);
    this._offlineSource = this._offlineCtx.createBufferSource();
    this._audioCtx.decodeAudioData(response, buffer => {
      this._offlineSource.buffer = buffer;
      this._offlineSource.connect(this._offlineCtx.destination);
      this._offlineSource.start();
      this._offlineCtx.startRendering().then(renderedBuffer => {
        this._offlineBuffer = renderedBuffer;
        this._fillData();
        this._drawTimeline(this._player.currentTime || 0);
      }).catch(function(err) {
        console.log('Rendering failed: ' + err);
      });
    });
  }


  /** @method
   * @name _fillData
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Generate merged data from audio buffer.</blockquote> **/
  _fillData() {
    if (this._offlineBuffer) {
      // Clear any previous canvas
      this._canvases = [];
      // Compute useful values
      const data = this._genScaledMonoData(this._offlineBuffer);
      const step = (this._canvasSpeed * this._offlineBuffer.sampleRate) / this._canvas.width;
      const totalLength = Math.floor((this._offlineBuffer.duration / this._canvasSpeed) * this._canvas.width);
      // Beat bar variables
      const beatOffset = (this._beat.offset / this._canvasSpeed) * this._canvas.width;
      const beatWidth = Math.floor(((1 / (this._beat.bpm / 60)) / this._canvasSpeed) * this._canvas.width); // Computed after first bar is added
      // Beat bar type (modulo time signature give strong beats)
      let beatCount = 0;
      let firstBarDrawn = false;
      // Draw full track on offline canvas
      for (let i = 0; i < totalLength; i += MAX_CANVAS_WIDTH) {
        // create canvas with width of the reduced-in-size buffer's length.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = totalLength - i;
        // Update offline canvas dimension
        canvas.width = (width > MAX_CANVAS_WIDTH) ? MAX_CANVAS_WIDTH : width;
        canvas.height = this._canvas.height;
        // Clear offline context
        ctx.clearRect(0, 0, totalLength, this._canvas.height);
        // draw the canvas
        for (let j = 0; j < width; ++j) {
          const offset = Math.floor((i + j) * step);
          let max = 0.0; // The max value to draw
          // Update maximum value in step range
          for (let k = 0; k < step; ++k) {
            if (data[offset + k] > max) {
              max = data[offset + k];
            }
          }
          // Set waveform color according to sample intensity
          ctx.fillStyle = ColorUtils.lightenDarkenColor(this._colors.track, (max * 100)); // 100, not 255 to avoid full white on sample at max value
          // Update max to scale in half canvas height
          max = Math.floor(max * ((this._canvas.height * .9) / 2)); // Scale on 90% height max
          // Fill up and down side of timeline
          ctx.fillRect(j, this._canvas.height / 2, 1, -max);
          ctx.fillRect(j, this._canvas.height / 2, 1, +max);
          // Add tiny centered line
          ctx.fillRect((i + j), (this._canvas.height / 2) - 0.5, 1, 1);
          // Draw beat bar
          if (this._beat.bpm !== null && this._beat.offset !== null) {
            if (j >= Math.floor(beatOffset)) {
              if (firstBarDrawn === false) {
                firstBarDrawn = true;
                this._drawBeatBar(beatCount, canvas, ctx, j);
                ++beatCount;
              } else if ((j - Math.floor(beatOffset)) % beatWidth === 0) {
                this._drawBeatBar(beatCount, canvas, ctx, j);
                ++beatCount;
              }
            }
          }
        }
        // Store canvas to properly animate Timeline on progress
        this._canvases.push(canvas);
      }
    }
  }


  /** @method
   * @name _drawBeatBar
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a beat bard with its triangle with color that depends on main beat or sub beat.</blockquote>
   * @param {object} beatCount - The beat number from first
   * @param {object} canvas - The canvas to draw in
   * @param {object} ctx - The associated context
   * @param {number} j - The y value **/
  _drawBeatBar(beatCount, canvas, ctx, j) {
    // Determine beat bar color
    if (beatCount % this._beat.timeSignature === 0) {
      ctx.fillStyle = 'white';
    } else {
      ctx.fillStyle = 'grey';
    }
    // Beat bar drawing
    ctx.fillRect(j, 9, 1, this._canvas.height - 18);
    // Determine beat triangle color
    if (beatCount % this._beat.timeSignature === 0) {
      ctx.fillStyle = this._colors.mainBeat;
    } else {
      ctx.fillStyle = this._colors.subBeat;
    }
    // Upper triangle
    CanvasUtils.drawTriangle(canvas, {
      x: j,
      y: 4,
      radius: 6,
      top: 12
    });
    // Down triangle
    CanvasUtils.drawTriangle(canvas, {
      x: j,
      y: this._canvas.height - 4,
      radius: 6,
      top: this._canvas.height - 12
    });
  }


  /** @method
   * @name _genScaledMonoData
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Merged L/R Sub sample channel data to compute average value, depending on bar count.</blockquote>
   * @param {object} buffer - Audio buffer
   * @return {number[]} Array of height per sub samples **/
  _genScaledMonoData(buffer) {
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);
    const output = [];

    for (let i = 0; i < dataL.length; ++i) {
      output.push((Math.abs(dataL[i]) + Math.abs(dataR[i])) / 2);
    }

    return output;
  }


  /** @method
   * @name _drawTimeline
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw timeline with a given progress.</blockquote>
   * @param {number} time - Track current time **/
  _drawTimeline(time) {
    const center = Math.floor(time * this._canvas.width / this._canvasSpeed);
    let leftEdgeIndex = Math.floor((center - (this._canvas.width / 2)) / MAX_CANVAS_WIDTH);
    if (leftEdgeIndex < 0) {
      leftEdgeIndex = 0;
    }

    let rightEdgeIndex = Math.floor((center + (this._canvas.width / 2)) / MAX_CANVAS_WIDTH);
    if (rightEdgeIndex >= this._canvases.length) {
      rightEdgeIndex = this._canvases.length - 1;
    }

    for (let i = leftEdgeIndex; i <= rightEdgeIndex; ++i) {
      this._ctx.drawImage(this._canvases[i], (this._canvas.width / 2) - center + (MAX_CANVAS_WIDTH * i), 0);
    }
    // Draw centered vertical bar
    this._ctx.fillStyle = ColorUtils.defaultAntiPrimaryColor;
    this._ctx.fillRect(this._canvas.width / 2, 3, 3, this._canvas.height - 6);
    this._ctx.strokeStyle = 'black';
    this._ctx.lineWidth = 1;
    this._ctx.strokeRect(this._canvas.width / 2, 3, 3, this._canvas.height - 6);
  }


  /** @method
   * @name _getPlayerSourceFile
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fetch audio file using xmlHTTP request.</blockquote> **/
  _getPlayerSourceFile() {
    const request = new XMLHttpRequest();
    request.open('GET', this._player.src, true);
    request.responseType = 'arraybuffer';
    request.onload = () => { this._processAudioFile(request.response); };
    request.send();
  }


  /*  ----------  Timeline public methods  ----------  */


  /** @method
   * @name updateBeatInfo
   * @public
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Update the beat position.</blockquote>
   * @param {object} options - Track beat options
   * @param {number} [options.beat.offset=null] - offset before first beat
   * @param {number} [options.beat.bpm=null] - The track bpm
   * @param {number} [options.beat.timeSignature=null] - The track time signature to emphasis main beats **/
  updateBeatInfo(options) {
    this._beat = {
      offset: options.offset,
      bpm: options.bpm,
      timeSignature: options.timeSignature
    };
  }


}


export default Timeline;

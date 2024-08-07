import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';


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
   * @param {object} [options.wave] - The wave options
   * @param {object} [options.wave.align='center'] - The alignment of the wave, can be either 'top', 'center' or 'bottom'
   * @param {object} [options.colors] - Timeline color potions
   * @param {object} [options.colors.background='#1D1E25'] - Canvas background color in Hex/RGB/HSL
   * @param {object} [options.colors.track='#12B31D'] - The timeline color in Hex/RGB/HSL
   * @param {object} [options.colors.mainBeat='#56D45B'] - The main beat triangles color in Hex/RGB/HSL
   * @param {object} [options.colors.subBeat='#FF6B67'] - The sub beat triangles color in Hex/RGB/HSL
   * @param {object[]} [options.hotCues=[]] - Hotcues sorted array to load waveform with. Each array item must contain a time key with its value **/
  constructor(options) {
    super(options);

    this._colors = {
      background: options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor,
      track: options.colors ? options.colors.track || ColorUtils.defaultDarkPrimaryColor : ColorUtils.defaultDarkPrimaryColor,
      mainBeat: options.colors ? options.colors.mainBeat || ColorUtils.defaultPrimaryColor : ColorUtils.defaultPrimaryColor,
      subBeat: options.colors ? options.colors.subBeat || ColorUtils.defaultAntiPrimaryColor : ColorUtils.defaultAntiPrimaryColor,
      loop: options.colors ? options.colors.loop || ColorUtils.defaultLoopColor : ColorUtils.defaultLoopColor,
      loopAlpha: options.colors ? options.colors.loopAlpha || ColorUtils.defaultLoopAlphaColor : ColorUtils.defaultLoopAlphaColor
    };

    this._canvas.style.backgroundColor = this._colors.background;

    this._canvasSpeed = options.speed ? options.speed : 5.0; // Time in seconds

    this._beat = {
      offset: options.beat ? options.beat.offset : null,
      bpm: options.beat ? options.beat.bpm : null,
      timeSignature: options.beat ? options.beat.timeSignature : null,
    };

    this._wave = {
      align: options.wave ? options.wave.align || 'center' : 'center',
      scale: options.wave ? options.wave.scale || .95 : .95
    };
    // HotCues and beats arrays
    this._hotCues = [...options.hotCues];
    this._beatsArray = [];
    this._beatCount = '0.0';
    // Loop utils
    this._loopEntry = null;
    this._loopEnd = null;
    this._loopBuffer = null;
    this._isLooping = false;
    this._loopStartedAt = 0;
    this._playerPausedAt = 0;
    this._audioBuffer = null; // Store audio buffer to avoid multiple loading of file during loop process
    // Offline canvas -> main canvas is divided with 32k px wide canvases
    this._canvases = [];
    this._cueCanvases = [];
    this._beatCanvases = [];
    this._loopCanvases = [];
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


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  --------------------------------------  VISUCOMPONENTMONO OVERRIDES  -----------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */



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
    if (this._noEvents === false) {
      super._addEvents();
      this._player.addEventListener('loadedmetadata', this._trackLoaded, false);
      this._player.addEventListener('timeupdate', this._onProgress, false);
      this._canvas.addEventListener('mousedown', this._mouseDown, false);

      if (!this._player.paused) {
        this._isPlaying = true;
        requestAnimationFrame(this._processAudioBin);
      }
    }
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
    this._player.removeEventListener('timeupdate', this._onProgress, false);
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


  _clearCanvas(clearBeat, clearHotCue, clearLoop) {
    super._clearCanvas();
    // Clear beat bars canvas
    if (clearBeat) {
      for (let i = 0; i < this._beatCanvases.length; ++i) {
        this._beatCanvases[i].getContext('2d').clearRect(0, 0, this._beatCanvases[i].width, this._beatCanvases[i].height);
      }
    }
    // Clear hot cue canvas
    if (clearHotCue) {
      for (let i = 0; i < this._cueCanvases.length; ++i) {
        this._cueCanvases[i].getContext('2d').clearRect(0, 0, this._cueCanvases[i].width, this._cueCanvases[i].height);
      }
    }
    // Clear loop canvas
    if (clearLoop) {
      for (let i = 0; i < this._loopCanvases.length; ++i) {
        this._loopCanvases[i].getContext('2d').clearRect(0, 0, this._loopCanvases[i].width, this._loopCanvases[i].height);
      }
    }
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
    if (this._isPlaying === true || this._isLooping === true) {
      // So UI keeps being update while player is virtually paused
      if (this._isLooping === true) {
        this._player.currentTime = this._loopEntry.time + (this._playerPausedAt + this._audioCtx.currentTime - this._loopStartedAt) % (this._loopEnd.time - this._loopEntry.time);
      }
      // Draw timeline and request new process in raf
      this._clearCanvas();
      this._drawTimeline(this._player.currentTime);
      requestAnimationFrame(this._processAudioBin);
    }
  }


  /*  ----------  Timeline internal methods  ----------  */


  _startLoopSequence(immediateLoop) {
    if (immediateLoop) {
      this._player.currentTime = this._loopEntry.time;
    }

    const workingBuffer = this._audioBuffer.slice();
    this._audioCtx.decodeAudioData(workingBuffer, buffer => {
      this._loopBuffer = this._audioCtx.createBufferSource();
      this._loopBuffer.buffer = buffer;
      this._loopBuffer.connect(this._audioCtx.destination);
      this._loopBuffer.loop = true;
      this._loopBuffer.loopStart = this._loopEntry.time;
      this._loopBuffer.loopEnd = this._loopEnd.time;

      this._loopBuffer.start(0, this._player.currentTime);
      this._player.pause();

      this._loopStartedAt = this._audioCtx.currentTime;
      this._playerPausedAt = this._player.currentTime;
      this._isLooping = true;
      this._processAudioBin();
    });
  }


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
    this._clearCanvas();
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
    const rect = event.target.getBoundingClientRect();
    // X coord must be relative to cuent canvas. Check half width to center coord, then add center position, module MAX_CANVAS_WIDTH
    const x = ((event.clientX - rect.left) - (this._canvas.width / 2) + ((this._player.currentTime / this._canvasSpeed) * this._canvas.width)) % MAX_CANVAS_WIDTH;
    const y = event.clientY - rect.top;
    const hotCue = this._hotCueClicked(x, y);
    if (hotCue) {
      this._player.currentTime = hotCue.time;
      this._clearCanvas();
      this._drawTimeline(this._player.currentTime);
    } else {
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
    this._audioBuffer = response.slice();
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
      this._cueCanvases = [];
      this._beatCanvases = [];
      this._loopCanvases = [];
      // Compute useful values
      const data = this._genScaledMonoData(this._offlineBuffer);
      const step = (this._canvasSpeed * this._offlineBuffer.sampleRate) / this._canvas.width;
      const totalLength = Math.round((this._offlineBuffer.duration / this._canvasSpeed) * this._canvas.width);
      // Draw full track on offline canvas
      for (let i = 0; i < totalLength; i += MAX_CANVAS_WIDTH) {
        // Create canvas with width of the reduced-in-size buffer's length.
        const canvas = document.createElement('CANVAS');
        const ctx = canvas.getContext('2d');
        const cueCanvas = document.createElement('CANVAS');
        const beatCanvas = document.createElement('CANVAS');
        const loopCanvas = document.createElement('CANVAS');

        let width = totalLength - i;
        width = (width > MAX_CANVAS_WIDTH) ? MAX_CANVAS_WIDTH : width;
        // Update offline canvas dimension
        canvas.width = width;
        canvas.height = this._canvas.height;
        cueCanvas.width = width;
        cueCanvas.height = this._canvas.height;
        beatCanvas.width = width;
        beatCanvas.height = this._canvas.height;
        loopCanvas.width = width;
        loopCanvas.height = this._canvas.height;
        // Clear offline context
        ctx.clearRect(0, 0, totalLength, this._canvas.height);
        // Draw the canvas
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
          ctx.fillStyle = ColorUtils.lightenDarkenColor(this._colors.track, (max * 190)); // 190, not 255 to avoid full white on sample at max value
          // Update max to scale in half canvas height
          max = Math.floor(max * (this._canvas.height * this._wave.scale));
          if (this._wave.align === 'center') {
            // Fill up and down side of timeline
            ctx.fillRect(j, this._canvas.height / 2, 1, -(max / 2));
            ctx.fillRect(j, this._canvas.height / 2, 1, (max / 2));
            // Add tiny centered line
            ctx.fillRect(j, (this._canvas.height / 2) - 0.5, 1, 1);
          } else if (this._wave.align === 'top') {
            ctx.fillRect(j, 1, 1, max);
          } else if (this._wave.align === 'bottom') {
            ctx.fillRect(j, this._canvas.height - 1, 1, -max);
          }
        }
        // Store canvas to properly animate Timeline on progress
        this._canvases.push(canvas);
        this._cueCanvases.push(cueCanvas);
        this._beatCanvases.push(beatCanvas);
        this._loopCanvases.push(loopCanvas);
      }

      if (this._beat.bpm !== null && this._beat.offset !== null) {
        this._fillBeatBars({
          totalWidth: (this._offlineBuffer.duration / this._canvasSpeed) * this._canvas.width,
          beatWidth: ((1 / (this._beat.bpm / 60)) / this._canvasSpeed) * this._canvas.width,
          beatOffset: (this._beat.offset / this._canvasSpeed) * this._canvas.width
        });
      }

      this._drawHotCues(); // Load hot cues if any
    }
  }


  _fillBeatBars(options) {
    let beatOffset = options.beatOffset;
    let canvasIndex = 0; // The offline canvas to consider
    // We floor because last beat is pretty irrelevant
    for (let i = 0; i < Math.floor(options.totalWidth / options.beatWidth); ++i) {
      // We reached MAX_CANVAS_WIDTH, using next offline canvas
      if ((i * options.beatWidth + beatOffset) >= MAX_CANVAS_WIDTH + (canvasIndex * MAX_CANVAS_WIDTH)) {
        // Increment offline canvas to use
        ++canvasIndex;
        // When changing canvas, the beatOffset is dependant to last beat saved position.
        for (let j = 1; j < canvasIndex; ++i) {
          // We iterate for each canvas, and sums the offset per canvas so they cumulates
          beatOffset += options.beatWidth - ((MAX_CANVAS_WIDTH * j) - (this._beatsArray[this._beatsArray.length - 1].xPos % (MAX_CANVAS_WIDTH * j)));
        }
      }
      // Draw beat bar, x position is loop index times a space between beats, plus the beat offset,
      // modulo max canvas width to fit in offline canvases
      this._drawBeatBar(i, (i * options.beatWidth) + beatOffset, canvasIndex);
    }
  }


  /** @method
   * @name _drawBeatBar
   * @private
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a beat bar with its triangle with color that depends on main beat or sub beat.</blockquote>
   * @param {object} beatCount - The beat number from first
   * @param {object} canvas - The canvas to draw in
   * @param {object} ctx - The associated context
   * @param {number} j - The y value **/
  _drawBeatBar(beatCount, x, canvasIndex) {
    const canvas = this._beatCanvases[canvasIndex];
    const ctx = canvas.getContext('2d');
    // Determine beat bar color
    if (beatCount % this._beat.timeSignature === 0) {
      ctx.fillStyle = 'white';
    } else {
      ctx.fillStyle = 'grey';
    }
    // Beat bar drawing
    ctx.fillRect(x % MAX_CANVAS_WIDTH, 9, 1, this._canvas.height - 18);
    // Determine beat triangle color
    if (beatCount % this._beat.timeSignature === 0) {
      ctx.fillStyle = this._colors.mainBeat;
    } else {
      ctx.fillStyle = this._colors.subBeat;
    }
    // Upper triangle
    CanvasUtils.drawTriangle(canvas, {
      x: x % MAX_CANVAS_WIDTH,
      y: 1,
      radius: 6,
      top: 10
    });
    // Down triangle
    CanvasUtils.drawTriangle(canvas, {
      x: x % MAX_CANVAS_WIDTH,
      y: this._canvas.height - 1,
      radius: 6,
      top: this._canvas.height - 10
    });
    // Update beats array with new beat bar
    this._beatsArray.push({
      primaryBeat: (beatCount % this._beat.timeSignature === 0),
      beatCount: beatCount,
      xPos: x,
      time: x * this._canvasSpeed / this._canvas.width,
      canvasIndex: canvasIndex
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
      this._ctx.drawImage(this._beatCanvases[i], (this._canvas.width / 2) - center + (MAX_CANVAS_WIDTH * i), 0);
      this._ctx.drawImage(this._cueCanvases[i], (this._canvas.width / 2) - center + (MAX_CANVAS_WIDTH * i), 0);
      this._ctx.drawImage(this._loopCanvases[i], (this._canvas.width / 2) - center + (MAX_CANVAS_WIDTH * i), 0);
    }
    // Draw centered vertical bar
    this._ctx.fillStyle = ColorUtils.defaultAntiPrimaryColor;
    this._ctx.fillRect(this._canvas.width / 2, 1, 3, this._canvas.height - 2);
    this._ctx.strokeStyle = 'black';
    this._ctx.lineWidth = 1;
    this._ctx.strokeRect(this._canvas.width / 2, 1, 3, this._canvas.height - 2);
    // Draw beat count next to centered line
    if (this._beatsArray.length > 0) {
      let label = '0.0';
      for (let i = 0; i < this._beatsArray.length; ++i) {
        if (time <= this._beatsArray[i].time) {
          let measureCount = Math.floor((this._beatsArray[i].beatCount - 1) / this._beat.timeSignature) + 1;
          let timeCount = (this._beatsArray[i].beatCount - 1) % this._beat.timeSignature;
          label = `${measureCount}.${timeCount === -1 ? 1 : timeCount + 1}`;
          break;
        }
      }
      let top = 14;
      if (this._wave.align === 'top') {
        top = this._canvas.height - 4;
      }
      CanvasUtils.drawBeatCount(this._canvas, {
        label: label,
        x: (this._canvas.width / 2) + 8,
        y: top
      });
    }
  }


  _drawHotCues() {
    for (let i = 0; i < this._hotCues.length; ++i) {
      this._drawHotCue(this._hotCues[i]);
    }
  }


  _drawHotCue(hotCue) {
    let top = 2;
    if (this._wave.align === 'top') {
      top = this._canvas.height - 20;
    }
    CanvasUtils.drawHotCue(this._cueCanvases[hotCue.canvasIndex], {
      x: hotCue.xPos - (hotCue.canvasIndex * MAX_CANVAS_WIDTH) + (18 / 2),
      y: top,
      size: 18,
      label: hotCue.label || hotCue.number,
      color: hotCue.color
    });
  }


  _hotCueClicked(x, y) {
    if (y > 2 && y < 20) {
      for (let i = 0; i < this._hotCues.length; ++i) {
        let xPos = this._hotCues[i].xPos - (this._hotCues[i].canvasIndex * MAX_CANVAS_WIDTH);
        if (x > xPos && x < (xPos + 18)) {
          return this._hotCues[i];
        }
      }
    }

    return false;
  }


  _drawLoop() {
    if (this._loopEntry) {
      const ctx = this._loopCanvases[this._loopEntry.canvasIndex].getContext('2d');
      ctx.fillStyle = this._colors.loop;
      CanvasUtils.drawTriangle(this._loopCanvases[this._loopEntry.canvasIndex], {
        x: this._loopEntry.xPos % MAX_CANVAS_WIDTH + 1,
        y: 1,
        radius: 9,
        top: 14
      });
      CanvasUtils.drawTriangle(this._loopCanvases[this._loopEntry.canvasIndex], {
        x: this._loopEntry.xPos % MAX_CANVAS_WIDTH + 1,
        y: this._loopCanvases[this._loopEntry.canvasIndex].height - 1,
        radius: 9,
        top: this._loopCanvases[this._loopEntry.canvasIndex].height - 14
      });
    }

    if (this._loopEnd) {
      const ctx = this._loopCanvases[this._loopEntry.canvasIndex].getContext('2d');
      ctx.fillStyle = this._colors.loop;
      CanvasUtils.drawTriangle(this._loopCanvases[this._loopEnd.canvasIndex], {
        x: this._loopEnd.xPos % MAX_CANVAS_WIDTH + 1,
        y: 1,
        radius: 9,
        top: 14
      });
      CanvasUtils.drawTriangle(this._loopCanvases[this._loopEnd.canvasIndex], {
        x: this._loopEnd.xPos % MAX_CANVAS_WIDTH + 1,
        y: this._loopCanvases[this._loopEnd.canvasIndex].height - 1,
        radius: 9,
        top: this._loopCanvases[this._loopEnd.canvasIndex].height - 14
      });
    }

    if (this._loopEntry && this._loopEnd) {
      const ctx = this._loopCanvases[this._loopEntry.canvasIndex].getContext('2d');
      ctx.fillStyle = this._colors.loopAlpha;
      if (this._loopEntry.canvasIndex === this._loopEnd.canvasIndex) {
        ctx.fillRect(this._loopEntry.xPos, 30, this._loopEnd.xPos - this._loopEntry.xPos, this._loopCanvases[this._loopEntry.canvasIndex].height - 60);
      }
    }
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


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  ----------------------------------------  TIMELINE PUBLIC METHODS  -------------------------------------------  */
  /*                                                                                                                  */
  /*  These methods allow the caller to update the beat info (on change track for example), or to add/remove a hot    */
  /*  cue in the timeline, or to configure loop entry and exit                                                        */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name updateBeatInfo
   * @public
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Update the beat values. To be calle don change track</blockquote>
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


  /** @method
   * @name setHotCuePoint
   * @public
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Define a HotCue point. It will be attached to the nearest bar. It will only be
   * attached if no hotcue is registered on the targeted bar.</blockquote>
   * @return {object} The hotcue object with its information **/
  setHotCuePoint(options) {
    let matchingBeat = this.getClosestBeat();
    // Search for existing hotcue at the target bar
    let existingHotCue = null;
    for (let i = 0; i < this._hotCues.length; ++i) {
      if (this._hotCues[i].beatCount === matchingBeat.beatCount) {
        existingHotCue = this._hotCues[i];
        break;
      }
    }
    // Only append hotcue if it's not already registered, return existing hot cue otherwise
    if (!existingHotCue) {
      // Save hot cue and return to the sender
      matchingBeat.number = this._hotCues.length + 1; // Attach hotcue number
      matchingBeat.time = matchingBeat.xPos * this._canvasSpeed / this._canvas.width; // Save the bar timecode into the hotcue object
      matchingBeat.label = this._hotCues.length + 1; // Default label
      if (options.label) {
        matchingBeat.label = options.label;
      }
      if (options.color) {
        matchingBeat.color = options.color;
      }
      // Otherwise save hot cue in stack
      this._hotCues.push(matchingBeat);
      // Draw hotcues if any
      this._clearCanvas();
      this._drawHotCue(matchingBeat);
      this._drawTimeline(this._player.currentTime);

      return matchingBeat;
    } else {
      return existingHotCue;
    }
  }


  updateHotCuePoint(hotCue, options) {
    for (let i = 0; i < this._hotCues.length; ++i) {
      if (this._hotCues[i].beatCount === hotCue.beatCount) {
        if (options.label) {
          this._hotCues[i].label = options.label;
        }
        if (options.color) {
          this._hotCues[i].color = options.color;
        }
      }
    }
    this._clearCanvas(false, true);
    this._drawHotCues();
    this._drawTimeline(this._player.currentTime);
  }


  removeHotCuePoint(hotcue) {
    for (let i = 0; i < this._hotCues.length; ++i) {
      if (this._hotCues[i].beatCount === hotcue.beatCount) {
        this._hotCues.splice(i, 1);
        this._clearCanvas(false, true);
        this._drawHotCues();
        this._drawTimeline(this._player.currentTime);
        break;
      }
    }
  }


  setLoopEntryPoint() {
    this._loopEntry = this.getClosestBeat();
    this._clearCanvas(false, false, true);
    this._drawLoop();
    this._drawTimeline(this._player.currentTime);
  }


  setLoopEndPoint(beatDuration) {
    if (this._loopEntry) {
      // Determine end by closest beat
      if (!beatDuration) {
        let matchingBeat = this.getClosestBeat();
        // Only save end if not equal to entry and is located after in time
        if (matchingBeat !== this._loopEntry && this._loopEntry.time < matchingBeat.time) {
          this._loopEnd = matchingBeat;
        }
      } else { // Determine end by a beat count after loop entry
        if (this._loopEntry.beatCount + beatDuration < this._beatsArray.length) {
          this._loopEnd = this._beatsArray[this._loopEntry.beatCount + beatDuration];
        } else {
          this._loopEnd = this._beatsArray[this._beatsArray.length - 1];
        }
      }

      this._clearCanvas(false, false, true);
      this._drawLoop();
      this._drawTimeline(this._player.currentTime);
      //this._startLoopSequence(!beatDuration);
    }
  }


  exitLoop() {
    //this._loopBuffer.stop();
    //this._player.play();
    this._loopEntry = null;
    this._loopEnd = null;
    this._loopBuffer = null;
    this._isLooping = false;
    this._loopStartedAt = 0;
    this._playerPausedAt = 0;
    this._clearCanvas(false, false, true);
    this._drawTimeline(this._player.currentTime);
  }


  /** @method
   * @name getClosestBeat
   * @public
   * @memberof Timeline
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote></blockquote> **/
  getClosestBeat(timeOnly = false) {
    // The center coordinate when this method is called
    const center = Math.floor(this._player.currentTime * this._canvas.width / this._canvasSpeed);
    let matchingBeat = {};
    // Find nearest beat to process
    for (let i = 0; i < this._beatsArray.length; ++i) {
      // We now have the upper beat, compare with previous one to find nearest
      if (this._beatsArray[i].xPos > center) {
        // Take previous bar if click was closer to it
        if (i - 1 > 0 && (this._beatsArray[i].xPos - center) > (center - this._beatsArray[i - 1].xPos)) {
          matchingBeat = this._beatsArray[i - 1];
          break;
        } else { // Take curent bar otherwise
          matchingBeat = this._beatsArray[i];
          break;
        }
      }
    }
    // Only return time if requested
    if (timeOnly) {
      return matchingBeat.time;
    }

    return matchingBeat;
  }


}


export default Timeline;

import VisuComponentStereo from '../utils/VisuComponentStereo.js';


class Spectrum extends VisuComponentStereo {


  /** @summary Spectrum displays real time audio frequencies as vertical bars that scroll over time
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentStereo
   * @description <blockquote>.</blockquote>
   * @param {object} options - The spectrum options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {boolean} [options.merged=false] - Merge left and right channel into one output
   * @param {boolean} [options.scale=false] - The peak meter legend
   * @param {boolean} [options.colorSmoothing=false] - Display color intensity with a gradient to next sample value **/
  constructor(options) {
    super(options);
    this._updateDimensions();
    this._createLogarithmicScaleHeights();
    // Update canvas CSS background color
    const bgColor = 'black';
    if (this._merged === true) {
      this._canvasL.style.backgroundColor = bgColor;
    } else {
      this._canvasL.style.backgroundColor = bgColor;
      this._canvasR.style.backgroundColor = bgColor;
    }
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  -------------------------------------  VISUCOMPONENTSTEREO OVERRIDES  ----------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The spectrum options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {boolean} [options.scale=false] - The peak meter legend
   * @param {boolean} [options.colorSmoothing=false] - Display color intensity with a gradient to next sample value **/
  _fillAttributes(options) {
    super._fillAttributes(options);
    // Spectrum specific attributes
    this._scaleType = options.scale || 'linear';
    this._colorSmoothing = options.colorSmoothing || false;
    this._canvasSpeed = 1; // Canvas offset per bin
    // Used to animate canvas on audio bins analysis
    this._bufferCanvas = null;
    this._bufferCtx = null;
    // Display utils
    this._dom.settings = null;
    this._dom.settingsPanel = null;
    this._dimension = {
      height: null,
      canvasHeight: null,
      width: null
    };
    this._logScale = [];
    // Event binding
    this._settingsClicked = this._settingsClicked.bind(this);
    this._clickedElsewhere = this._clickedElsewhere.bind(this);
  }


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    super._buildUI();
    this._bufferCanvas = document.createElement('CANVAS');
    this._bufferCtx = this._bufferCanvas.getContext('2d');

    if (this._merged === true) {
      this._dom.container.removeChild(this._canvasR);
    }
    // Update canvas dimensions
    this._canvasL.width = this._dimension.width;
    this._canvasL.height = this._dimension.canvasHeight;
    this._canvasR.width = this._dimension.width;
    this._canvasR.height = this._dimension.canvasHeight;
    this._bufferCanvas.width = this._dimension.width;
    this._bufferCanvas.height = this._dimension.canvasHeight;
    // Create option button
    const parser = new DOMParser();
    this._dom.settings = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/></svg>`, 'image/svg+xml').documentElement;
    this._dom.settings.classList.add('audio-spectrum-settings');
    this._dom.settingsPanel = document.createElement('DIV');
    this._dom.settingsPanel.classList.add('audio-spectrum-settings-panel');
    this._dom.settingsPanel.innerHTML = `
      <h3>Settings</h3>
      <form>
        <p class="legend">Scale:</p>
        <label for="linear">Linear</label>
        <input type="radio" id="id-linear" name="scale" value="linear" ${this._scaleType === 'linear' ? 'checked' : ''}>
        <label for="logarithmic">Logarithmic</label>
        <input type="radio" id="id-logarithmic" name="scale" value="logarithmic" ${this._scaleType === 'logarithmic' ? 'checked' : ''}>
        <p class="smooth-color">
          <label for="smoothColor">Smooth colors</label>
          <input type="checkbox" id="smoothColor" name="smoothColor" ${this._colorSmoothing ? 'checked' : ''}>
        </p>
      </form>
    `;
    const form = this._dom.settingsPanel.querySelector('form');
    form.addEventListener('change', event => {
      event.preventDefault(); // Prevent location redirection with params
      const data = new FormData(form);
      const output = [];
      // Iterate over radios to extract values
      for (const entry of data) {
        output.push(entry[1]);
      }
      // Update canvas scale
      this._scaleType = output[0];
      // Set color smoothing from checkbox
      this._colorSmoothing = (output[1] === 'on');
    }, false);
    // Add display canvas to renderTo parent
    this._dom.container.appendChild(this._dom.settingsPanel); // Append panel before to emulate z-index under settings button w/ no scss rules of z-index
    this._dom.container.appendChild(this._dom.settings);
    this._dom.settings.addEventListener('click', this._settingsClicked, false);
  }


  /** @method
   * @name _removeEvents
   * @private
   * @override
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Add component events (resize, play, pause, dbclick).</blockquote> **/
  _removeEvents() {
    super._removeEvents();
    document.body.removeEventListener('click', this._clickedElsewhere, false);
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
  _onResize() {
    super._onResize();
    this._updateDimensions();
    this._createLogarithmicScaleHeights();
    // Update canvas dimensions
    this._canvasL.width = this._dimension.width;
    this._canvasL.height = this._dimension.canvasHeight;

    if (this._merged === false) {
      this._canvasR.width = this._dimension.width;
      this._canvasR.height = this._dimension.canvasHeight;
    }

    this._bufferCanvas.width = this._dimension.width;
    this._bufferCanvas.height = this._dimension.canvasHeight;
  }


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit frequency
   * and time analysis.</blockquote> **/
  _processAudioBin() {
    if (this._isPlaying === true) {
      if (this._merged === true) {
        this._mergedStereoAnalysis();
      } else {
        this._stereoAnalysis();
      }

      requestAnimationFrame(this._processAudioBin);
    }
  }


  /*  ----------  Spectrum internal methods  ----------  */


  /** @method
   * @name _mergedStereoAnalysis
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform a merged Left and Right analysis with 32 bit time domain data.</blockquote> **/
  _mergedStereoAnalysis() {
    const frequencies = new Uint8Array(this._nodes.analyser.frequencyBinCount);
    this._nodes.analyser.getByteFrequencyData(frequencies);
    this._drawSpectrogramForFrequencyBin(this._canvasL, frequencies);
  }


  /** @method
   * @name _stereoAnalysis
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform a separated Left and Right analysis with 32 bit time domain data.</blockquote> **/
  _stereoAnalysis() {
    const frequenciesL = new Uint8Array(this._nodes.analyserL.frequencyBinCount);
    const frequenciesR = new Uint8Array(this._nodes.analyserR.frequencyBinCount);
    this._nodes.analyserL.getByteFrequencyData(frequenciesL);
    this._nodes.analyserR.getByteFrequencyData(frequenciesR);
    this._drawSpectrogramForFrequencyBin(this._canvasL, frequenciesL);
    this._drawSpectrogramForFrequencyBin(this._canvasR, frequenciesR);
  }


  /** @method
   * @name _updateDimensions
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Usually called on resize event, update canvas dimension to fit render to DOM object.</blockquote> **/
  _updateDimensions() {
    this._dimension.width = this._renderTo.offsetWidth - 2;  // 2px borders

    if (this._merged === true) {
      this._dimension.height = this._renderTo.offsetHeight - 2; // 2px borders
      this._dimension.canvasHeight = this._dimension.height;
    } else {
      this._dimension.height = this._renderTo.offsetHeight - 4; // 2px borders times two channels
      this._dimension.canvasHeight = this._dimension.height / 2;
    }
  }


  /** @method
   * @name _settingsClicked
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Spectrum settings button callback.</blockquote> **/
  _settingsClicked() {
    const opened = this._dom.settingsPanel.classList.contains('opened');
    if (opened === false) { // If opened, settings closure will be handled in clickedElsewhere
      this._dom.settings.classList.add('opened');
      this._dom.settingsPanel.classList.add('opened');
      document.body.addEventListener('click', this._clickedElsewhere, false);
    }
  }


  /** @method
   * @name _clickedElsewhere
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Callback when a clicked is detected and settings context is open.</blockquote>
   * @param {object} event - The click event **/
  _clickedElsewhere(event) {
    if (!event.target.closest('.audio-spectrum-settings') && !event.target.closest('.audio-spectrum-settings-panel')) {
      this._dom.settings.classList.remove('opened');
      this._dom.settingsPanel.classList.remove('opened');
      document.body.removeEventListener('click', this._clickedElsewhere, false);
    }
  }


  /** @method
   * @name _drawSpectrogramForFrequencyBin
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw a vertical ray representing the audio frequencies at process time.</blockquote>
   * @param {object} canvas - The canvas to draw spectrum ray into
   * @param {Uint8Array} frequencies - The frequencies for a given audio bin **/
  _drawSpectrogramForFrequencyBin(canvas, frequencies) {
    const ctx = canvas.getContext('2d');
    // Copy previous image
    this._bufferCtx.drawImage(canvas, 0, 0, this._dimension.width, this._dimension.canvasHeight);
    // Array length is always (fftSize / 2)
    for (let i = 0; i < frequencies.length; ++i) {
      if (this._scaleType === 'linear') {
        this._fillRectLinear(ctx, frequencies, i);
      } else {
        this._fillRectLogarithm(ctx, frequencies, i);
      }
    }
    // Offset canvas to the left and paste stored image
    ctx.translate(-this._canvasSpeed, 0);
    ctx.drawImage(this._bufferCanvas, 0, 0, this._dimension.width, this._dimension.canvasHeight, 0, 0, this._dimension.width, this._dimension.canvasHeight);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transformation matrix
  }


  /** @method
   * @name _drawSpectrogramForFrequencyBin
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw the vertical ray with a linear scale.</blockquote>
   * @param {object} ctx - The canvas context
   * @param {Uint8Array} frequencies - The frequencies for a given audio bin
   * @param {number} i - The index to scale linearly **/
  _fillRectLinear(ctx, frequencies, i) {
    const scaledHeight = this._scaleLinearIndexToHeight(i);
    const frequencyHeight = this._dimension.canvasHeight / frequencies.length;
    if (i === 0 || !this._colorSmoothing) {
      ctx.fillStyle = `rgb(${frequencies[i]}, ${frequencies[i]}, ${frequencies[i]})`;
    } else {
      const gradient = ctx.createLinearGradient(
        0, this._dimension.canvasHeight - scaledHeight - frequencyHeight, // X0/Y0
        0, this._dimension.canvasHeight - scaledHeight // X1/Y1
      );
      // Add color stops from current color to previous sample color
      gradient.addColorStop(0, `rgb(${frequencies[i]}, ${frequencies[i]}, ${frequencies[i]})`);
      gradient.addColorStop(1, `rgb(${frequencies[i - 1]}, ${frequencies[i - 1]}, ${frequencies[i - 1]})`);
      ctx.fillStyle = gradient;
    }
    // Linear scale
    ctx.fillRect(
      this._dimension.width - this._canvasSpeed, // X pos
      this._dimension.canvasHeight - scaledHeight - frequencyHeight, // Y pos
      this._canvasSpeed, // Width is speed value
      frequencyHeight // Height depends on canvas height
    );
  }


  /** @method
   * @name _drawSpectrogramForFrequencyBin
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw the vertical ray with a logarithm scale.</blockquote>
   * @param {object} ctx - The canvas context
   * @param {Uint8Array} frequencies - The frequencies for a given audio bin
   * @param {number} i - The index to scale logarithmically **/
  _fillRectLogarithm(ctx, frequencies, i) {
    if (i === 0 || i === frequencies.length - 1 || !this._colorSmoothing) {
      ctx.fillStyle = `rgb(${frequencies[i]}, ${frequencies[i]}, ${frequencies[i]})`;
    } else {
      const gradient = ctx.createLinearGradient(
        0, this._logScale[i], // X0/Y0
        0, this._logScale[i - 1] // X1/Y1
      );
      // Add color stops from current color to previous sample color
      gradient.addColorStop(0, `rgb(${frequencies[i]}, ${frequencies[i]}, ${frequencies[i]})`);
      gradient.addColorStop(1, `rgb(${frequencies[i - 1]}, ${frequencies[i - 1]}, ${frequencies[i - 1]})`);
      ctx.fillStyle = gradient;
    }
    // Log scale
    ctx.fillRect(
      this._dimension.width - this._canvasSpeed, // X pos
      this._logScale[i - 1], // Y pos
      this._canvasSpeed, // Width is speed value
      this._logScale[i] - this._logScale[i - 1] // Height is computed with previous sample offset
    );
  }


  /** @method
   * @name _scaleLinearIndexToHeight
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Convert linear value to logarithmic value.</blockquote>
   * @param {number} index - The canvas context **/
  _scaleLinearIndexToHeight(index) {
    // Convert a range to another, maintaining ratio
    // oldRange = (oldMax - oldMin)
    // newRange = (newMax - newMin)
    // newValue = (((oldValue - oldMin) * newRange) / oldRange) + NewMin */
    // Convert from [0, (this._fftSize / 2)] to [0, this._dimension.canvasHeight] (frequency array length scale to canvas height scale)
    const oldRange = this._fftSize / 2;
    const newRange = this._dimension.canvasHeight;
    return (index * newRange) / oldRange;
  }


  /** @method
   * @name _createLogarithmicScaleHeights
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Pre-compute samples height on a logarithmic scale to avoid computation on render process.</blockquote> **/
  _createLogarithmicScaleHeights() {
    return new Promise(resolve => {
      this._logScale = [this._dimension.canvasHeight]; // Reset previously made scale
      for (let i = 1; i < (this._fftSize / 2); ++i) { // Log(0) forbidden, we offset
        this._logScale.push(this._computeLogSampleHeight(i)); // For each frequency sample, compute its log height offset from origin
      }
      resolve();
    });
  }


  /** @method
   * @name _computeLogSampleHeight
   * @private
   * @memberof Spectrum
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Compute log sample height in canvas.</blockquote>
   * @param {number} sample - The sample to compute its log height **/
  _computeLogSampleHeight(sample) {
    return this._dimension.canvasHeight - (((Math.log(sample) / Math.log(10)) / (Math.log(this._fftSize / 2) / Math.log(10))) * this._dimension.canvasHeight);
  }


}


export default Spectrum;

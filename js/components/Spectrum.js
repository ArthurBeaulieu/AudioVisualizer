import VisuComponentStereo from '../utils/VisuComponentStereo.js';


class Spectrum extends VisuComponentStereo {


  constructor(options) {
    super(options);
    this._updateDimensions();
    this._createLogarithmicScaleHeights();
  }


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
    this._dom.settings = document.createElement('IMG');
    this._dom.settings.classList.add('mzkspectrum-settings');
    this._dom.settings.src = './assets/img/settings.svg';
    this._dom.settingsPanel = document.createElement('DIV');
    this._dom.settingsPanel.classList.add('mzkspectrum-settings-panel');
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
      if (output[1] === 'on') {
        this._colorSmoothing = true;
      } else {
        this._colorSmoothing = false;
      }
    }, false);
    // Add display canvas to renderTo parent
    this._dom.container.appendChild(this._dom.settingsPanel); // Append panel before to emulate z-index under settings button w/ no css rules of z-index
    this._dom.container.appendChild(this._dom.settings);
    this._dom.settings.addEventListener('click', this._settingsClicked, false);
  }


  _removeEvents() {
    super._removeEvents();
    document.body.removeEventListener('click', this._clickedElsewhere, false);
  }


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


  _settingsClicked() {
    const opened = this._dom.settingsPanel.classList.contains('opened');
    if (opened === false) { // If opened, setings closure will be handled in clickedElsewhere
      this._dom.settings.classList.add('opened');
      this._dom.settingsPanel.classList.add('opened');
      document.body.addEventListener('click', this._clickedElsewhere, false);
    }
  }


  _clickedElsewhere(event) {
    if (!event.target.closest('.mzkspectrum-settings') && !event.target.closest('.mzkspectrum-settings-panel')) {
      this._dom.settings.classList.remove('opened');
      this._dom.settingsPanel.classList.remove('opened');
      document.body.removeEventListener('click', this._clickedElsewhere, false);
    }
  }


  _processAudioBin(event) {
    if (this._isPlaying === true) {
      if (this._merged === true) {
        this._mergedStereoAnalysis();
      } else {
        this._stereoAnalysis();
      }

      requestAnimationFrame(this._processAudioBin);
    }
  }


  _mergedStereoAnalysis() {
    const frequencies = new Uint8Array(this._nodes.analyser.frequencyBinCount);
    this._nodes.analyser.getByteFrequencyData(frequencies);
    this._drawSpectrogramForFrequencyBin(this._canvasL, frequencies);
  }


  _stereoAnalysis() {
    const frequenciesL = new Uint8Array(this._nodes.analyserL.frequencyBinCount);
    const frequenciesR = new Uint8Array(this._nodes.analyserR.frequencyBinCount);
    this._nodes.analyserL.getByteFrequencyData(frequenciesL);
    this._nodes.analyserR.getByteFrequencyData(frequenciesR);
    this._drawSpectrogramForFrequencyBin(this._canvasL, frequenciesL);
    this._drawSpectrogramForFrequencyBin(this._canvasR, frequenciesR);
  }


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


  /* Convert a range to another, maintaining ratio
   * oldRange = (oldMax - oldMin)
   * newRange = (newMax - newMin)
   * newValue = (((oldValue - oldMin) * newRange) / oldRange) + NewMin */
  _scaleLinearIndexToHeight(index) {
    // Convert from [0, (this._fftSize / 2)] to [0, this._dimension.canvasHeight] (frequency array length scale to canvas height scale)
    const oldRange = this._fftSize / 2;
    const newRange = this._dimension.canvasHeight;
    return (index * newRange) / oldRange;
  }


  // Pre-compute samples height on a logarithmic scale to avoid computation on render process
  _createLogarithmicScaleHeights() {
    return new Promise(resolve => {
      this._logScale = [this._dimension.canvasHeight]; // Reset previously made scale
      for (let i = 1; i < (this._fftSize / 2); ++i) { // Log(0) forbidden, we offset
        this._logScale.push(this._computeLogSampleHeight(i)); // For each frequency sample, compute its log height offset from origin
      }
      resolve();
    });
  }


  _computeLogSampleHeight(sample) {
    return this._dimension.canvasHeight - (((Math.log(sample) / Math.log(10)) / (Math.log(this._fftSize / 2) / Math.log(10))) * this._dimension.canvasHeight);
  }


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


}


export default Spectrum;

window.AudioContext = window.AudioContext || window.webkitAudioContext;


class MzkSpectrum {


  constructor(options) {
    // Attributes that can be sent as options
    this._player = null; // Source (HTML audio player)
    this._renderTo = null; // Target div to render module in
    this._fftSize = null; // FFT size used to analyse audio stream
    this._scaleType = null;
    this._colorSmoothing = null
    // The Web Audio API context
    this._audioCtx = null;
    // Audio nodes
    this._nodes = {
      source: null, // HTML audio element
      splitter: null, // Stereo channel splitting
      merger: null, // Merge channels into one
      analyserL: null, // Left channel analysis
      analyserR: null, // Right channel analysis
      script: null
    };
    // Canvas and contexts
    this._canvasL = null;
    this._canvasR = null;
    // Used to animate canvas on audio bins analysis
    this._bufferCanvas = null;
    this._bufferCtx = null;
    // Display utils
    this._dom = {
      container: null,
      settings: null,
      settingsPanel: null
    };
    this._dimension = {
      height: null,
      canvasHeight: null,
      width: null
    };
    this._canvasSpeed = null;
    this._logScale = [];
    // Event binding
    this._settingsClicked = this._settingsClicked.bind(this);
    this._processAudioBin = this._processAudioBin.bind(this);
    // Construction sequence
    this._fillAttributes(options)
    .then(() => {
      this._buildUI();
      this._setAudioNodes();
      this._addEvents();
    });
  }


  destroy() {
    this._removeEvents();
    Object.keys(this).forEach(key => { delete this[key]; });
  }


  _fillAttributes(options) {
    return new Promise(resolve => {
      this._player = options.player;
      this._fftSize = options.fftSize || 1024;
      this._renderTo = options.renderTo;
      this._scaleType = options.scale || 'linear';
      this._colorSmoothing = options.colorSmoothing || false;
      this._canvasSpeed = 1; // Canvas offset per bin
      this._speed = 512; // Those are MzSprectum proper attributes
      this._updateDimensions();
      this._createLogarithmicScaleHeights().then(resolve);
    });
  }


  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add('mzk-spectrum');
    // Create canvas and associated contexts (both display canvas and buffer canvas)
    this._canvasL = document.createElement('CANVAS');
    this._canvasR = document.createElement('CANVAS');
    this._bufferCanvas = document.createElement('CANVAS');
    this._bufferCtx = this._bufferCanvas.getContext('2d');
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
          <label for="debug">Smooth colors</label>
          <input type="checkbox" id="smoothColor" name="smoothColorActivated" ${this._colorSmoothing ? 'checked' : ''}>
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
    this._dom.container.appendChild(this._dom.settings);
    this._dom.container.appendChild(this._dom.settingsPanel);
    this._dom.container.appendChild(this._canvasL);
    this._dom.container.appendChild(this._canvasR);
    this._renderTo.appendChild(this._dom.container);
  }


  _updateDimensions() {
    this._dimension.height = this._renderTo.offsetHeight;
    this._dimension.canvasHeight = this._renderTo.offsetHeight / 2;
    this._dimension.width = this._renderTo.offsetWidth;
  }


  _setAudioNodes() {
    // Create new audio context using WebAudioAPI
    this._audioCtx = new AudioContext();
    // Attach HTML audio player to the audio context as source
    this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    this._nodes.splitter = this._audioCtx.createChannelSplitter(this._nodes.source.channelCount);
    this._nodes.merger = this._audioCtx.createChannelMerger(this._nodes.source.channelCount);
    // Actual script node from source node with a fixed buffer size of 256
    this._nodes.script = this._audioCtx.createScriptProcessor(this._speed, this._nodes.source.channelCount, this._nodes.source.channelCount);
    // Create analyser node to read frequency bin on audio proccessed
    this.analyserL = this._audioCtx.createAnalyser();
    this.analyserR = this._audioCtx.createAnalyser();
    this.analyserL.smoothingTimeConstant = 0;
    this.analyserR.smoothingTimeConstant = 0;
    this.analyserL.fftSize = this._fftSize;
    this.analyserR.fftSize = this._fftSize;
    // Attach script processor node to both analyser
    this.analyserL.connect(this._nodes.script);
    this.analyserR.connect(this._nodes.script);
    // Nodes chaining
    this._nodes.source.connect(this._nodes.splitter);
    this._nodes.splitter.connect(this.analyserL, 0);
    this._nodes.splitter.connect(this.analyserR, 1);
    this.analyserL.connect(this._nodes.merger, 0, 0);
    this.analyserR.connect(this._nodes.merger, 0, 1);
    this._nodes.merger.connect(this._audioCtx.destination);
  }


  _addEvents() {
    this._dom.settings.addEventListener('click', this._settingsClicked, false);
    this._nodes.script.addEventListener('audioprocess', this._processAudioBin, false);
  }


  _removeEvents() {
    this._dom.settings.removeEventListener('click', this._settingsClicked, false);
    this._nodes.script.removeEventListener('audioprocess', this._processAudioBin, false);
  }


  _settingsClicked() {
    const opened = this._dom.settingsPanel.classList.contains('opened');
    if (opened === true) {
      this._dom.settings.classList.remove('opened');
      this._dom.settingsPanel.classList.remove('opened');
    } else {
      this._dom.settings.classList.add('opened');
      this._dom.settingsPanel.classList.add('opened');
    }
  }


  _processAudioBin(event) {
    if (this._nodes.source.mediaElement.paused === false) {
      const frequenciesL = new Uint8Array(this.analyserL.frequencyBinCount);
      const frequenciesR = new Uint8Array(this.analyserR.frequencyBinCount);
      this.analyserL.getByteFrequencyData(frequenciesL);
      this.analyserR.getByteFrequencyData(frequenciesR);
      requestAnimationFrame(() => {
        this._drawSpectrogramForFrequencyBin(this._canvasL, frequenciesL);
        this._drawSpectrogramForFrequencyBin(this._canvasR, frequenciesR);
      });
    }
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


}


export default MzkSpectrum;

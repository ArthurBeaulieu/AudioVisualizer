class MzkVueMeter {


  constructor(options) {
    // Attributes that can be sent as options
    this._player = null; // Source (HTML audio player)
    this._renderTo = null; // Target div to render module in
    this._fftSize = null; // FFT size used to analyse audio stream
    this._borderColor = null;
    this._backgroundColor = null;
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
    // VueMeter utils
    this._amplitudeL = null;
    this._amplitudeR = null;
    this._peakL = null;
    this._peakR = null;
    this._peakSetTimeL = null;
    this._peakSetTimeR = null;
    this._prevAmplitudeL = null;
    this._prevAmplitudeR = null;
    // Canvas and context
    this._canvasL = null;
    this._canvasR = null;
    // Display utils
    this._orientation = null;
    this._dom = {
      container: null
    };
    // Event binding
    this._processAudioBin = this._processAudioBin.bind(this);
    // Construction sequence
    this._fillAttributes(options);
    this._buildUI();
    this._setAudioNodes();
    this._addEvents();
  }


  destroy() {
    this._removeEvents();
    Object.keys(this).forEach(key => { delete this[key]; });
  }


  _fillAttributes(options) {
    this._player = options.player;
    this._fftSize = options.params.fftSize || 1024;
    // style options
    this._borderColor = options.params.borderColor || 'black';
    this._backgroundColor = options.params.backgroundColor || 'black';
    // init amplitude values
    this._amplitudeL = options.params.initAmplitude || 0;
    this._peakL = options.params.initPeak || -1;
    this._prevAmplitudeL = 0;
    this._amplitudeR = options.params.initAmplitude || 0;
    this._peakR = options.params.initPeak || -1;
    this._orientation = options.params.orientation || 'vertical';
    this._prevAmplitudeR = 0;
    this._renderTo = options.params.renderTo;
  }


  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add('mzk-vuemeter');

    this._canvasL = document.createElement('canvas');
    this._canvasR = document.createElement('canvas');
    this._dom.container.appendChild(this._canvasL);
    this._dom.container.appendChild(this._canvasR);
    this._renderTo.appendChild(this._dom.container);

    if (this._orientation === 'horizontal') {
      this._dom.container.classList.add('horizontal-vuemeter');
      this._canvasL.width = this._dom.container.offsetWidth;
      this._canvasR.width = this._dom.container.offsetWidth;
      this._canvasL.height = this._dom.container.offsetHeight / 2;
      this._canvasR.height = this._dom.container.offsetHeight / 2;
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = this._dom.container.offsetWidth / 2;
      this._canvasR.width = this._dom.container.offsetWidth / 2;
      this._canvasL.height = this._dom.container.offsetHeight;
      this._canvasR.height = this._dom.container.offsetHeight;
    }

    this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
    this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
  }


  _setAudioNodes() {
    this._audioCtx = new AudioContext();

    this._peakSetTimeL = this._audioCtx.currentTime;
    this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    this._nodes.splitter = this._audioCtx.createChannelSplitter(this._nodes.source.channelCount);
    this._nodes.merger = this._audioCtx.createChannelMerger(this._nodes.source.channelCount);
    this._nodes.analyserL = this._audioCtx.createAnalyser();
    this._nodes.analyserL.fftSize = this._fftSize;
    this._nodes.analyserR = this._audioCtx.createAnalyser();
    this._nodes.analyserR.fftSize = this._fftSize;

    this._nodes.script = this._audioCtx.createScriptProcessor(this._fftSize * 2, 1, 1);
    // Attach script processor node to both analyzer
    this._nodes.analyserL.connect(this._nodes.script);
    this._nodes.analyserR.connect(this._nodes.script);
    // Nodes chaining
    this._nodes.source.connect(this._nodes.splitter);
    this._nodes.splitter.connect(this._nodes.analyserL, 0);
    this._nodes.splitter.connect(this._nodes.analyserR, 1);
    this._nodes.analyserL.connect(this._nodes.merger, 0, 0);
    this._nodes.analyserR.connect(this._nodes.merger, 0, 1);
    this._nodes.merger.connect(this._audioCtx.destination);
  }


  _addEvents() {
    this._nodes.script.addEventListener('audioprocess', this._processAudioBin, false);
  }


  _removeEvents() {
    this._nodes.script.removeEventListener('audioprocess', this._processAudioBin, false);
  }


  _processAudioBin() {
    var dataL = new Float32Array(this._fftSize);
    var dataR = new Float32Array(this._fftSize);
    this._nodes.analyserL.getFloatTimeDomainData(dataL);
    this._nodes.analyserR.getFloatTimeDomainData(dataR);
    /* LEFT */
    // use rms to calculate the average amplitude over the this._fftSize samples
    this._amplitudeL = Math.sqrt(dataL.reduce((prev,cur) => {
      return prev + (cur * cur);
    }, 0) / dataL.length);

    // calculate the peak position
    // special cases - peak = -1 means peak expired and waiting for amplitude to rise
    // peak = 0 means amplitude is rising, waiting for peak
    if (this._amplitudeL < this._prevAmplitudeL && this._peakL < this._prevAmplitudeL && this._peakL !== -1) {
      this._peakL = this._prevAmplitudeL;
      this._peakSetTimeL = this._audioCtx.currentTime;
    } else if (this._amplitudeL > this._prevAmplitudeL) {
      this._peakL = 0;
    }

    // draw the peak for 2 seconds, then remove it
    if (this._audioCtx.currentTime - this._peakSetTimeL > 2 && this._peakL !== 0) {
      this._peakL = -1;
    }

    this._prevAmplitudeL = this._amplitudeL;
    /* RIGHT */
    this._amplitudeR = Math.sqrt(dataR.reduce((prev,cur) => {
      return prev + (cur * cur);
    }, 0) / dataR.length);

    // calculate the peak position
    // special cases - peak = -1 means peak expired and waiting for amplitude to rise
    // peak = 0 means amplitude is rising, waiting for peak
    if (this._amplitudeR < this._prevAmplitudeR && this._peakR < this._prevAmplitudeR && this._peakR !== -1) {
      this._peakR = this._prevAmplitudeR;
      this._peakSetTimeR = this._audioCtx.currentTime;
    } else if (this._amplitudeR > this._prevAmplitudeR) {
      this._peakR = 0;
    }

    // draw the peak for 2 seconds, then remove it
    if (this._audioCtx.currentTime - this._peakSetTimeR > 2 && this._peakR !== 0) {
      this._peakR = -1;
    }

    this._prevAmplitudeR = this._amplitudeR;

    this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
    this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
  }


  ledGradient (canvas, ctx) {
    var gradient = null;

    if (this._orientation === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    } else if (this._orientation === 'vertical') {
      gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    } else {
      return;
    }

    gradient.addColorStop(0, 'green');
    gradient.addColorStop(0.6, 'lightgreen');
    gradient.addColorStop(0.8, 'yellow');
    gradient.addColorStop(1, 'red');

    return gradient;
  }


  drawLed(canvas, ctx, amplitude) {
    ctx.fillStyle = this.ledGradient(canvas, ctx);

    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width * amplitude;
      ctx.fillRect(0, 0, ledWidth, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height * amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, ledHeight);
    }
  }


  drawPeak(canvas, ctx, amplitude) {
    ctx.fillStyle = this.ledGradient(canvas, ctx);

    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width * amplitude;
      ctx.fillRect(ledWidth, 0, 1, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height * amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, 1);
    }
  }


  drawLiveMeter(canvas, amplitude, peak) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawLed(canvas, ctx, amplitude);
    this.drawPeak(canvas, ctx, peak);
  }


}


export default MzkVueMeter;

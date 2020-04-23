class VisuComponentStereo {


  constructor(options) {
    // Attributes that can be sent as options
    this._type = null;
    this._player = null; // Source (HTML audio player)
    this._renderTo = null; // Target div to render module in
    this._fftSize = null; // FFT size used to analyse audio stream
    // The Web Audio API context
    this._audioCtx = null;
    // Audio nodes
    this._nodes = {
      source: null, // HTML audio element
      splitter: null, // Stereo channel splitting
      merger: null, // Merge channels into one
      analyserL: null, // Left channel analysis
      analyserR: null // Right channel analysis
    };
    // Canvas and context
    this._canvasL = null;
    this._canvasR = null;
    this._ctxL = null;
    this._ctxR = null;
    // Display utils
    this._dom = {
      container: null
    };
    this._parentDimension = {
      position: null,
      height: null,
      width: null,
      zIndex: null
    };
    // Event binding
    this._resizeObserver = null;
    this._onResize = this._onResize.bind(this);
    this._play = this._play.bind(this);
    this._pause = this._pause.bind(this);
    this._processAudioBin = this._processAudioBin.bind(this);
    this._dblClick = this._dblClick.bind(this);
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
    this._type = options.type;
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize || 1024;
  }


  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add(`mzk-${this._type}`);
    this._canvasL = document.createElement('canvas');
    this._canvasR = document.createElement('canvas');
    this._ctxL = this._canvasL.getContext('2d');
    this._ctxR = this._canvasR.getContext('2d');
    this._ctxL.translate(0.5, 0.5);
    this._ctxR.translate(0.5, 0.5);

    this._dom.container.appendChild(this._canvasL);
    this._dom.container.appendChild(this._canvasR);
    this._renderTo.appendChild(this._dom.container);
  }


  _setAudioNodes() {
    this._audioCtx = new AudioContext();

    this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    this._nodes.splitter = this._audioCtx.createChannelSplitter(this._nodes.source.channelCount);
    this._nodes.merger = this._audioCtx.createChannelMerger(this._nodes.source.channelCount);
    this._nodes.analyserL = this._audioCtx.createAnalyser();
    this._nodes.analyserR = this._audioCtx.createAnalyser();
    this._nodes.analyserR.fftSize = this._fftSize;
    this._nodes.analyserL.fftSize = this._fftSize;
    // Nodes chaining
    this._nodes.source.connect(this._nodes.splitter);
    this._nodes.splitter.connect(this._nodes.analyserL, 0);
    this._nodes.splitter.connect(this._nodes.analyserR, 1);
    this._nodes.analyserL.connect(this._nodes.merger, 0, 0);
    this._nodes.analyserR.connect(this._nodes.merger, 0, 1);
    this._nodes.merger.connect(this._audioCtx.destination);
  }


  _addEvents() {
    this._resizeObserver = new ResizeObserver(this._onResize).observe(this._renderTo);
    this._player.addEventListener('play', this._play, false);
    this._player.addEventListener('pause', this._pause, false);
    this._dom.container.addEventListener('dblclick', this._dblClick, false);
  }


  _removeEvents() {
    this._resizeObserver.disconnect();
    this._player.removeEventListener('play', this._play, false);
    this._player.removeEventListener('pause', this._pause, false);
    this._dom.container.removeEventListener('dblclick', this._dblClick, false);
  }


  _play() {
    this._isPlaying = true;
    this._processAudioBin();
  }


  _pause() {
    this._isPlaying = false;
  }


  _onResize() {
    if (this._onResizeOverride) {
      this._onResizeOverride();
    }
  }


  _dblClick(event) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      // Restore renderTo initial style
      this._renderTo.style.position = this._parentDimension.position;
      this._renderTo.style.height = this._parentDimension.height;
      this._renderTo.style.width = this._parentDimension.width;
      this._renderTo.style.zIndex = this._parentDimension.zIndex;
      this._parentDimension = {
        position: null,
        height: null,
        width: null,
        zIndex: null
      };
    } else {
      document.documentElement.requestFullscreen();
      // Update renderTo dimension (canvas will be automatically rescaled)
      this._parentDimension = {
        position: this._renderTo.style.position,
        height: this._renderTo.style.height,
        width: this._renderTo.style.width,
        zIndex: this._renderTo.style.zIndex || ''
      };
      this._renderTo.style.position = 'fixed';
      this._renderTo.style.height = '100vh';
      this._renderTo.style.width = '100vw';
      this._renderTo.style.zIndex = '999';
    }
  }


  _clearCanvas() {
    this._canvasL.getContext('2d').clearRect(0, 0, this._canvasL.width, this._canvasL.height);
    this._canvasR.getContext('2d').clearRect(0, 0, this._canvasR.width, this._canvasR.height);
  }


}


export default VisuComponentStereo;

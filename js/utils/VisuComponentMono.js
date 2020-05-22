class VisuComponentMono {


  constructor(options) {
    // Attributes that can be sent as options
    this._type = null;
    this._player = null;
    this._renderTo = null;
    this._fftSize = null;
    // The Web Audio API context
    this._audioCtx = null;
    this._inputNode = null; // Optionnal, the source node to chain from
    // Audio nodes
    this._nodes = {
      source: null, // HTML audio element
      analyser: null
    };
    this._isPlaying = false;
    // Canvas and context
    this._canvas = null;
    this._ctx = null;
    // Display utils
    this._parentDimension = { // Used to resize renderTo on toggle fullscreen
      position: null,
      height: null,
      width: null,
      zIndex: null
    };
    this._dom = {
      container: null
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
    this._fftSize = options.fftSize;
    this._audioCtx = options.audioContext;
    this._inputNode = options.inputNode;
  }


  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add(`mzk-${this._type}`);
    this._canvas = document.createElement('CANVAS');
    this._ctx = this._canvas.getContext('2d');
    this._ctx.translate(0.5, 0.5);
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
    this._dom.container.appendChild(this._canvas);
    this._renderTo.appendChild(this._dom.container);
  }


  _setAudioNodes() {
    let audioCtxSent = false;
    if (!this._audioCtx) {
      this._audioCtx = new AudioContext();
      this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    } else {
      audioCtxSent = true;
      this._nodes.source = this._inputNode;
    }

    this._nodes.analyser = this._audioCtx.createAnalyser();
    this._nodes.analyser.fftSize = this._fftSize;

    this._nodes.source.connect(this._nodes.analyser);

    if (!audioCtxSent) {
      this._nodes.analyser.connect(this._audioCtx.destination);
    }
  }


  _addEvents() {
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this._renderTo);
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
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
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
    this._canvas.getContext('2d').clearRect(0, 0, this._canvas.width, this._canvas.height);
  }


}


export default VisuComponentMono;

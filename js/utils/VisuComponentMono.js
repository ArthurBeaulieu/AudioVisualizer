class VisuComponentMono {


  constructor(options) {
    // Attributes that can be sent as options
    this._type = null;
    this._player = null;
    this._renderTo = null;
    this._fftSize = null;
    // The Web Audio API context
    this._audioCtx = null;
    // Audio nodes
    this._nodes = {
      source: null, // HTML audio element
      analyser: null, // Stereo analysis
      script: null
    };
    // Canvas and context
    this._canvas = null;
    this._ctx = null;
    // Event binding
    this._resizeObserver = null;
    this._onResize = this._onResize.bind(this);
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
    this._type = options.type;
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize;
  }


  _buildUI() {
    this._canvas = document.createElement('CANVAS');
    this._ctx = this._canvas.getContext('2d');
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
    this._renderTo.appendChild(this._canvas);
  }


  _setAudioNodes() {
    this._audioCtx = new AudioContext();
    this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    this._nodes.analyser = this._audioCtx.createAnalyser();
    this._nodes.script = this._audioCtx.createScriptProcessor(this._fftSize * 2, 1, 1);

    this._nodes.source.connect(this._nodes.analyser);
    this._nodes.analyser.connect(this._nodes.script);
    this._nodes.script.connect(this._audioCtx.destination);
  }


  _addEvents() {
    this._resizeObserver = new ResizeObserver(this._onResize).observe(this._renderTo);
    this._nodes.script.addEventListener('audioprocess', this._processAudioBin, false);
  }


  _removeEvents() {
    this._resizeObserver.disconnect();
    this._nodes.script.removeEventListener('audioprocess', this._processAudioBin, false);
  }


  _onResize() {
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
  }


}


export default VisuComponentMono;

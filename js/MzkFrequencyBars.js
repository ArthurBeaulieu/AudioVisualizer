class MzkFrequencyBars {


  constructor(options) {
    // Attributes that can be sent as options
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
    this._canvas = null;
    this._ctx = null;
    // Event binding
    this._processAudioBin = this._processAudioBin.bind(this);

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
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize;
  }


  _buildUI() {
    this._canvas = document.createElement('CANVAS');
    this._ctx = this._canvas.getContext('2d');
    this._canvas.width = this._renderTo.offsetWidth;
    this._canvas.height = this._renderTo.offsetHeight;
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
    this._nodes.script.addEventListener('audioprocess', this._processAudioBin, false);
  }


  _removeEvents() {
    this._nodes.script.removeEventListener('audioprocess', this._processAudioBin, false);
  }


  _processAudioBin() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    const frequencyData = new Uint8Array(this._nodes.analyser.frequencyBinCount);
    this._nodes.analyser.getByteFrequencyData(frequencyData);

    const frequencyWidth = (this._canvas.width / this._nodes.analyser.frequencyBinCount);
    let frequencyHeight = 0;
    let cursor = 0;

    for (let i = 0; i < this._nodes.analyser.frequencyBinCount; i++) {
      frequencyHeight = frequencyData[i] * (this._canvas.height * 0.0025);
      this._ctx.fillStyle = '#F00';
      this._ctx.fillRect(cursor, this._canvas.height - frequencyHeight, frequencyWidth, frequencyHeight);
      cursor += frequencyWidth;
    }
  }


}


export default MzkFrequencyBars;

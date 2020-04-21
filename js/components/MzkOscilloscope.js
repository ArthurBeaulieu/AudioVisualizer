import VisuComponentStereo from '../utils/VisuComponentStereo.js';


class MzkOscilloscope extends VisuComponentStereo {


  constructor(options) {
    super(options);

    this._color = options.color || '#56D45B';
    this._dimension = {
      height: null,
      canvasHeight: null,
      width: null
    };

    this._updateDimensions();
  }


  _fillAttributes(options) {
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize;
  }


  _processAudioBin() {
    const ctxL = this._canvasL.getContext('2d');
    const ctxR = this._canvasR.getContext('2d');
    ctxL.clearRect(0, 0, this._canvasL.width, this._canvasL.height);
    ctxR.clearRect(0, 0, this._canvasR.width, this._canvasR.height);

    if (this._isPlaying === true) {
      /* L part */
      ctxL.beginPath();

      var timeDomain =  new Uint8Array(this._nodes.analyserL.frequencyBinCount);
      this._nodes.analyserL.getByteTimeDomainData(timeDomain);

      var sliceWidth = this._canvasL.width / this._nodes.analyserL.frequencyBinCount;

      var x = 0;
      for (let i = 0; i < this._nodes.analyserL.frequencyBinCount; ++i) {
        var offsetHeight = timeDomain[i] / 255; // Get value between 0 and 1
        var y = this._canvasL.height * offsetHeight;

        if (i === 0) {
          ctxL.moveTo(x, y);
        } else {
          ctxL.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctxL.strokeStyle = this._color;
      ctxL.stroke();

      /* R part */
      ctxR.beginPath();

      timeDomain =  new Uint8Array(this._nodes.analyserR.frequencyBinCount);
      this._nodes.analyserR.getByteTimeDomainData(timeDomain);

      sliceWidth = this._canvasR.width / this._nodes.analyserR.frequencyBinCount;

      x = 0;
      for (let i = 0; i < this._nodes.analyserR.frequencyBinCount; ++i) {
        var offsetHeight = timeDomain[i] / 255; // Get value between 0 and 1
        var y = this._canvasR.height * offsetHeight;

        if (i === 0) {
          ctxR.moveTo(x, y);
        } else {
          ctxR.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctxR.strokeStyle = this._color;
      ctxR.stroke();

      requestAnimationFrame(this._processAudioBin);
    }
  }


  _updateDimensions() {
    this._dimension.height = this._renderTo.offsetHeight - 4; // 2px borders times two channels
    this._dimension.width = this._renderTo.offsetWidth - 2; // 2px borders
    this._dimension.canvasHeight = this._dimension.height / 2;
    this._canvasL.width = this._dimension.width;
    this._canvasL.height = this._dimension.canvasHeight;
    this._canvasR.width = this._dimension.width;
    this._canvasR.height = this._dimension.canvasHeight;
  }


  _onResizeOverride() {
    this._updateDimensions();
  }


}


export default MzkOscilloscope;

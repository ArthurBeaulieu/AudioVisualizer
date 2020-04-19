import VisuComponentMono from '../utils/VisuComponentMono.js';


class MzkOscilloscope extends VisuComponentMono {


  constructor(options) {
    super(options);
  }


  _fillAttributes(options) {
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize;
  }


  _processAudioBin() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._ctx.beginPath();

    var timeDomain =  new Uint8Array(this._nodes.analyser.frequencyBinCount);
    this._nodes.analyser.getByteTimeDomainData(timeDomain);

    var sliceWidth = this._canvas.width / this._nodes.analyser.frequencyBinCount;

    var x = 0;
    for (let i = 0; i < this._nodes.analyser.frequencyBinCount; ++i) {
      var offsetHeight = timeDomain[i] / 255; // Get value between 0 and 1
      var y = this._canvas.height * offsetHeight;

      if (i === 0) {
        this._ctx.moveTo(x, y);
      } else {
        this._ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this._ctx.strokeStyle = '#F00';
    this._ctx.stroke();
  }


}


export default MzkOscilloscope;

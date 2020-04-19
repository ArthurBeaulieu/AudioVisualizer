import VisuComponentMono from '../utils/VisuComponentMono.js';


class MzkFrequencyBars extends VisuComponentMono {


  constructor(options) {
    super(options);
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

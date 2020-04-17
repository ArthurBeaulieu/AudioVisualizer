import MzkSpectrum from './MzkSpectrum.js';


class MzkVisualizer {


  constructor(options) {
    this._player = options.player; // Source (HTML audio player)
    this._renderTo = options.renderTo; // Target div to render module in
    this._fftSize = options.fftSize || 1024; // FFT size used to analyse audio stream
  }


  destroy() {
    Object.keys(this).forEach(key => { delete this[key]; });
  }


  new(options) {
    let component = null;
    if (this._player !== null && this._renderTo !== null) {
      if (options.type === 'MzkSpectrum') {
        component = this._createMzkSpectrum(options);
      }
    }

    return component;
  }


  _createMzkSpectrum(options) {
    return new MzkSpectrum({
      player: this._player,
      renderTo: this._renderTo,
      fftSize: this._fftSize,
      params: options.params
    });
  }


}


export default MzkVisualizer;

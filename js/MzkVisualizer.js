import MzkSpectrum from './MzkSpectrum.js';
import MzkVueMeter from './MzkVueMeter.js';


class MzkVisualizer {


  constructor(options) {
    this._player = options.player; // Source (HTML audio player)
  }


  destroy() {
    Object.keys(this).forEach(key => { delete this[key]; });
  }


  new(options) {
    let component = null;
    if (this._player !== null && this._renderTo !== null) {
      if (options.type === 'MzkSpectrum') {
        component = this._createMzkSpectrum(options);
      } else if (options.type === 'MzkVueMeter') {
        component = this._createMzkVueMeter(options);
      }
    }

    return component;
  }


  _createMzkSpectrum(options) {
    return new MzkSpectrum({
      player: this._player,
      params: options.params
    });
  }


  _createMzkVueMeter(options) {
    return new MzkVueMeter({
      player: this._player,
      params: options.params
    });
  }


}


export default MzkVisualizer;

import MzkSpectrum from './MzkSpectrum.js';
import MzkVueMeter from './MzkVueMeter.js';


class MzkVisualizer {


  constructor(options) {
    if (options.type === 'MzkSpectrum') {
      return new MzkSpectrum(options);
    } else if (options.type === 'MzkVueMeter') {
      return new MzkVueMeter(options);
    }

    return null;
  }


}


export default MzkVisualizer;

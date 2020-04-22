import MzkSpectrum from './components/MzkSpectrum.js';
import MzkVueMeter from './components/MzkVueMeter.js';
import MzkFrequencyBars from './components/MzkFrequencyBars.js';
import MzkFrequencyCircle from './components/MzkFrequencyCircle.js';
import MzkOscilloscope from './components/MzkOscilloscope.js';


window.AudioContext = window.AudioContext || window.webkitAudioContext;



class MzkVisualizer {


  constructor(options) {
    if (options.type === 'spectrum') {
      return new MzkSpectrum(options);
    } else if (options.type === 'vuemeter') {
      return new MzkVueMeter(options);
    } else if (options.type === 'frequencybars') {
      return new MzkFrequencyBars(options);
    } else if (options.type === 'frequencycircle') {
      return new MzkFrequencyCircle(options);
    } else if (options.type === 'oscilloscope') {
      return new MzkOscilloscope(options);
    }

    return null;
  }


}


export default MzkVisualizer;

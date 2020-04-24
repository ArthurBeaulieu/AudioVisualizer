import FrequencyBars from './components/FrequencyBars.js';
import FrequencyCircle from './components/FrequencyCircle.js';
import Oscilloscope from './components/Oscilloscope.js';
import Spectrum from './components/Spectrum.js';
import PeakMeter from './components/PeakMeter.js';


window.AudioContext = window.AudioContext || window.webkitAudioContext;


/* MzkVisualizer version 0.6 */
class MzkVisualizer {


  constructor(options) {
    if (options.type === 'frequencybars') {
      return new FrequencyBars(options);
    } else if (options.type === 'frequencycircle') {
      return new FrequencyCircle(options);
    } else if (options.type === 'oscilloscope') {
      return new Oscilloscope(options);
    } else if (options.type === 'spectrum') {
      return new Spectrum(options);
    } else if (options.type === 'peakmeter') {
      return new PeakMeter(options);
    }

    return null;
  }


}


export default MzkVisualizer;

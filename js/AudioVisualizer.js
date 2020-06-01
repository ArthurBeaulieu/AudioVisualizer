import FrequencyBars from './components/FrequencyBars.js';
import FrequencyCircle from './components/FrequencyCircle.js';
import Oscilloscope from './components/Oscilloscope.js';
import Spectrum from './components/Spectrum.js';
import PeakMeter from './components/PeakMeter.js';
import WaveformProgress from './components/WaveformProgress.js';
import Timeline from './components/Timeline.js';


/* AudioVisualizer version 0.8.9 */
const AudioVisualizerVersion = '0.8.9';
window.AudioContext = window.AudioContext || window.webkitAudioContext;


class AudioVisualizer {


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
    } else if (options.type === 'waveformprogress') {
      return new WaveformProgress(options);
    } else if (options.type === 'timeline') {
      return new Timeline(options);
    }
    // Visualizer factory return null by default -> unexisting component name
    return null;
  }


}


// Global scope attachment will be made when bundling this file
window.AudioVisualizer = AudioVisualizer;
export default AudioVisualizer;

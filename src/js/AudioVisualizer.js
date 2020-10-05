import FrequencyBars from './components/FrequencyBars.js';
import FrequencyCircle from './components/FrequencyCircle.js';
import Oscilloscope from './components/Oscilloscope.js';
import PeakMeter from './components/PeakMeter.js';
import Spectrum from './components/Spectrum.js';
import Timeline from './components/Timeline.js';
import Waveform from './components/Waveform.js';
'use strict';


/* AudioVisualizer version 0.9.4 */
const AudioVisualizerVersion = '0.9.4';
window.AudioContext = window.AudioContext || window.webkitAudioContext;


class AudioVisualizer {


  /** @summary AudioVisualizer factory class to build all supported visualisation
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>This factory will return an <code>AudioVisualizer</code> component. It is
   * automatically rendered, and will also be automatically linked to given audio source. No further manipulation
   * are required (except destroy when done using) on runtime.<br><br>Each components have shared properties,
   * and unique properties, as described in components class themselves. Refer to the components documentation for
   * specific options.<br><br>Multi visualisation can have an impact on CPU load that mostly depends on client configuration.
   * Keep that in mind if you develop your project with a battle station. When done using a component, please call its
   * <code>destroy</code> method to remove listeners and audio processing to avoid memory leaks in your app.</blockquote>
   * @param {object} options - The audio visualisation definition
   * @param {string} options.type - The visualisation type, can be <code>bars</code>/<code>circle</code>/<code>oscilloscope</code>/<code>peakmeter</code>/<code>spectrum</code>/<code>timeline</code>/<code>waveform</code>
   * @param {object} options.player - A DOM audio player to be the audio source for processing
   * @param {object} options.renderTo - A DOM element to render the visualisation in. It will automatically scale content to this element's dimension
   * @param {object} [options.audioContext=null] - A WebAudioAPI audio context to chain the processing nodes in your audio routing.
   * @param {object} [options.inputNode=null] - The WebAudioAPI audio node to be the audio source for processing, You must provide an audioContext
   * @param {number} [options.fftSize=1024] - The FFT size to use in processing, must be a power of 2. High values cost more CPU
   * @returns {object|null} - The custom visualisation component according to given options, <code>null</code> for unknown type */
  constructor(options) {
    if (options.type === 'bars') {
      return new FrequencyBars(options);
    } else if (options.type === 'circle') {
      return new FrequencyCircle(options);
    } else if (options.type === 'oscilloscope') {
      return new Oscilloscope(options);
    } else if (options.type === 'peakmeter') {
      return new PeakMeter(options);
    } else if (options.type === 'spectrum') {
      return new Spectrum(options);
    } else if (options.type === 'timeline') {
      return new Timeline(options);
    } else if (options.type === 'waveform') {
      return new Waveform(options);
    }
    // Visualizer factory return null by default (unknown component name)
    return null;
  }


  /** @public
   * @member {string} - The AudioVisualizer component version */
  static get version() {
    return AudioVisualizerVersion;
  }


}


// Global scope attachment will be made when bundling this file
window.AudioVisualizer = AudioVisualizer;
export default AudioVisualizer;

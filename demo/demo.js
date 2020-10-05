// On this demo, we import AudioVisualizer as an es6 module. You can also reference a script tag in your HTML file that
// loads dist/audiovisualizer.js ; this will attach AudioVisualizer to the window object so you can use it anywhere.
import AudioVisualizer from '../src/js/AudioVisualizer.js';
// Navigation buttons
const buttons = {
  barsButton: document.getElementById('bars'),
  circleButton: document.getElementById('circle'),
  oscilloscopeButton: document.getElementById('oscilloscope'),
  peakmeterButton: document.getElementById('peakmeter'),
  spectrumButton: document.getElementById('spectrum'),
  timelineButton: document.getElementById('timeline'),
  waveformButton: document.getElementById('waveform')
};
// Current AudioVisualizer component and type
let component = null;
let selected = 'circle';
// Change AudioVisualizer callback, needs to keep button scope
const buttonClicked = function() {
  buttons[`${selected}Button`].classList.remove('selected');
  // Call destroy on previous component if any
  if (component) {
    component.destroy();
  }
  // Update view DOM and new selected element in nav
  document.getElementById('view').innerHTML = '';
  document.querySelector('#audio-player').pause();
  this.classList.add('selected');
  selected = this.dataset.type;
  // Create AudioVisualizer according to button dataset type
  if (this.dataset.type === 'bars') {
    component = new AudioVisualizer({
      type: 'bars',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 1024,
      colors: {
        background: '#1D1E25',
        min: '#56D45B',
        step0: '#AFF2B3',
        step1: '#FFAD67',
        step2: '#FF6B67',
        max: '#FFBAB8'
      }
    });
  } else if (this.dataset.type === 'circle') {
    component = new AudioVisualizer({
      type: 'circle',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 512,
      image: 'demo/logo.png'
    });
  } else if (this.dataset.type === 'oscilloscope') {
    component = new AudioVisualizer({
      type: 'oscilloscope',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 4096,
      merged: false,
      colors: { // Optional
        background: '#1D1E25',
        signal: '#56D45B'
      }
    });
  } else if (this.dataset.type === 'peakmeter') {
    component = new AudioVisualizer({
      type: 'peakmeter',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 8192,
      merged: false,
      orientation: 'horizontal',
      legend: {
        dbScaleMin: 60,
        dbScaleTicks: 6
      },
      colors: {
        background: '#1D1E25',
        min: '#56D45B',
        step0: '#AFF2B3',
        step1: '#FFAD67',
        step2: '#FF6B67',
        max: '#FFBAB8'
      }
    });
  } else if (this.dataset.type === 'spectrum') {
    component = new AudioVisualizer({
      type: 'spectrum',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 2048,
      merged: true,
      colorSmoothing: true,
      scale: 'logarithmic'
    });
  } else if (this.dataset.type === 'timeline') {
    component = new AudioVisualizer({
      type: 'timeline',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 1024,
      speed: 9,
      beat: {
        offset: 0.58,
        bpm: 103,
        timeSignature: 4
      },
      colors: {
        background: '#1D1E25',
        track: '#12B31D',
        mainBeat: '#FF6B67',
        subBeat: '#56D45B'
      }
    });
  } else if (this.dataset.type === 'waveform') {
    component = new AudioVisualizer({
      type: 'waveform',
      player: document.querySelector('#audio-player'),
      renderTo: document.getElementById('view'),
      fftSize: 1024,
      animation: 'gradient',
      wave: {
        align: 'center',
        barWidth: 1,
        barMarginScale: 0,
        merged: true
      },
      colors: {
        background: '#1D1E25',
        track: '#E7E9E7',
        progress: '#56D45B'
      }
    });
  }
};
// Visualization switcher events
for (const key in buttons) {
  buttons[key].addEventListener('click', buttonClicked, false);
}
// Init demo with Circle
component = new AudioVisualizer({
  type: 'circle',
  player: document.querySelector('#audio-player'),
  renderTo: document.getElementById('view'),
  fftSize: 512,
  image: 'demo/logo.png'
});
// Switch source type events
const sources = ['FrequencyTest.flac', 'FrequencyTest.mp3', 'FrequencyTest.ogg', 'FrequencyTest.wav'];
let currentIndex = 0; // Init demo with flac file (flac 4 the win guys)
document.getElementById('demo-current-src').innerHTML = sources[currentIndex]; // Set initial src text
document.getElementById('demo-change-src').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % sources.length; // Update source index
  document.getElementById('audio-player').src = `demo/audio/${sources[currentIndex]}`; // Update audio source
  document.getElementById('demo-current-src').innerHTML = sources[currentIndex]; // Update text feedback
});

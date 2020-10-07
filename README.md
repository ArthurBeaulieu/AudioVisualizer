# AudioVisualizer

![](https://badgen.net/badge/version/0.9.5/blue)
![License](https://img.shields.io/github/license/ArthurBeaulieu/AudioVisualizer.svg)

This library free module provides several standard audio visualizations in the browser using WebAudioAPI. It is best to be used with an HTML audio element (to benefit its streaming mechanism), but can also work with an `AudioContext`.

To get started, simply include the bundled files in the `dist` folder and reference them in your project HTML. If you want to bundle it yourself, just reference `audiovisualizer.js` and `audiovisualizer.scss` as entry points. You can now access this module using the `window.AudioVisualizer` object to build the following visualizations.

*NB: You must provide an HTML audio element, and a DOM element with the dimension you need to render visualization in.*

## Bars

<p>
  <img src="/demo/screenshots/Bars.png" width="960" alt="bars" />
</p>

```javascript
const component = new AudioVisualizer({
  type: 'bars',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  colors: {
    background: '#1D1E25',
    min: '#56D45B', // Green, gradient index 0
    step0: '#AFF2B3', // Light green, gradient index 0.7
    step1: '#FFAD67', // Orange, gradient index 0.833
    step2: '#FF6B67', // Red, gradient index 0.9
    max: '#FFBAB8' // Light red, gradient index 1
  }
});
```

## Circle

<p>
  <img src="/demo/screenshots/Circle.png" width="960"  alt="circle"/>
</p>

```javascript
const component = new AudioVisualizer({
  type: 'frequencycircle',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  image: 'assets/img/manazeak-logo-small.svg'
});
```

## Oscilloscope

<p>
  <img src="/demo/screenshots/Oscilloscope.png" width="960" alt="oscilloscope" />
</p>

```javascript
const component = new AudioVisualizer({
  type: 'oscilloscope',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */
  fftSize: 1024,
  audioContext: null,
  inputNode: null,
  merged: false, // Merge left and right channels
  colors: {
    background: '#1D1E25', // Hex/RGB/HSL
    signal: '#56D45B' // Hex/RGB/HSL or 'rainbow'
  }
});
```

## Peak meter

<p>
  <img src="/demo/screenshots/Peakmeter.png" width="960" alt="peakmeter" />
</p>

```javaScript
const component = new AudioVisualizer({
  type: 'peakmeter',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  merged: false,
  orientation: 'horizontal',
  legend: {
    dbScaleMin: 60,
    dbScaleTicks: 15
  },
  colors: {
    background: '#1D1E25', // Mzk background
    min: '#56D45B', // Mzk green, gradient index 0
    step0: '#AFF2B3', // Light green, gradient index 0.7
    step1: '#FFAD67', // Orange, gradient index 0.833
    step2: '#FF6B67', // Red, gradient index 0.9
    max: '#FFBAB8' // Light red, gradient index 1
  }
});
```

## Spectrum

<p>
  <img src="/demo/screenshots/Spectrum.png" width="960" alt="spectrum" />
</p>

```javascript
const component = new AudioVisualizer({
  type: 'spectrum',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  merged: false,
  colorSmoothing: true,
  scale: 'logarithmic' // linear/logarithmic
});
```

## Timeline

<p>
  <img src="/demo/screenshots/Timeline.png" width="960" alt="timeline" />
</p>

```javascript
const component = new AudioVisualizer({
  type: 'timeline',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  speed: 5,
  beat: {
    offset: null, // Time in s
    bpm: null,
    timeSignature: null
  },
  colors: {
    background: '#1D1E25',
    track: '#12B31D',
    mainBeat: '#FF6B67',
    subBeat: '#56D45B'
  },
  hotCue: [] // Array of hot cues to display. Must match the format returned by method setHotCuePoint
});
```

## Waveform

<p>
  <img src="/demo/screenshots/Waveform.png" width="960" alt="waveform" />
</p>


```javascript
const component = new AudioVisualizer({
  type: 'waveform',
  player: document.querySelector('audio'),
  renderTo: document.body,
  /* Optional arguments presented with default values */  
  fftSize: 1024,
  audioContext: null,
  inputNode: null,  
  animation: 'gradient', // fade or gradient
  wave: {
    align: 'center', // top/center/bottom
    barWidth: 1, // Parent percentage [1, 100]
    barMarginScale: 0.25, // Bar margin percentage from width [0, 1]
    merged: true, // For center align only
    noSignalLine: true // Display a line when no signal
  },
  colors: {
    background: '#1D1E25',
    track: '#E7E9E7',
    progress: '#56D45B'
  },
  hotCue: [] // Array of hot cues to display. Must contain a time key with its value in seconds
});
```

# Development

If you clone this repository, you can `npm install` to install development dependencies. This will allow you to build dist file, run the component tests or generate the documentation ;

- `npm run build` to generate the minified file ;
- `npm run dev` to watch for any change in source code ;
- `npm run web-server` to launch a local development server ;
- `npm run doc` to generate documentation ;
- `npm run beforecommit` to perform tests, generate doc and bundle the JavaScript.

To avoid CORS when locally loading the example HTML file, run the web server. Please do not use it on a production environment. Unit tests are performed on both Firefox and Chrome ; ensure you have both installed before running tests, otherwise they might fail.

Free sample mp3 is from [Teminite](https://www.facebook.com/Teminite/app/208195102528120), other frequency insanity is mine.
If you have any question or idea, feel free to DM or open an issue (or even a PR, who knows) ! I'll be glad to answer your request.

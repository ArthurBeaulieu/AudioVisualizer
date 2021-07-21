# Component principle

`AudioVisualizer` is an es6 module, using the Factory design pattern to allow the instantiation of each audio component using a single class. It is automatically attached to the `window` object so it is globally available where included.

This module offers the following components ; `FrequencyBars`, `FrequencyCircle`, `Oscilloscope`, `PeakMeter`, `Timeline` and `Waveform`. Each component either inherits `VisuComponentMono` or `VisuComponentStereo`, depending on its Mon/Stereo nature. `VisuComponentMono` and `VisuComponentStereo` are abstraction classes that hold the Web Audio API node routing, and the canvas infrastructure for the componenent, depending on its Mono/Stereo nature. It does not process any bins, but only offers the baseline for a visualization component.  Those two classes also inherits from the `BaseComponent` class, which handles audio internals (fft size, audio context etc.), playback events and click events, that are common for each components. Here is a short inehritance sequence to summarize it : 

`VisuComponent` -> inherits from `VisuComponentMono`/`VisuComponentStereo` -> inherits from `BaseComponent`

Each component relies on `CanvasUtils` and `ColorUtils` to perform their canvas drawings. These utils classes doesn't required to be instanciated, as all of their methods are static.

For further information on each of these JavaScript files, check the source code, [read the documentation](https://arthurbeaulieu.github.io/AudioVisualizer/doc/index.html), or PM me.

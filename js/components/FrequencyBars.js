import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';


class FrequencyBars extends VisuComponentMono {


  constructor(options) {
    super(options);
  }


  _fillAttributes(options) {
    super._fillAttributes(options);
    // Frequency bars specific attributes
    this._color = options.color || '#56D45B';
  }


  _processAudioBin() {
    // Only fill again the canvas if player is playing
    if (this._isPlaying === true) {
      this._clearCanvas();
      // Get frequency data for current bin in node analyser
      const frequencyData = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      this._nodes.analyser.getByteFrequencyData(frequencyData);
      // Iterate over data to build each bar
      const frequencyWidth = (this._canvas.width / this._nodes.analyser.frequencyBinCount);
      let cursorX = 0; // X origin for items in loop
      for (let i = 0; i < this._nodes.analyser.frequencyBinCount; ++i) {
        // Compute frequency height in px, relative to the canvas height
        let frequencyHeight = (frequencyData[i] / 255) * (this._canvas.height);
        CanvasUtils.drawVerticalBar(this._canvas, {
          frequencyHeight: frequencyHeight,
          frequencyWidth: frequencyWidth,
          color: this._color,
          originX: cursorX
        });
        // Update cursor position
        cursorX += frequencyWidth;
      }
      // Draw next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


}


export default FrequencyBars;

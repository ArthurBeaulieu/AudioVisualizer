import VisuComponentStereo from '../utils/VisuComponentStereo.js';
import CanvasUtils from '../utils/CanvasUtils.js';


class Oscilloscope extends VisuComponentStereo {


  constructor(options) {
    super(options);
    // Init oscilloscope dimensions
    this._updateDimensions();
  }


  /*  ----------  VisuComponentStereo overrides  ----------  */



  _fillAttributes(options) {
    super._fillAttributes(options)
    this._color = options.color || '#56D45B'; // Green
    // Dimensions will be computed when canvas have been created
    this._dimension = {
      height: null,
      canvasHeight: null,
      width: null
    };
  }


  _onResize() {
    super._onResize();
    this._updateDimensions();
  }


  /*  ----------  Oscilloscope internal methods  ----------  */  


  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      // Create TimeDomain array with freqency bin length
      let timeDomain = new Uint8Array(this._nodes.analyserL.frequencyBinCount);
      // Left channel
      this._nodes.analyserL.getByteTimeDomainData(timeDomain);
      CanvasUtils.drawOscilloscope(this._canvasL, {
        samples: this._nodes.analyserL.frequencyBinCount,
        timeDomain: timeDomain,
        color: this._color
      });
      // Right channel
      this._nodes.analyserR.getByteTimeDomainData(timeDomain);
      CanvasUtils.drawOscilloscope(this._canvasR, {
        samples: this._nodes.analyserL.frequencyBinCount,
        timeDomain: timeDomain,
        color: this._color
      });
      // Draw next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


  _updateDimensions() {
    this._dimension.height = this._renderTo.offsetHeight - 4; // 2px borders times two channels
    this._dimension.width = this._renderTo.offsetWidth - 2; // 2px borders
    this._dimension.canvasHeight = this._dimension.height / 2;
    this._canvasL.width = this._dimension.width;
    this._canvasL.height = this._dimension.canvasHeight;
    this._canvasR.width = this._dimension.width;
    this._canvasR.height = this._dimension.canvasHeight;
  }


}


export default Oscilloscope;

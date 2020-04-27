import VisuComponentMono from '../utils/VisuComponentMono.js';
import ColorUtils from '../utils/ColorUtils.js';


class WaveformProgress extends VisuComponentMono {


  constructor(options) {
    super(options);
  }


  _fillAttributes(options) {
    super._fillAttributes(options);
    this._animation = options.animation;
    this._merged = options.merged;
    this._bars = null;
    this._offlineCtx = null;
    this._offlineBuffer = null;
    // Raw channel data for whole audio file
    this._dataL = [];
    this._dataR = [];
    // Event binding
    this._trackLoaded = this._trackLoaded.bind(this);
    this._seekPlayer = this._seekPlayer.bind(this);
  }


  _buildUI() {
    super._buildUI();
    this._bars = this._canvas.width / 3;
  }


  _addEvents() {
    super._addEvents();
    this._player.addEventListener('loadedmetadata', this._trackLoaded, false);
    this._dom.container.addEventListener('click', this._seekPlayer, false);
  }


  _removeEvents() {
    super._removeEvents();
    this._player.removeEventListener('loadedmetadata', this._trackLoaded, false);
    this._dom.container.removeEventListener('click', this._seekPlayer, false);
  }


  _onResize() {
    super._onResize();
    this._bars = this._canvas.width / 3;
    this._fillData();
    this._clearCanvas();
    this._drawFileWaveform(this._player.currentTime / this._player.duration);
  }


  _dblClick() {
    // Required to revoke fullscreen toggle from parent class, as it interfers with seek feature
  }


  _trackLoaded() {
    cancelAnimationFrame(this._processAudioBin);
    this._clearCanvas(); // Clear previous canvas
    // Do XHR to request file and parse it
    this._getPlayerSourceFile();
  }


  _seekPlayer(event) {
    const boundingBox = event.target.getBoundingClientRect();
    const xOffset = event.clientX - boundingBox.left;
    this._player.currentTime = (xOffset / this._canvas.width) * this._player.duration;
    this._clearCanvas();
    this._drawFileWaveform(this._player.currentTime / this._player.duration);
  }


  _processAudioFile(response) {
    // Set offline context according to track duration to get its full samples
    this._offlineCtx = new OfflineAudioContext(2, this._audioCtx.sampleRate * this._player.duration, this._audioCtx.sampleRate);
    this._offlineSource = this._offlineCtx.createBufferSource();
    this._audioCtx.decodeAudioData(response, buffer => {
      this._offlineSource.buffer = buffer;
      this._offlineSource.connect(this._offlineCtx.destination);
      this._offlineSource.start();
      this._offlineCtx.startRendering().then(renderedBuffer => {
        this._offlineBuffer = renderedBuffer;
        this._fillData();
        this._drawFileWaveform(0);
      }).catch(function(err) {
        console.log('Rendering failed: ' + err);
      });
    });
  }


  _fillData() {
    if (this._offlineBuffer) {
      if (this._merged === true) {
        // Mono output will only use L array to store L/R averages
        this._dataL = this._genScaledMonoData(this._offlineBuffer);
      } else {
        this._dataL = this._genScaledData(this._offlineBuffer.getChannelData(0));
        this._dataR = this._genScaledData(this._offlineBuffer.getChannelData(1));
      }
    }
  }


  _genScaledData(data) {
    const subSampleSize = Math.floor(data.length / this._bars);
    const output = [];
    // We need to sub sample raw data according to the bar number. We average fq values
    for (let i = 0; i <= (data.length - subSampleSize); i += subSampleSize) {
      let sum = 0;
      for (let j = 0; j < subSampleSize; ++j) {
        sum += Math.abs(data[i + j]);
      }

      output.push(sum / subSampleSize);
    }

    return this._scaleDataToHeight(output);
  }


  _genScaledMonoData(buffer) {
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);
    const subSampleSize = Math.floor(dataL.length / this._bars);
    const output = [];

    // We need to sub sample raw data according to the bar number. We average fq values
    for (let i = 0; i <= dataL.length - subSampleSize; i += subSampleSize) {
      let sum = 0;
      for (let j = 0; j < subSampleSize; ++j) {
        sum += (Math.abs(dataL[i + j]) + Math.abs(dataR[i + j])) / 2;
      }

      output.push(sum / subSampleSize);
    }

    return this._scaleDataToHeight(output);
  }


  /* Convert a range to another, maintaining ratio
   * oldRange = (oldMax - oldMin)
   * newRange = (newMax - newMin)
   * newValue = (((oldValue - oldMin) * newRange) / oldRange) + NewMin */
  _scaleDataToHeight(sampledData) {
    // We take max value of sampled data as 90% height in canvas as ref
    const oldMax = Math.max(...sampledData);
    const oldMin = Math.min(...sampledData);

    const oldRange = oldMax - oldMin;
    const newRange = this._canvas.height * .9;

    let scaledData = [];
    for (let i = 0; i < sampledData.length; ++i) {
      scaledData.push(((sampledData[i] - oldMin) * newRange) / oldRange);
    }

    return scaledData;
  }


  _drawFileWaveform(progressPercentage) {
    var x = this._canvas.width / this._bars;
    const margin = x / 8;

    this._ctx.beginPath();
    // Iterate bar data
    for (let i = 0; i < this._dataL.length; ++i) {
      // Determine Y pos for Up and Down rectangles to draw (in mono, we only use merged data in dataL array)
      const yU = this._dataL[i] / 2;
      const yD = (this._merged === true) ? this._dataL[i] / 2 : this._dataR[i] / 2;
      // Determine bar color according to progress.
      this._ctx.fillStyle = '#E7E9E7'; // White by default (un-read yet)
      if ((x * (i + 1)) / this._canvas.width > progressPercentage && (x * i) / this._canvas.width < progressPercentage) {
        // Create linear gradient on bar X dimension
        const gradient = this._ctx.createLinearGradient(
          x * i + margin, 0, // Bar X start
          x * (i + 1) - margin, 0 // Bar X end
        );
        // Get bar range in px
        let barRange = ((x * (i + 1))) - ((x * i));
        // We get progress X position according to canvas width
        let progressX = progressPercentage * this._canvas.width;
        // Convert this width into a percentage of barWidth progression
        let barProgressPercentage = (Math.abs(progressX - (x * i))) / (barRange);
        if (this._animation === 'gradient') {
          if (barProgressPercentage + 0.01 < 1) {
            gradient.addColorStop(0, '#56D45B'); // Green
            gradient.addColorStop(barProgressPercentage, '#56D45B'); // Green
            gradient.addColorStop(barProgressPercentage + 0.01, '#E7E9E7'); // Not progressive gradient
            gradient.addColorStop(1, '#E7E9E7');
            this._ctx.fillStyle = gradient; // Gradient from green to white with correct progression in bar
          } else {
            this._ctx.fillStyle = '#56D45B'; // Green full for last position in bars
          }
        } else {
          const amount = Math.round(barProgressPercentage * 255);
          this._ctx.fillStyle = ColorUtils.lightenDarkenColor('#56D45B', 255 - amount); // Green full for last position in bars
        }
     } else if (i / this._dataL.length < progressPercentage) {
        this._ctx.fillStyle = '#56D45B'; // Green for already played bars
      }
      // Draw up and down rectangles for current bar
      this._ctx.fillRect(x * i + margin, (this._canvas.height / 2) - yU, x - margin * 2, yU);
      this._ctx.fillRect(x * i + margin, this._canvas.height / 2, x - margin * 2, yD);
      // Add tiny centered line
      this._ctx.fillRect(x * i + margin, this._canvas.height / 2 - 0.15, x - margin * 2, 0.15);
    }

    this._ctx.closePath();
  }



  _getPlayerSourceFile() {
    const request = new XMLHttpRequest();
    request.open('GET', this._player.src, true);
    request.responseType = 'arraybuffer';
    request.onload = () => { this._processAudioFile(request.response); };
    request.send();
  }


  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      this._drawFileWaveform(this._player.currentTime / this._player.duration);
      requestAnimationFrame(this._processAudioBin);
    }
  }


}


export default WaveformProgress;

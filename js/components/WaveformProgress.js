import VisuComponentMono from '../utils/VisuComponentMono.js';


class WaveformProgress extends VisuComponentMono {


  constructor(options) {
    super(options);
    this._getPlayerSourceFile();
  }


  _fillAttributes(options) {
    super._fillAttributes(options);
    this._merged = options.merged;
    this._bars = null;
    this._offlineCtx = null;
    // Raw channel data for whole audio file
    this._dataL = [];
    this._dataR = [];
    // Raw waveform canvas (not rendered on DOM)
    this._waveformCanvas = document.createElement('CANVAS');
    this._waveformCtx = this._waveformCanvas.getContext('2d');
  }


  _buildUI() {
    super._buildUI();
    this._waveformCanvas = document.createElement('CANVAS');
    this._waveformCtx = this._waveformCanvas.getContext('2d');
    this._waveformCanvas.width = this._canvas.width;
    this._waveformCanvas.height = this._canvas.height;
  }


  _setAudioNodes() {
    super._setAudioNodes();
    this._offlineCtx = new OfflineAudioContext(2, this._audioCtx.sampleRate * this._nodes.source.channelCount * 10, this._audioCtx.sampleRate);
    this._offlineSource = this._offlineCtx.createBufferSource();
  }


  _processAudioFile(response) {
    this._audioCtx.decodeAudioData(response, buffer => {
      this._offlineSource.buffer = buffer;
      this._offlineSource.connect(this._offlineCtx.destination);
      this._offlineSource.start();
      this._offlineCtx.startRendering().then(renderedBuffer => {
        this._bars = this._canvas.width / 6;
        this._fillData(renderedBuffer);
        this._drawFileWaveform(0);
      }).catch(function(err) {
        console.log('Rendering failed: ' + err);
      });
    });
  }


  _genScaledData(data) {
    const subSampleSize = Math.floor(data.length / this._bars);
    const output = [];
    // We need to sub sample raw data according to the bar number. We average fq values
    for (let i = 0; i <= data.length - subSampleSize; i += subSampleSize) {
      let sum = 0;
      for (let j = 0; j < subSampleSize; ++j) {
        sum += Math.abs(data[i + j]);
      }

      output.push(sum / subSampleSize);
    }

    return this._scaleDataToHeight(output);
  }


  _fillData(renderedBuffer) {
    if (this._merged === true) {
      // Mono output will only use L array to store L/R averages
      this._dataL = this._genScaledMonoData(renderedBuffer);
    } else {
      this._dataL = this._genScaledData(renderedBuffer.getChannelData(0));
      this._dataR = this._genScaledData(renderedBuffer.getChannelData(1));
    }
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
    const margin = x / 6;

    this._ctx.beginPath();
    // Iterate bar data
    for (let i = 0; i < this._dataL.length; ++i) {
      // Determine Y pos for Up and Down rectangles to draw (in mono, we only use merged data in dataL array)
      const yU = this._dataL[i] / 2;
      const yD = (this._merged === true) ? this._dataL[i] / 2 : this._dataR[i] / 2;
      // Determine bar color according to progress.
      this._ctx.fillStyle = '#FFF'; // White by default (un-read yet)
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
        // All except last gradient values
        if (barProgressPercentage + 0.01 < 1) {
          gradient.addColorStop(0, '#0F0');
          gradient.addColorStop(barProgressPercentage, '#0F0');
          gradient.addColorStop(barProgressPercentage + 0.01, '#FFF'); // Not progressive gradient
          gradient.addColorStop(1, '#FFF');
          this._ctx.fillStyle = gradient; // Gradient from green to white with correct progression in bar
        } else {
          this._ctx.fillStyle = '#0F0'; // Green full for last position in bars
        }

     } else if (i / this._dataL.length < progressPercentage) {
        this._ctx.fillStyle = '#0F0'; // Green for already played bars
      }
      // Draw up and down rectangles for current bar
      this._ctx.fillRect(x * i + margin, (this._canvas.height / 2) - yU, x - margin * 2, yU);
      this._ctx.fillRect(x * i + margin, this._canvas.height / 2, x - margin * 2, yD);
    }

    this._ctx.closePath();
    // Save waveform without any progress to properly restore view without computation on resize/seek
    this._waveformCtx.drawImage(this._canvas, 0, 0, this._canvas.width, this._canvas.height);
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
      const percentage = this._player.currentTime / this._player.duration;
      this._drawFileWaveform(percentage);
      // this._ctx.beginPath();
      // this._ctx.globalCompositeOperation = 'source-atop';
      // this._ctx.fillStyle = '#00D';
      // this._ctx.fillRect(0, 0, (percentage * this._canvas.width), this._canvas.height);
      // this._ctx.closePath();
      requestAnimationFrame(this._processAudioBin);
    }
  }


}


export default WaveformProgress;

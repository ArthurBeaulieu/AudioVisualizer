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
  }


  _buildUI() {
    super._buildUI();
    this._bufferCanvas = document.createElement('CANVAS');
    this._bufferCtx = this._bufferCanvas.getContext('2d');
    this._bufferCanvas.width = this._canvas.width;
    this._bufferCanvas.height = this._canvas.height;
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
      this._offlineCtx.startRendering().then((renderedBuffer) => {
        this._bars = this._canvas.width / 4;

        this._ctx.fillStyle = '#F00';
        this._ctx.beginPath();

        let dataL = [];
        let dataR = [];

        if (this._merged === true) {
          dataL = this._genScaledMonoData(renderedBuffer);
        } else {
          dataL = this._genScaledData(renderedBuffer.getChannelData(0));
          dataR = this._genScaledData(renderedBuffer.getChannelData(1));
        }

        var x = this._canvas.width / this._bars;
        const margin = x / 16;

        for (let i = 0; i < dataL.length; ++i) {
           var yL = dataL[i] / 2;
           var yR = (this._merged === true) ? dataL[i] / 2 : dataR[i] / 2;
           this._ctx.fillRect(x * i + margin, (this._canvas.height / 2) - yL, x - margin * 2, yL);
           this._ctx.fillRect(x * i + margin, this._canvas.height / 2, x - margin * 2, yR);
        }
        this._ctx.closePath();
      }).catch(function(err) {
          console.log('Rendering failed: ' + err);
          // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
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



  _getPlayerSourceFile() {
    const request = new XMLHttpRequest();
    request.open('GET', this._player.src, true);
    request.responseType = 'arraybuffer';
    request.onload = () => { this._processAudioFile(request.response); };
    request.send();
  }


  _processAudioBin() {
    if (this._isPlaying === true) {
      // this._ctx.beginPath();
      // this._ctx.globalCompositeOperation = "source-atop";
      // this._ctx.fillStyle = '#00D';
      // const percentage = this._player.currentTime / this._player.duration;
      // this._ctx.fillRect(0, 0, (percentage * this._canvas.width), this._canvas.height)
      // this._ctx.beginPath();
      // requestAnimationFrame(this._processAudioBin);
    }
  }


}


export default WaveformProgress;

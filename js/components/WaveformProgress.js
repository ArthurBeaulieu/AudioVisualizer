import VisuComponentMono from '../utils/VisuComponentMono.js';


class WaveformProgress extends VisuComponentMono {


  constructor(options) {
    super(options);

    this.getData();
  }


  _fillAttributes(options) {
    super._fillAttributes(options);
    this._offlineCtx = new OfflineAudioContext(2, 44100 * 40, 44100);
  }


  _setAudioNodes() {
    super._setAudioNodes();

    this._offlineSource = this._offlineCtx.createBufferSource();
    //
    //
    //
    // console.log(this._nodes.source)
    // this._audioCtx.decodeAudioData(this._nodes.source, (buffer) => {
    //   this._offlineSource.buffer = buffer;
    //   this._offlineSource.connect(this._offlineCtx.destination);
    //   this._offlineSource.start();
    //
    //   this._offlineCtx.startRendering().then(function(renderedBuffer) {
    //     console.log('Rendering completed successfully');
    //     var song = audioCtx.createBufferSource();
    //     song.buffer = renderedBuffer;
    //
    //     song.connect(audioCtx.destination);
    //
    //     play.onclick = function() {
    //       song.start();
    //     }
    //   }).catch(function(err) {
    //       console.log('Rendering failed: ' + err);
    //       // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
    //   });
    // });
  }


  getData() {
    var request = new XMLHttpRequest();

    request.open('GET', this._player.src, true);

    request.responseType = 'arraybuffer';

    request.onload = () => {
      var audioData = request.response;

      this._audioCtx.decodeAudioData(audioData, (buffer) => {
        var myBuffer = buffer;
        this._offlineSource.buffer = myBuffer;
        this._offlineSource.connect(this._offlineCtx.destination);
        this._offlineSource.start();
        //source.loop = true;
        this._offlineCtx.startRendering().then((renderedBuffer) => {
          var nombreFrames =   this._audioCtx.sampleRate * 2.0;
          for (var canal = 0; canal < 2; canal++) {
            // génère le tableau contenant les données
            var tampon = renderedBuffer.getChannelData(canal);
            for (var i = 0; i < nombreFrames; i++) {
              // Math.random() donne une valeur comprise entre [0; 1.0]
              // l'audio doit être compris entre [-1.0; 1.0]
              tampon[i] = Math.random() * 2 - 1;
            }
          }

          console.log('Rendering completed successfully', tampon);
        }).catch(function(err) {
            console.log('Rendering failed: ' + err);
            // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
      });
    }

    request.send();
  }


  _processAudioBin() {

  }

}


export default WaveformProgress;

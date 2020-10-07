import BaseComponent from "./BaseComponent.js";
'use strict';


class VisuComponentStereo extends BaseComponent {


  /** @summary VisuComponentStereo is an abstraction for stereo visualisation components. It must be inherited.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments BaseComponent
   * @description <blockquote>Stereo components inherit this class to benefit its node routing and canvas
   * configuration. It is meant to use a L/R canvas for stereo or merged L/R one. This class extends BaseComponent to
   * benefits all shared properties between visualisations.</blockquote>
   * @param {object} options - The visualizer root options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {boolean} [options.merged=false] - Merge channels into mono output **/
  constructor(options) {
    super();
    /** @private
     * @member {boolean} - Merge L and R channel on output */    
    this._merged = null;
    /** @private
     * @member {object} - Audio nodes from web audio API to manipulate data with */
    this._nodes = {
      source: null, // HTML audio element
      splitter: null, // Stereo channel splitting
      merger: null, // Merge channels into one
      analyser: null, // Merged stereo channels analysis
      analyserL: null, // Left channel analysis
      analyserR: null // Right channel analysis
    };
    /** @private
     * @member {object} - The canvas to rendered left channed data to */       
    this._canvasL = null;
    /** @private
     * @member {object} - The canvas to rendered right channed data to */     
    this._canvasR = null;
    /** @private
     * @member {object} - The left canvas associated context */ 
    this._ctxL = null;
    /** @private
     * @member {object} - The right canvas associated context */     
    this._ctxR = null;
    // Construction sequence
    this._fillAttributes(options);
    this._buildUI();
    this._setAudioNodes();
    this._addEvents();
  }


  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof VisuComponentStereo
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The visualizer root options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {boolean} [options.merged=false] - Merge channels into mono output **/
  _fillAttributes(options) {
    this._type = options.type;
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize || 1024;
    this._audioCtx = options.audioContext;
    this._inputNode = options.inputNode;
    this._merged = options.merged || false;
  }


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof VisuComponentStereo
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add(`audio-${this._type}`);
    this._canvasL = document.createElement('canvas');
    this._canvasR = document.createElement('canvas');
    this._canvasL.style.cssText = 'background-color:black;border: solid 1px #2c2c30;display:block;box-sizing:border-box;';
    this._canvasR.style.cssText = 'background-color:black;border: solid 1px #2c2c30;display:block;box-sizing:border-box;';
    this._ctxL = this._canvasL.getContext('2d');
    this._ctxR = this._canvasR.getContext('2d');
    this._ctxL.translate(0.5, 0.5);
    this._ctxR.translate(0.5, 0.5);
    this._dom.container.appendChild(this._canvasL);
    this._dom.container.appendChild(this._canvasR);
    this._renderTo.appendChild(this._dom.container);
  }


  /** @method
   * @name _setAudioNodes
   * @private
   * @override
   * @memberof VisuComponentStereo
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Build audio chain with source -> splitter -> analyzerL/R -> merger -> destination.</blockquote> **/
  _setAudioNodes() {
    let audioCtxSent = false;
    if (!this._audioCtx) {
      this._audioCtx = new AudioContext();
      this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    } else {
      audioCtxSent = true;
      this._nodes.source = this._inputNode;
    }

    let outputNode;
    if (this._merged === true) {
      this._nodes.analyser = this._audioCtx.createAnalyser();
      this._nodes.analyser.fftSize = this._fftSize;
      // Nodes chaining
      this._nodes.source.connect(this._nodes.analyser);
      outputNode = this._nodes.analyser;
    } else {
      this._nodes.splitter = this._audioCtx.createChannelSplitter(this._nodes.source.channelCount);
      this._nodes.merger = this._audioCtx.createChannelMerger(this._nodes.source.channelCount);
      this._nodes.analyserL = this._audioCtx.createAnalyser();
      this._nodes.analyserR = this._audioCtx.createAnalyser();
      this._nodes.analyserR.fftSize = this._fftSize;
      this._nodes.analyserL.fftSize = this._fftSize;
      // Nodes chaining
      this._nodes.source.connect(this._nodes.splitter);
      this._nodes.splitter.connect(this._nodes.analyserL, 0);
      this._nodes.splitter.connect(this._nodes.analyserR, 1);
      this._nodes.analyserL.connect(this._nodes.merger, 0, 0);
      this._nodes.analyserR.connect(this._nodes.merger, 0, 1);
      outputNode = this._nodes.merger;
    }

    if (!audioCtxSent) {
      outputNode.connect(this._audioCtx.destination);
    } else {
      // If any previous context exists, we mute this channel to not disturb any playback
      const gainNode = this._audioCtx.createGain();
      gainNode.gain.value = 0;
      outputNode.connect(gainNode);
      gainNode.connect(this._audioCtx.destination);
    }
  }


  /** @method
   * @name _clearCanvas
   * @private
   * @override
   * @memberof VisuComponentStereo
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Clear component canvas contexts from their content.</blockquote> **/
  _clearCanvas() {
    this._canvasL.getContext('2d').clearRect(0, 0, this._canvasL.width, this._canvasL.height);
    this._canvasR.getContext('2d').clearRect(0, 0, this._canvasR.width, this._canvasR.height);
  }


};


export default VisuComponentStereo;

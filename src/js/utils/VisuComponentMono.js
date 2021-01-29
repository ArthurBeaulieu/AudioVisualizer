import BaseComponent from "./BaseComponent.js";
'use strict';


class VisuComponentMono extends BaseComponent {


  /** @summary VisuComponentMono is an abstraction for mono visualisation component. It must be inherited.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments BaseComponent
   * @description <blockquote>Mono components inherit this class to benefit its node routing and canvas
   * configuration. It is meant to use a single canvas for mono or merged L/R audio channels. This class extends
   * BaseComponent to benefits all shared properties between visualisations.</blockquote>
   * @param {object} options - The visualizer root options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one **/
  constructor(options) {
    super();
    /** @private
     * @member {object} - Audio nodes from web audio API to manipulate data with */
    this._nodes = {
      source: null, // HTML audio element
      analyser: null // Analysis node
    };
    /** @private
     * @member {object} - The canvas to rendered mono data to */
    this._canvas = null;
    /** @private
     * @member {object} - The canvas associated context */
    this._ctx = null;
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
   * @memberof VisuComponentMono
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The visualizer root options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one **/
  _fillAttributes(options) {
    this._type = options.type;
    this._player = options.player;
    this._renderTo = options.renderTo;
    this._fftSize = options.fftSize;
    this._audioCtx = options.audioContext;
    this._inputNode = options.inputNode;
  }


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof VisuComponentMono
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    this._dom.container = document.createElement('DIV');
    this._dom.container.classList.add(`audio-${this._type}`);
    this._canvas = document.createElement('CANVAS');
    this._canvas.style.cssText = 'background-color:black;border:solid 1px #2c2c30;display:block;box-sizing:border-box;';
    this._ctx = this._canvas.getContext('2d');
    this._ctx.translate(0.5, 0.5);
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
    this._dom.container.appendChild(this._canvas);
    this._renderTo.appendChild(this._dom.container);
  }


  /** @method
   * @name _setAudioNodes
   * @private
   * @override
   * @memberof VisuComponentMono
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Build audio chain with source -> analyzer -> destination.</blockquote> **/
  _setAudioNodes() {
    let audioCtxSent = false;
    if (!this._audioCtx) {
      this._audioCtx = new AudioContext();
      this._nodes.source = this._audioCtx.createMediaElementSource(this._player);
    } else {
      audioCtxSent = true;
      this._nodes.source = this._inputNode;
    }

    this._nodes.analyser = this._audioCtx.createAnalyser();
    this._nodes.analyser.fftSize = this._fftSize;

    this._nodes.source.connect(this._nodes.analyser);

    if (!audioCtxSent) {
      this._nodes.analyser.connect(this._audioCtx.destination);
    }
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof VisuComponentMono
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
  _onResize() {
    this._canvas.width = this._renderTo.offsetWidth - 2;
    this._canvas.height = this._renderTo.offsetHeight - 2;
  }


  /** @method
   * @name _clearCanvas
   * @private
   * @override
   * @memberof VisuComponentMono
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Clear component canvas context from its content.</blockquote> **/
  _clearCanvas() {
    this._canvas.getContext('2d').clearRect(0, 0, this._canvas.width, this._canvas.height);
  }


};


export default VisuComponentMono;

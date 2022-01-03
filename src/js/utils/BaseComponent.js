class BaseComponent {


  /** @summary BaseComponent is the bedrock of any visualisation here. It must be inherited from Mono or Stereo component abstractions.
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Store all base method, mostly to handle events, other processing methods needs to be overridden.</blockquote> **/
  constructor() {
    /** @private
     * @member {string} - The component type. See supported componenets in AudioVisualizer factory */
    this._type = null;
    /** @private
     * @member {object} - The audio source (HTML audio player) */
    this._player = null;
    /** @private
     * @member {object} - Target div to render module in */
    this._renderTo = null;
    /** @private
     * @member {number} - FFT size used to analyse audio stream. Must be a power of 2 */
    this._fftSize = null;
    /** @private
     * @member {object} - The audio context */
    this._audioCtx = null;
    /** @private
     * @member {object} - The source node to chain from ; it will ignore the output of HTML audio player */
    this._inputNode = null;
    /** @private
     * @member {boolean} - The playing state of the player */
    this._isPlaying = false;
    /** @private
     * @member {object} - Contains all useful DOM objects */
    this._dom = {
      container: null
    };
    /** @private
     * @member {object} - Save container dimension to restore when closing fullscreen */
    this._parentDimension = {
      position: null,
      height: null,
      width: null,
      zIndex: null
    };
    /** @private
     * @member {object} - Resize observable to watch for any resize change */
    this._resizeObserver = null;
    // Event binding
    this._onResize = this._onResize.bind(this);
    this._play = this._play.bind(this);
    this._pause = this._pause.bind(this);
    this._dblClick = this._dblClick.bind(this);
    // Bind process audio bin for add and remove event on demand
    this._processAudioBin = this._processAudioBin.bind(this);
  }


  /** @method
   * @name destroy
   * @public
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>The destroy method to clear events and remove all component properties.</blockquote> **/
  destroy() {
    this._removeEvents();
    Object.keys(this).forEach(key => { delete this[key]; });
  }


  /** @method
   * @name _fillAttributes
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Build component properties from options. Must be implemented in sub class.</blockquote> **/
  _fillAttributes() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _buildUI
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create, configure and append UI in DOM. Must be implemented in sub class.</blockquote> **/
  _buildUI() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _setAudioNodes
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Build audio chain with source. Must be implemented in sub class.</blockquote> **/
  _setAudioNodes() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _processAudioBin
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time audio analysis using PCM data from WebAudioAPI. Must be implemented in sub class.</blockquote> **/
  _processAudioBin() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _addEvents
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Add component events (resize, play, pause, dbclick).</blockquote> **/
  _addEvents() {
    // Put observer on renderTo and callback onResize at each action
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this._renderTo);
    // Playback events
    this._player.addEventListener('play', this._play, false);
    this._player.addEventListener('pause', this._pause, false);
    // Double click handler (fullscreen for most components)
    this._dom.container.addEventListener('dblclick', this._dblClick, false);
  }


  /** @method
   * @name _removeEvents
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Remove component events (resize, play, pause, dbclick).</blockquote> **/
  _removeEvents() {
    // Clear observable
    this._resizeObserver.disconnect();
    // Clear playback events
    this._player.removeEventListener('play', this._play, false);
    this._player.removeEventListener('pause', this._pause, false);
    // Remove double click listener
    this._dom.container.removeEventListener('dblclick', this._dblClick, false);
  }


  /** @method
   * @name _play
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On play event callback.</blockquote> **/
  _play() {
    this._audioCtx.resume();
    this._isPlaying = true;
    this._processAudioBin();
  }


  /** @method
   * @name _pause
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On pause event callback.</blockquote> **/
  _pause() {
    this._audioCtx.suspend();
    this._isPlaying = false;
  }


  /** @method
   * @name _onResize
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback. Must be implemented in sub class.</blockquote> **/
  _onResize() {
    // Resize must be handled in each sub class
  }


  /** @method
   * @name _dblClick
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On double click event callback (toggle fullscreen).</blockquote> **/
  _dblClick() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        // Restore renderTo initial style
        this._renderTo.style.position = this._parentDimension.position;
        this._renderTo.style.height = this._parentDimension.height;
        this._renderTo.style.width = this._parentDimension.width;
        this._renderTo.style.zIndex = this._parentDimension.zIndex;
        this._parentDimension = {
          position: null,
          height: null,
          width: null,
          zIndex: null
        };
      });
    } else {
      document.documentElement.requestFullscreen().then(() => {
        // Update renderTo dimension (canvas will be automatically rescaled)
        this._parentDimension = {
          position: this._renderTo.style.position,
          height: this._renderTo.style.height,
          width: this._renderTo.style.width,
          zIndex: this._renderTo.style.zIndex || ''
        };
        // Alter render to style to make it fullscreen
        this._renderTo.style.position = 'fixed';
        this._renderTo.style.height = '100vh';
        this._renderTo.style.width = '100vw';
        this._renderTo.style.zIndex = '999';
      });
    }
  }


  /** @method
   * @name _clearCanvas
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Clear component canvas contexts from their content. Must be implemented in sub class.</blockquote> **/
  _clearCanvas() {
    // Clear canvas must be handled in Mono/Stereo sub class depending on amount of canvas
  }


}


export default BaseComponent;

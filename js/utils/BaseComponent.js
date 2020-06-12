class BaseComponent {


  /** @summary BaseComponent is the bedrock of any visualisation here. It must be inherited from Mono or Stereo component abstraction.
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Store all base method, mostly to handle events.</blockquote> **/
  constructor() {
    // Attributes that can be sent as options
    this._type = null;
    this._player = null; // Source (HTML audio player)
    this._renderTo = null; // Target div to render module in
    this._fftSize = null; // FFT size used to analyse audio stream
    // The Web Audio API context
    this._audioCtx = null;
    this._inputNode = null; // Optional, the source node to chain from ; it will ignore the output of HTML audio player
    // Display utils
    this._dom = {
      container: null
    };
    // Render to original dimension for fullscreen
    this._parentDimension = {
      position: null,
      height: null,
      width: null,
      zIndex: null
    };
    // Event binding
    this._resizeObserver = null;
    this._onResize = this._onResize.bind(this);
    this._play = this._play.bind(this);
    this._pause = this._pause.bind(this);
    this._dblClick = this._dblClick.bind(this);
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
   * @description <blockquote>Build component properties from options.</blockquote> **/
  _fillAttributes() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _buildUI
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create, configure and append in DOM.</blockquote> **/
  _buildUI() {
    // Must be implemented in sub class
  }


  /** @method
   * @name _setAudioNodes
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Build audio chain with source.</blockquote> **/
  _setAudioNodes() {
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
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this._renderTo);
    this._player.addEventListener('play', this._play, false);
    this._player.addEventListener('pause', this._pause, false);
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
    this._resizeObserver.disconnect();
    this._player.removeEventListener('play', this._play, false);
    this._player.removeEventListener('pause', this._pause, false);
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
    this._isPlaying = false;
  }


  /** @method
   * @name _onResize
   * @private
   * @memberof BaseComponent
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback. Must be handled in child class.</blockquote> **/
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
   * @description <blockquote>Clear component canvas contexts from their content.</blockquote> **/
  _clearCanvas() {
    // Clear canvas must be handled in Mono/Stereo sub class depending on amount of canvas
  }


}


export default BaseComponent;

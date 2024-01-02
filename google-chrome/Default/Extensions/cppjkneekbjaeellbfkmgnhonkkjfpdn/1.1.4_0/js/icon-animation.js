/**
 * Potential Animated Icon
 */

IconAnimation.FULL_SIZE = 64;
IconAnimation.HALF_SIZE = 32;

function IconAnimation() {

  var self = this;

  var _canvas = document.createElement('canvas');
  var _context = _canvas.getContext('2d');

  var _canvasRetina = document.createElement('canvas');
  var _contextRetina = _canvasRetina.getContext('2d');

  var _imageA = new Image();
  var _imageB = new Image();
  var _imageARetina = new Image();
  var _imageBRetina = new Image();

  var _imageAlpha = 0;
  var _imageTargetAlpha = 0;
  var _imageAlphaSpeed = 1;
  var _imagesToLoad = 4;

  var _timer;

  this.updated = new signals.Signal();

  /**
   *
   */

  function _init() {
    
    _timer = new Timer();
    _timer.updated.add(self.update, self);

    _canvas.width = IconAnimation.HALF_SIZE;
    _canvas.height = IconAnimation.HALF_SIZE;

    _canvasRetina.width = IconAnimation.FULL_SIZE;
    _canvasRetina.height = IconAnimation.FULL_SIZE;

    jQuery([_imageARetina, _imageBRetina, _imageA, _imageB]).load(function() {
      _imagesToLoad--;
      if (_imagesToLoad <= 0) {
        self.update();
      }
    });

    _imageA.src = `img/icon_${IconAnimation.HALF_SIZE}.png`;
    _imageB.src = `img/icon_empty_${IconAnimation.HALF_SIZE}.png`;
    _imageARetina.src = `img/icon_${IconAnimation.FULL_SIZE}.png`;
    _imageBRetina.src = `img/icon_empty_${IconAnimation.FULL_SIZE}.png`;
  }

  /**
   *
   */
  this.getImageData = function() {
    return _context.getImageData(0, 0, _canvas.width, _canvas.height);
  };

  /**
   *
   */
  this.getRetinaImageData = function() {
    return _contextRetina.getImageData(0, 0, _canvasRetina.width, _canvasRetina.height);
  };

  /**
   *
   */
  this.getCanvas = function() {
    return _canvasRetina;
  };


  /**
   *
   */
  this.update = function() {

    if (Math.abs(_imageAlpha - _imageTargetAlpha) < 0.01) {
      _timer.stop();
      _imageAlpha = _imageTargetAlpha;
    }

    this.blendImages(_canvasRetina, _contextRetina, _imageARetina, _imageBRetina, _imageAlpha);
    this.blendImages(_canvas, _context, _imageARetina, _imageBRetina, _imageAlpha);

  	_imageAlpha -= (_imageAlpha - _imageTargetAlpha) * _imageAlphaSpeed;

    self.updated.dispatch();
  };

  /**
   * Blends two images into a canvas' context using an alpha value
   *
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} context
   * @param {HTMLImageElement} imageA
   * @param {HTMLImageElement} imageB
   * @param {number} alpha 0...1
   */
  this.blendImages = function(canvas, context, imageA, imageB, alpha) {
  	context.clearRect(0, 0, canvas.width, canvas.height);
  	context.drawImage(imageA, 0, 0, canvas.width, canvas.height);

  	var originalAlpha = context.globalAlpha;
  	context.globalAlpha = alpha;

  	context.drawImage(imageB, 0, 0, canvas.width, canvas.height);

  	context.globalAlpha = originalAlpha;
  }

  /**
   *
   */
  this.fadeIn = function() {
    _imageTargetAlpha = 1;
    _imageAlphaSpeed = 0.25;
    self.update();
    _timer.start();
  };

  /**
   *
   */
  this.fadeOut = function() {
    _imageTargetAlpha = 0;
    _imageAlphaSpeed = 0.05;
    self.update();
    _timer.start();
  };

  _init();
}



/**
 *
 */
function Timer(interval) {
  var self = this;
  var _id = NaN;
  var _interval = interval || 1000 / 30;
  this.updated = new signals.Signal();

  this.start = function() {
    self.stop();
    _id = setInterval(function() {
      self.updated.dispatch();
    }, _interval);
  };

  this.stop = function() {
    if (!isNaN(_id)) {
      clearInterval(_id);
      _id = NaN;
    }
  };
}

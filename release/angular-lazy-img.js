/*
 * angular-lazy-load
 *
 * Copyright(c) 2014 Paweł Wszoła <wszola.p@gmail.com>
 * MIT Licensed
 *
 */

/**
 * @author Paweł Wszoła (wszola.p@gmail.com)
 *
 */

angular.module('angularLazyImg', []);

angular.module('angularLazyImg').factory('LazyImgMagic', [
  '$window', '$rootScope', 'lazyImgConfig', 'lazyImgHelpers', '$timeout',
  function($window, $rootScope, lazyImgConfig, lazyImgHelpers, $timeout){
    'use strict';

    var winDimensions, $win, images, isListening, options;
    var checkImagesT, saveWinOffsetT, containers, orientation, offset;

    images = [];
    isListening = false;
    options = lazyImgConfig.getOptions();
    $win = angular.element($window);
    winDimensions = lazyImgHelpers.getWinDimensions();
    saveWinOffsetT = lazyImgHelpers.throttle(function(){
      winDimensions = lazyImgHelpers.getWinDimensions();
    }, 60);
    containers = [options.container || $win];
    orientation = options.orientation || 'v';
    offset = options.offset || 0;

    function checkImages(){
      $timeout(function () {
        for(var i = images.length - 1; i >= 0; i--){
          var image = images[i];
          if(image && lazyImgHelpers.isElementInView(image.$elem[0], offset, winDimensions, image.orientation)){
            loadImage(image);
            images.splice(i, 1);
          }
        }
        if(images.length === 0){ stopListening(); }
      },options.loadingDelay);
    }

    checkImagesT = lazyImgHelpers.throttle(checkImages, 30);

    function listen(param){
      containers.forEach(function (container) {
        container[param]('scroll', checkImagesT);
        container[param]('touchmove', checkImagesT);
      });
      $win[param]('resize', checkImagesT);
      $win[param]('resize', saveWinOffsetT);
    }

    function startListening(){
      isListening = true;
      setTimeout(function(){
        checkImages();
        listen('on');
      }, 1);
    }

    function stopListening(){
      isListening = false;
      listen('off');
    }

    function removeImage(image){
      var index = images.indexOf(image);
      if(index !== -1) {
        images.splice(index, 1);
      }
    }

    function loadImage(photo){
      var img = new Image();
      img.onerror = function(){
        if(options.errorClass){
          photo.$elem.addClass(options.errorClass);
        }
        $rootScope.$emit('lazyImg:error', photo);
        options.onError(photo);
      };
      img.onload = function(){
        setPhotoSrc(photo.$elem, photo.src);
        if(options.successClass){
          photo.$elem.addClass(options.successClass);
        }
        $rootScope.$emit('lazyImg:success', photo);
        options.onSuccess(photo);
      };
      img.src = photo.src;
    }

    function setPhotoSrc($elem, src){
      if ($elem[0].nodeName.toLowerCase() === 'img') {
        $elem[0].src = src;
      } else {
        $elem.css('background-image', 'url("' + src + '")');
      }
    }

    // PHOTO
    function Photo($elem, _orientation){
      this.$elem = $elem;
      this.orientation = _orientation;
    }

    Photo.prototype.setSource = function(source){
      this.src = source;
      images.unshift(this);
      if (!isListening){ startListening(); }
    };

    Photo.prototype.removeImage = function(){
      removeImage(this);
      if(images.length === 0){ stopListening(); }
    };

    Photo.prototype.checkImages = function(){
      checkImages();
    };

    Photo.addContainer = function (container) {
      stopListening();
      containers.push(container);
      startListening();
    };

    Photo.removeContainer = function (container) {
      stopListening();
      containers.splice(containers.indexOf(container), 1);
      startListening();
    };

    Photo.setOrientation = function (_orientation) {
      orientation = _orientation;
    };

    return Photo;

  }
]);

angular.module('angularLazyImg').provider('lazyImgConfig', function() {
  'use strict';

  this.options = {
    offset       : 100,
    errorClass   : null,
    successClass : null,
    onError      : function(){},
    onSuccess    : function(){},
    loadingDelay : 1
  };

  this.$get = function() {
    var options = this.options;
    return {
      getOptions: function() {
        return options;
      }
    };
  };

  this.setOptions = function(options) {
    angular.extend(this.options, options);
  };
});
angular.module('angularLazyImg').factory('lazyImgHelpers', [
  '$window', function($window){
    'use strict';

    function getWinDimensions(){
      return {
        height: $window.innerHeight,
        width: $window.innerWidth
      };
    }

    function isElementInView(elem, offset, winDimensions, orientation) {
      var rect = elem.getBoundingClientRect();
      var bottomline = winDimensions.height + offset;
      var rightline = winDimensions.width + offset;
      if(orientation==='h'){
          return (rect.left >= 0 && rect.left <= rightline) || (rect.right <= rightline && rect.right >= 0 - offset);
      }else {
          return (rect.top >= 0 && rect.top <= bottomline) || (rect.bottom <= bottomline && rect.bottom >= 0 - offset);
      }
      // return (
      //  rect.left >= 0 && rect.right <= winDimensions.width + offset && (
      //    rect.top >= 0 && rect.top <= bottomline ||
      //    rect.bottom <= bottomline && rect.bottom >= 0 - offset
      //   )
      // );
    }

    // http://remysharp.com/2010/07/21/throttling-function-calls/
    function throttle(fn, threshhold, scope) {
      var last, deferTimer;
      return function () {
        var context = scope || this;
        var now = +new Date(),
            args = arguments;
        if (last && now < last + threshhold) {
          clearTimeout(deferTimer);
          deferTimer = setTimeout(function () {
            last = now;
            fn.apply(context, args);
          }, threshhold);
        } else {
          last = now;
          fn.apply(context, args);
        }
      };
    }

    return {
      isElementInView: isElementInView,
      getWinDimensions: getWinDimensions,
      throttle: throttle
    };

  }
]);
angular.module('angularLazyImg')
    .directive('lazyImg', [
        '$rootScope', 'LazyImgMagic', function ($rootScope, LazyImgMagic) {
            'use strict';

            var _THRESHOLD_HQ = 120,
                _THRESHOLD_XHQ = 160;

            function link(scope, element, attributes) {

                var lazyImage = new LazyImgMagic(element, attributes.orientation);

                var deregister = attributes.$observe('lazyImg', function (newSource) {
                    if (newSource) {
                        deregister();
                        lazyImage.setSource(newSource);
                    }
                });

                attributes.$observe('lazyImgZoom', function (newZoom) {
                    var zoom = parseFloat(newZoom) || 100;
                    if (attributes.lazyImgXhq && zoom > _THRESHOLD_XHQ) {
                        lazyImage.setSource(attributes.lazyImgXhq);
                    } else if (attributes.lazyImgHq && zoom > _THRESHOLD_HQ) {
                        lazyImage.setSource(attributes.lazyImgHq);
                    } else {
                        lazyImage.setSource(attributes.lazyImg);
                    }
                    lazyImage.checkImages();
                });

                scope.$on('$destroy', function () {
                    lazyImage.removeImage();
                });

                $rootScope.$on('lazyImg.runCheck', function () {
                    lazyImage.checkImages();

                });

                $rootScope.$on('lazyImg:refresh', function () {
                    lazyImage.checkImages();
                });
            }

            return {
                link: link,
                restrict: 'A'
            };
        }
    ])
    .directive('lazyImgContainer', [
        'LazyImgMagic', function (LazyImgMagic) {
            'use strict';

            function link(scope, element, attributes) {

                LazyImgMagic.addContainer(element);

                scope.$on('$destroy', function () {
                    LazyImgMagic.removeContainer(element);
                });
            }

            return {
                link: link,
                restrict: 'A'
            };
        }
    ]);

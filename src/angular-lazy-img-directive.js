angular.module('angularLazyImg')
  .directive('lazyImg', [
    '$rootScope', 'LazyImgMagic', '$timeout', function ($rootScope, LazyImgMagic, $timeout) {
      'use strict';

      var _THRESHOLD_VALUE = 120;

      function link(scope, element, attributes) {
        var lazyImage = new LazyImgMagic(element);
        var deregister = attributes.$observe('lazyImg', function (newSource) {
          if (newSource) {
            deregister();
            lazyImage.setSource(newSource);
          }
        });
        attributes.$observe('lazyImgZoom', function(newZoom) {
            var zoom = parseFloat(newZoom) || 100;
            if(zoom > _THRESHOLD_VALUE){
                if(attributes.lazyImgHq){
                    lazyImage.setSource(attributes.lazyImgHq);
                    lazyImage.checkImages();
                }
            }
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
      function link(scope, element) {
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

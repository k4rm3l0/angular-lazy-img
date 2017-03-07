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
        var deregister2 = attributes.$observe('lazyImgZoom', function(value) {
              var zoom = parseFloat(value);
              if(attributes.lazyImg && attributes.lazyImg.length>0 && zoom){
                  if(zoom > _THRESHOLD_VALUE){
                      deregister2();
                      console.log('lazyImgZoom', attributes.lazyImgHq);
                      if(attributes.lazyImgHq){
                          lazyImage.setSource(attributes.lazyImgHq);
                      }
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
            console.log('CIAONE');
        });
        $rootScope.$on('lazyImg:edit', function (event, data) {
            lazyImage.removeImage();
            lazyImage.setSource(data);
            $timeout(function () {
                lazyImage.checkImages();
            });
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

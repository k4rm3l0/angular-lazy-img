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

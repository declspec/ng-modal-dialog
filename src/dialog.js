import DialogResult from './dialog-result';

function inherit(parent, extra) {
    return angular.extend(Object.create(parent), extra);
}

export function DialogProvider() {
    var dialogs = {};

    this.register = function (name, config) {
        dialogs[name] = angular.copy(config);
        return this;
    };

    this.$get = ['$q', '$sce', '$rootScope', '$http', '$templateCache', '$modalDialogParams', get];

    function get($q, $sce, $rootScope, $http, $templateCache, $modalDialogParams) {
        var prepared = null;

        var $modal = {
            dialogs: dialogs,
            current: null,
            show: show,
            close: close
        };

        return $modal;

        function prepare(name, params, callback) {
            var last = $modal.current,
                current = $modal.dialogs[name];

            // Use inherit to clone the actual dialog config
            var self = prepared = current && inherit(current, {
                params: params,
                callback: callback,
                $$destroyed: false,

                $destroy: function () {
                    if (self.$$destroyed)
                        return;

                    // Flag $$destroyed early to prevent any further calls to $destroy
                    // from duplicating effort (in either 'callback' or '$broadcast')
                    self.$$destroyed = true;
                    if ('function' === typeof (self.callback))
                        self.callback.apply(null, arguments);

                    if (self === $modal.current)
                        $modal.current = null;

                    $rootScope.$broadcast('$dialogDestroyed', self);
                }
            });

            if (prepared)
                prepared.$$dialog = prepared;

            return (last || prepared) &&
                !$rootScope.$broadcast('$dialogChangeStart', prepared, last).defaultPrevented;
        }

        function close() {
            if ($modal.current !== null) {
                $modal.current.$destroy(DialogResult.Cancelled);
            }
        }

        function show(name, params, callback) {
            if (angular.isUndefined(callback) && angular.isFunction(params)) {
                callback = params;
                params = {};
            }

            if (!prepare(name, params, callback))
                return callback(DialogResult.Cancelled);

            var last = $modal.current,
                next = $modal.current = prepared;

            // Run after 'prepare' as we only want to destroy
            // the last modal dialog after $dialogChangeStart
            if (last)
                last.$destroy(DialogResult.Cancelled);

            $q.when(prepared).then(function () {
                var locals = {},
                    template,
                    templateUrl;

                if (angular.isDefined(template = next.template)) {
                    if (angular.isFunction(template))
                        template = template(params);
                }
                else if (angular.isDefined(templateUrl = next.templateUrl)) {
                    if (angular.isFunction(templateUrl))
                        templateUrl = templateUrl(params);

                    templateUrl = $sce.getTrustedResourceUrl(templateUrl);
                    if (angular.isDefined(templateUrl)) {
                        next.loadedTemplateUrl = templateUrl;
                        template = $http.get(templateUrl, { cache: $templateCache }).then(function (response) {
                            return response.data;
                        });
                    }
                }

                if (angular.isDefined(template))
                    locals.$template = template;

                return $q.all(locals);
            }).then(function (locals) {
                if (next !== $modal.current)
                    next.$destroy(DialogResult.Cancelled);
                else {
                    next.locals = locals;
                    
                    // Clear the $modalDialogParams and assign the new ones
                    angular.forEach($modalDialogParams, function(value, key) {
                        if (key !== '$$hashKey')
                            delete $modalDialogParams[key];
                    });

                    angular.extend($modalDialogParams, next.params);
                    $rootScope.$broadcast('$dialogChangeSuccess', next, last);
                }
            }, function (error) {
                $rootScope.$broadcast('$dialogChangeError', next, last, error);
                next.$destroy(DialogResult.Error, error);
            });

            return next.$destroy;
        }
    }
}
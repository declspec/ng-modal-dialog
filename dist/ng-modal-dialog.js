/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.DialogResult = undefined;

	var _dialogResult = __webpack_require__(1);

	var _dialogResult2 = _interopRequireDefault(_dialogResult);

	var _dialogParams = __webpack_require__(2);

	var _dialog = __webpack_require__(3);

	var _directives = __webpack_require__(4);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var lib = angular.module('ng-modal-dialog', []).constant('DialogResult', _dialogResult2.default).provider('$modalDialog', _dialog.DialogProvider).provider('$modalDialogParams', _dialogParams.DialogParamsProvider).directive('modalDialog', _directives.DialogDirective).directive('modalDialog', _directives.DialogDirectiveFill);

	exports.DialogResult = _dialogResult2.default;
	exports.default = lib.name;

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = {
	    Success: 0,
	    Cancelled: 1,
	    Error: 2
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.DialogParamsProvider = DialogParamsProvider;
	function DialogParamsProvider() {
	    this.$get = function () {
	        return {};
	    };
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.DialogProvider = DialogProvider;

	var _dialogResult = __webpack_require__(1);

	var _dialogResult2 = _interopRequireDefault(_dialogResult);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function DialogProvider() {
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
	            show: show
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

	                $destroy: function $destroy() {
	                    if (self.$$destroyed) return;

	                    // Flag $$destroyed early to prevent any further calls to $destroy
	                    // from duplicating effort (in either 'callback' or '$broadcast')
	                    self.$$destroyed = true;
	                    if ('function' === typeof self.callback) self.callback.apply(null, arguments);

	                    if (self === $modal.current) $modal.current = null;

	                    $rootScope.$broadcast('$dialogDestroyed', self);
	                }
	            });

	            if (prepared) prepared.$$dialog = prepared;

	            return (last || prepared) && !$rootScope.$broadcast('$dialogChangeStart', prepared, last).defaultPrevented;
	        }

	        function show(name, params, callback) {
	            if (angular.isUndefined(callback) && angular.isFunction(params)) {
	                callback = params;
	                params = {};
	            }

	            if (!prepare(name, params, callback)) return callback(_dialogResult2.default.Cancelled);

	            var last = $modal.current,
	                next = $modal.current = prepared;

	            // Run after 'prepare' as we only want to destroy
	            // the last modal dialog after $dialogChangeStart
	            if (last) last.$destroy(_dialogResult2.default.Cancelled);

	            $q.when(prepared).then(function () {
	                var locals = {},
	                    template,
	                    templateUrl;

	                if (angular.isDefined(template = next.template)) {
	                    if (angular.isFunction(template)) template = template(params);
	                } else if (angular.isDefined(templateUrl = next.templateUrl)) {
	                    if (angular.isFunction(templateUrl)) templateUrl = templateUrl(params);

	                    templateUrl = $sce.getTrustedResourceUrl(templateUrl);
	                    if (angular.isDefined(templateUrl)) {
	                        next.loadedTemplateUrl = templateUrl;
	                        template = $http.get(templateUrl, { cache: $templateCache }).then(function (response) {
	                            return response.data;
	                        });
	                    }
	                }

	                if (angular.isDefined(template)) locals.$template = template;

	                return $q.all(locals);
	            }).then(function (locals) {
	                if (next !== $modal.current) next.$destroy(_dialogResult2.default.Cancelled);else {
	                    next.locals = locals;

	                    // Clear the $modalDialogParams and assign the new ones
	                    angular.forEach($modalDialogParams, function (value, key) {
	                        if (key !== '$$hashKey') delete $modalDialogParams[key];
	                    });

	                    angular.extend($modalDialogParams, next.params);
	                    $rootScope.$broadcast('$dialogChangeSuccess', next, last);
	                }
	            }, function (error) {
	                $rootScope.$broadcast('$dialogChangeError', next, last, error);
	                next.$destroy(_dialogResult2.default.Error, error);
	            });

	            return next.$destroy;
	        }
	    }
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.DialogDirective = DialogDirective;
	exports.DialogDirectiveFill = DialogDirectiveFill;

	var _dialogResult = __webpack_require__(1);

	var _dialogResult2 = _interopRequireDefault(_dialogResult);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	DialogDirective.$inject = ['$document', '$modalDialog'];
	function DialogDirective($document, $modalDialog) {
	    return {
	        restrict: 'ECA',
	        priority: 400,
	        terminal: true,
	        transclude: 'element',
	        link: function link(scope, $element, attr, ctrl, $transclude) {
	            var body = $document[0].body,
	                overflow = body.style.overflow;

	            var currentScope, currentElement, currentDialog;

	            scope.$on('$dialogChangeSuccess', update);
	            scope.$on('$dialogDestroyed', destroy);

	            update();

	            function cleanup() {
	                if (currentScope) {
	                    currentScope.$destroy();
	                    currentScope = null;
	                }

	                if (currentElement) {
	                    currentElement.remove();
	                    currentElement = null;

	                    // Remove the overflow: hidden
	                    body.style.overflow = overflow;
	                }
	            }

	            function destroy($event, dialog) {
	                // Handle the '$dialogDestroyed' event. Only need to do something
	                // if the destroyed dialog is our currently displayed dialog 
	                // (this indicates that the dialog was probably destroyed programatically and
	                //  not by direct user interaction)
	                if (dialog === currentDialog) currentDialog.scope.close(_dialogResult2.default.Cancelled);
	            }

	            function update() {
	                var current = currentDialog = $modalDialog.current,
	                    locals = current && current.locals,
	                    template = locals && locals.$template;

	                if (!current || angular.isUndefined(template)) cleanup();else {
	                    var newScope = scope.$new();

	                    $transclude(newScope, function (clone) {
	                        $element.after(currentElement = clone);
	                    });

	                    newScope.close = function () {
	                        if (current === currentDialog) {
	                            cleanup();
	                            currentDialog = null;
	                        }
	                        current.$destroy.apply(null, arguments);
	                    };

	                    // Give the 'current' dialog a close method
	                    // so that external code can manually close the dialog if needed
	                    // current.close = newScope.close;
	                    currentScope = current.scope = newScope;
	                    currentScope.$emit('$dialogContentLoaded');

	                    // Disable background scrolling
	                    body.style.overflow = 'hidden';
	                }
	            }
	        }
	    };
	}

	DialogDirectiveFill.$inject = ['$modalDialog', '$controller', '$compile'];
	function DialogDirectiveFill($modalDialog, $controller, $compile, DialogResult) {
	    return {
	        restrict: 'ECA',
	        priority: -400,
	        link: function link(scope, $element) {
	            var current = $modalDialog.current;

	            if (typeof current !== 'undefined' && current != null) {
	                var locals = current.locals,
	                    elem = $element[0],
	                    cancellable = !!current.cancellable;

	                scope.cancel = function () {
	                    return scope.close(DialogResult.Cancelled);
	                };

	                // Register click bindings if the dialog is cancellable
	                if (cancellable) {
	                    var detach = attach(elem, 'click', function (e) {
	                        e.target === elem && scope.$apply(scope.cancel);
	                    });

	                    // Remove the click handler once the scope is destroyed
	                    scope.$on('$destroy', detach);
	                }

	                $element.html('<div class="modal-dialog-wrapper">' + (cancellable ? '<span class="modal-dialog-cancel" ng-click="cancel()"></span>' : '') + locals.$template + '</div>');

	                var link = $compile($element.contents());

	                if (current.controller) {
	                    locals.$scope = scope;

	                    var controller = $controller(current.controller, locals);
	                    if (current.controllerAs) scope[current.controllerAs] = controller;

	                    // These are set to enable the jqLite 'controller' method to function correctly.
	                    $element.data('$ngControllerController', controller);
	                    $element.children().data('$ngControllerController', controller);
	                }

	                link(scope);
	            }
	        }
	    };
	}

/***/ }
/******/ ]);
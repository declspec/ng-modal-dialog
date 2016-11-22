import DialogResult from './dialog-result';

function attach(element, event, handler) {
    element.addEventListener(event, handler);

    return function() {
        element.removeEventListener(event, handler);
    };
}

DialogDirective.$inject = ['$document', '$modalDialog'];
export function DialogDirective($document, $modalDialog) {
    return {
        restrict: 'ECA',
        priority: 400,
        terminal: true,
        transclude: 'element',
        link: function (scope, $element, attr, ctrl, $transclude) {
            var body = $document[0].body,
                overflow = body.style.overflow;

            var currentScope,
                currentElement,
                currentDialog;

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
                if (dialog === currentDialog)
                    currentDialog.scope.close(DialogResult.Cancelled);
            }

            function update() {
                var current = currentDialog = $modalDialog.current,
                    locals = current && current.locals,
                    template = locals && locals.$template;

                if (!current || angular.isUndefined(template))
                    cleanup();
                else {
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

DialogDirectiveFill.$inject = [ '$modalDialog', '$controller', '$compile' ];
export function DialogDirectiveFill($modalDialog, $controller, $compile) {
    return {
        restrict: 'ECA',
        priority: -400,
        link: function (scope, $element) {
            var current = $modalDialog.current;

            if (typeof (current) !== 'undefined' && current != null) {
                var locals = current.locals,
                    elem = $element[0],
                    cancellable = !!current.cancellable;

                scope.cancel = () => scope.close(DialogResult.Cancelled);
                
                // Register click bindings if the dialog is cancellable
                if (cancellable) {
                    var detach = attach(elem, 'click', function(e) {
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
                    if (current.controllerAs)
                        scope[current.controllerAs] = controller;

                    // These are set to enable the jqLite 'controller' method to function correctly.
                    $element.data('$ngControllerController', controller);
                    $element.children().data('$ngControllerController', controller);
                }

                link(scope);
            }
        }
    };
}

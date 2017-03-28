import DialogResult from './src/dialog-result';
import { DialogParamsProvider } from './src/dialog-params';
import { DialogProvider } from './src/dialog';
import { DialogDirective, DialogDirectiveFill } from './src/directives';

var lib = angular.module('ng-modal-dialog', [])
    .constant('DialogResult', DialogResult)

    .provider('$modalDialog', DialogProvider)
    .provider('$modalDialogParams', DialogParamsProvider)

    .directive('modalDialog', DialogDirective)
    .directive('modalDialog', DialogDirectiveFill);

export { DialogResult };
export default lib.name;
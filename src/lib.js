import DialogResult from './dialog-result';

import { DialogParamsProvider } from './dialog-params';
import { DialogProvider } from './dialog';
import { DialogDirective, DialogDirectiveFill } from './directives';

const lib = angular.module('ng-modal-dialog', [])
    .constant('DialogResult', DialogResult)

    .provider('$modalDialog', DialogProvider)
    .provider('$modalDialogParams', DialogParamsProvider)

    .directive('modalDialog', DialogDirective)
    .directive('modalDialog', DialogDirectiveFill);

export { DialogResult };
export default lib.name;
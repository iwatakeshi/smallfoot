/* eslint-env node, jquery, browser */
import SmallFoot from './src/smallfoot';

(function ($) {
  $.smallfoot = (options) => new SmallFoot(options);
})($ || jQuery);

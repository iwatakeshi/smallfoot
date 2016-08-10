'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-env node, jquery, browser */
(function ($) {
  var SmallFoot = function () {
    /**
     * @constructor
     * @param {Object} param The options for smallfoot.
     */
    function SmallFoot(options) {
      var _this = this;

      _classCallCheck(this, SmallFoot);

      this._options = $.extend({}, this.defaults(), options);
      // The regex patterns
      this.regex = function () {
        return {
          superscript: function superscript() {
            return (/\^([0-9])\^/g
            );
          },
          superfoot: function superfoot() {
            return (/\^([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g
            );
          },
          subscript: function subscript() {
            return (/~(([0-9]))~/g
            );
          },
          subfoot: function subfoot() {
            return (/~([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g
            );
          }
        };
      };
      // Store the paragraphs containing the scripts
      this.$scripts = $('p').toArray().filter(function (p) {
        var text = $(p).text();

        var _regex = _this.regex();

        var superscript = _regex.superscript;
        var subscript = _regex.subscript;

        return superscript().test(text) || subscript().test(text);
      });
      // Store the paragraphs containing the footnotes
      this.$footnotes = $('p').toArray().filter(function (p) {
        var text = $(p).text();

        var _regex2 = _this.regex();

        var superfoot = _regex2.superfoot;
        var subfoot = _regex2.subfoot;

        return superfoot().test(text) || subfoot().test(text);
      });
      // Store all the paragraphs that are unique
      this.$paragraphs = $.uniqueSort(this.$scripts.concat(this.$footnotes));
      // Start the conversion
      return this.process();
    }
    /**
     * @private
     * @method process
     * @description Converts all smallfoot syntaxes to HTML.
     */


    _createClass(SmallFoot, [{
      key: 'process',
      value: function process() {
        var _this2 = this;

        // Convert all markups in each paragraph to html
        this.$paragraphs.forEach(function (p) {
          var text = $(p).text();

          var _regex3 = _this2.regex();

          var superscript = _regex3.superscript;
          var subscript = _regex3.subscript;
          var superfoot = _regex3.superfoot;
          var subfoot = _regex3.subfoot;

          var nullcheck = function nullcheck(array) {
            return array === null ? [] : array;
          };
          // Convert superscripts
          nullcheck(text.match(superscript())).forEach(function (m) {
            var number = superscript().exec(m)[1];
            text = text.replace(m, _this2.getMarkUp(true, true, number));
          });
          // Convert subscripts
          nullcheck(text.match(subscript())).forEach(function (m) {
            var number = subscript().exec(m)[1];
            text = text.replace(m, _this2.getMarkUp(true, false, number));
          });

          var _options2 = _this2.options();

          var footnotes = _options2.footnotes;

          var footnoteStyle = !footnotes.show ? 'display: none;' : '';
          // Convert superscript footnotes
          var superfootnotes = nullcheck(text.match(superfoot())).map(function (m) {
            var reference = superfoot().exec(m),
                number = reference[1],
                note = reference[2],
                html = _this2.getMarkUp(false, true, number, note);
            // Remove the references
            text = text.replace(m, '');
            return html;
          }).join('');
          text = $.isEmptyObject(superfootnotes) ? text : text + ' <ol class="smallfoot footnotes supfoots" style="' + footnoteStyle + '">\n             ' + superfootnotes + '\n          </ol>';
          // Convert subscript footnotes
          var subfootnotes = nullcheck(text.match(subfoot())).map(function (m) {
            var reference = subfoot().exec(m),
                number = reference[1],
                note = reference[2],
                html = _this2.getMarkUp(false, false, number, note);
            // Remove the references
            text = text.replace(m, '');
            return html;
          }).join('');
          text = $.isEmptyObject(subfootnotes) ? text : text + ' <ul class="smallfoot footnotes subfoots" style="' + footnoteStyle + '">\n          ' + subfootnotes + '\n        </ul>';

          if (text !== '') $(p).replaceWith('<p>' + text + '</p>');
        });
        return this;
      }
      /**
       * @private
       * @method  getMarkUp
       * @param {Boolean} isRef   Determines whether markup is a reference.
       * @param {Boolean} isSuper Determines whether markup is a superscript.
       * @param {Number}  number  The reference number.
       * @param {String}  note    The footnote.
       * @returns {String} markup The final markup.
       */

    }, {
      key: 'getMarkUp',
      value: function getMarkUp(isRef, isSuper, number, note) {
        var _options3 = this.options();

        var references = _options3.references;

        var type = isSuper ? 'sup' : 'sub';
        var useDiv = references.useDiv;

        var element = useDiv ? 'div' : type;
        return isRef ? '\n          <' + element + ' class="smallfoot ' + type + 'script reference" id="' + type + '-fn-' + number + '">\n            <a href="#sup-fn-ref-' + number + '" rel="footnote">' + number + '</a>\n          </' + element + '>' : '<li>\n            <div class="smallfoot ' + type + 'script footnote">\n              <p id="' + type + '-fn-ref-' + number + '">\n                ' + note + '<a href="#' + type + '-fn-' + number + '" title="return to article"> ↩</a>\n              <p>\n            </div>\n          </li>';
      }
      /**
       * @method defaults
       * @returns {Object} options The default options.
       */

    }, {
      key: 'defaults',
      value: function defaults() {
        return {
          references: {
            useDiv: false
          },
          footnotes: {
            show: true
          }
        };
      }
      /**
       * @method options
       * @param {Object} options? The options to set.
       * @returns {Object} options The options to get.
       */

    }, {
      key: 'options',
      value: function options(_options) {
        this._options = _options ? $.extend({}, this._options, _options) : this._options;
        return this._options;
      }
      /**
       * @method ready
       * @param {Function} callback The callback function to be called when ready.
       */

    }, {
      key: 'ready',
      value: function ready() {
        var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

        callback({
          references: $('.smallfoot.reference').toArray(),
          footnotes: $('.smallfoot.footnote').toArray()
        });
        return this;
      }
      /**
       * @method on
       * @param {String} event  The name of the event to register the callback function.
       * @param {Function} callback The callback function to be called when event is emitted.
       */

    }, {
      key: 'on',
      value: function on(event) {
        var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

        $('.smallfoot').filter('.reference').toArray().forEach(function (el) {
          return $(el).bind(event, function (e) {
            var target = $(e.target);
            var getType = function getType(element) {
              return $(element).hasClass('superscript') ? 'superscript' : 'subscript';
            };
            switch ($(e.target).get(0).tagName.toLowerCase()) {
              case 'p':
                target = $(target).filter('sup');
                return callback({ event: e, type: getType(target), target: target });
              case 'sup':
                return callback({ event: e, type: getType(target), target: target });
              case 'sub':
                return callback({ event: e, type: getType(target), target: target });
              case 'a':
                target = $(target).parent();
                return callback({ event: e, type: getType(target), target: target });
            }
          });
        });
        return this;
      }
      /**
       * @method onClick
       * @param {Function} callback The callback function to be called when event is emitted.
       */

    }, {
      key: 'onClick',
      value: function onClick() {
        var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

        return this.on('click', callback);
      }
      /**
       * @method onMouseEnter
       * @param {Function} callback The callback function to be called when event is emitted.
       */

    }, {
      key: 'onMouseEnter',
      value: function onMouseEnter() {
        var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

        return this.on('mouseenter', callback);
      }
      /**
       * @method onMouseLeave
       * @param {Function} callback The callback function to be called when event is emitted.
       */

    }, {
      key: 'onMouseLeave',
      value: function onMouseLeave() {
        var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

        return this.on('mouseleave', callback);
      }
    }]);

    return SmallFoot;
  }();

  $.smallfoot = function (options) {
    return new SmallFoot(options);
  };
})($ || jQuery);
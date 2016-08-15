(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _smallfoot = require('./src/smallfoot');

var _smallfoot2 = _interopRequireDefault(_smallfoot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function ($) {
  $.smallfoot = function (options) {
    return new _smallfoot2.default(options);
  };
})($ || jQuery); /* eslint-env node, jquery, browser */

},{"./src/smallfoot":3}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
/* eslint-env node, jquery, browser */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @class SmallFoot
 */
var SmallFoot = function (_EventEmitter) {
  _inherits(SmallFoot, _EventEmitter);

  /**
   * @constructor
   * @param {Object} options The options for smallfoot.
   */
  function SmallFoot(options) {
    var _ret;

    _classCallCheck(this, SmallFoot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SmallFoot).call(this));

    _this._options = $.extend({}, _this.defaults(), options);
    // The regex patterns
    _this.regex = function () {
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

    _this.on('process', function () {
      [{ name: 'click', method: function method(param) {
          return _this.emit('click', param);
        } }, { name: 'mouseenter', method: function method(param) {
          return _this.emit('mouseenter', param);
        } }, { name: 'mouseleave', method: function method(param) {
          return _this.emit('mouseleave', param);
        } }].forEach(function (event) {
        return _this.$on(event.name, event.method);
      });
    });
    _this.on('ready', function () {});

    return _ret = _this.init(), _possibleConstructorReturn(_this, _ret);
  }
  /**
   * @private
   * @method init
   * @description Initalizes SmallFoot
   */


  _createClass(SmallFoot, [{
    key: 'init',
    value: function init() {
      this.emit('beforepreprocess');
      // Start the conversion
      if (this.options().core.preprocess) this.preprocess();
      this.emit('beforeprocess');
      if (this.options().core.process) this.process();
      this.emit('ready', {
        references: $('.smallfoot.reference').toArray(),
        footnotes: $('.smallfoot.footnote').toArray()
      });
      return this;
    }
    /**
     * @private
     * @method preprocess
     * @description Stores all paragraphs that contain the smallfoot syntax
     */

  }, {
    key: 'preprocess',
    value: function preprocess() {
      var _this2 = this;

      // Store the paragraphs containing the scripts
      this.$scripts = $('p').toArray().filter(function (p) {
        var text = $(p).text();

        var _regex = _this2.regex();

        var superscript = _regex.superscript;
        var subscript = _regex.subscript;

        return superscript().test(text) || subscript().test(text);
      });
      // Store the paragraphs containing the footnotes
      this.$footnotes = $('p').toArray().filter(function (p) {
        var text = $(p).text();

        var _regex2 = _this2.regex();

        var superfoot = _regex2.superfoot;
        var subfoot = _regex2.subfoot;

        return superfoot().test(text) || subfoot().test(text);
      });
      // Store all the paragraphs that are unique
      this.$paragraphs = $.uniqueSort(this.$scripts.concat(this.$footnotes));
      this.emit('afterpreprocess', [{
        scripts: this.scripts,
        footnotes: this.footnotes,
        paragraphs: this.paragraphs
      }]);
    }
    /**
     * @private
     * @method process
     * @description Converts all smallfoot syntaxes to HTML.
     */

  }, {
    key: 'process',
    value: function process() {
      var _this3 = this;

      // Convert all markups in each paragraph to html
      this.$paragraphs.forEach(function (p) {
        var text = $(p).text();

        var _regex3 = _this3.regex();

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
          text = text.replace(m, _this3.getMarkUp(true, true, number));
        });
        // Convert subscripts
        nullcheck(text.match(subscript())).forEach(function (m) {
          var number = subscript().exec(m)[1];
          text = text.replace(m, _this3.getMarkUp(true, false, number));
        });

        var _options2 = _this3.options();

        var footnotes = _options2.footnotes;

        var footnoteStyle = !footnotes.show ? 'display: none;' : '';
        // Convert superscript footnotes
        var superfootnotes = nullcheck(text.match(superfoot())).map(function (m) {
          var reference = superfoot().exec(m),
              number = reference[1],
              note = reference[2],
              html = _this3.getMarkUp(false, true, number, note);
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
              html = _this3.getMarkUp(false, false, number, note);
          // Remove the references
          text = text.replace(m, '');
          return html;
        }).join('');
        text = $.isEmptyObject(subfootnotes) ? text : text + ' <ul class="smallfoot footnotes subfoots" style="' + footnoteStyle + '">\n          ' + subfootnotes + '\n        </ul>';
        $(p).replaceWith('<p>' + text + '</p>');
        _this3.emit('process', text, p);
      });
      // Clean up empty paragraphs
      this.$paragraphs.forEach(function (p) {
        if ($(p).text() === '') $(p).remove();
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
        core: {
          preprocess: true,
          process: true
        },
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
     * @param {Function} callback The callback function to be called when all processing has been completed.
     */

  }, {
    key: 'ready',
    value: function ready() {
      var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

      this.on('ready', callback);
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
    /**
     * @private
     * @method $on
     * @param {String} event  The name of the jQuery event to register the callback function.
     * @param {Function} callback The callback function to be called when event is emitted.
     */

  }, {
    key: '$on',
    value: function $on(event) {
      var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

      var getType = function getType(element) {
        return $(element).hasClass('superscript') ? 'superscript' : 'subscript';
      };
      var getClass = function getClass(element) {
        return $(element).hasClass('footnote') ? 'footnote' : 'reference';
      };
      var getParam = function getParam(e, target) {
        return { event: e, type: getType(target), class: getClass(target), target: target };
      };
      $('.smallfoot.reference').toArray().concat($('.small.footnote').toArray()).forEach(function (el) {
        return $(el).bind(event, function (e) {
          var target = $(e.target);
          switch ($(e.target).get(0).tagName.toLowerCase()) {
            case 'p':
              target = $(target).filter('sup');
              return callback(getParam(e, target));
            case 'sup':
              return callback(getParam(e, target));
            case 'sub':
              return callback(getParam(e, target));
            case 'a':
              target = $(target).parent();
              return callback(getParam(e, target));
          }
        });
      });
      return this;
    }
  }]);

  return SmallFoot;
}(_events.EventEmitter);

exports.default = SmallFoot;

},{"events":2}]},{},[1]);

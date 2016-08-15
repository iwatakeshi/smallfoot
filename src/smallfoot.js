/* eslint-env node, jquery, browser */
'use strict';

import { EventEmitter } from 'events';

/**
 * @class SmallFoot
 */
export default class SmallFoot extends EventEmitter {
  /**
   * @constructor
   * @param {Object} options The options for smallfoot.
   */
  constructor(options) {
    super();
    this._options = $.extend({}, this.defaults(), options);
      // The regex patterns
    this.regex = () => ({
      superscript: () => (/\^([0-9])\^/g),
      superfoot: () => (/\^([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g),
      subscript: () => (/~(([0-9]))~/g),
      subfoot: () => (/~([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g),
    });

    this.on('process', () => {
      [
        { name: 'click', method: (param) => this.emit('click', param) },
        { name: 'mouseenter', method: (param) => this.emit('mouseenter', param) },
        { name: 'mouseleave', method: (param) => this.emit('mouseleave', param) },
      ].forEach(event => this.$on(event.name, event.method));
    });
    this.on('ready', () => {});
  }
  /**
   * @method init
   * @description Initalizes SmallFoot
   */
  init() {
    this.emit('beforepreprocess');
      // Start the conversion
    if (this.options().core.preprocess) this.preprocess();
    this.emit('beforeprocess');
    if (this.options().core.process) this.process();
    this.emit('ready', {
      references: $('.smallfoot.reference').toArray(),
      footnotes: $('.smallfoot.footnote').toArray(),
    });
    return this;
  }
  /**
   * @private
   * @method preprocess
   * @description Stores all paragraphs that contain the smallfoot syntax
   */
  preprocess() {
      // Store the paragraphs containing the scripts
    this.$scripts = $('p').toArray()
        .filter(p => {
          const
            text = $(p).text(),
            { superscript, subscript } = this.regex();
          return superscript().test(text) || subscript().test(text);
        });
      // Store the paragraphs containing the footnotes
    this.$footnotes = $('p').toArray()
        .filter(p => {
          const
            text = $(p).text(),
            { superfoot, subfoot } = this.regex();
          return superfoot().test(text) || subfoot().test(text);
        });
      // Store all the paragraphs that are unique
    this.$paragraphs = $.uniqueSort(this.$scripts.concat(this.$footnotes));
    this.emit('afterpreprocess', [{
      scripts: this.scripts,
      footnotes: this.footnotes,
      paragraphs: this.paragraphs,
    }]);
  }
  /**
   * @private
   * @method process
   * @description Converts all smallfoot syntaxes to HTML.
   */
  process() {
      // Convert all markups in each paragraph to html
    this.$paragraphs.forEach(p => {
      let text = $(p).text();
      const { superscript, subscript, superfoot, subfoot } = this.regex();
      const nullcheck = array => array === null ? [] : array;
        // Convert superscripts
      nullcheck(text.match(superscript())).forEach(m => {
        const number = superscript().exec(m)[1];
        text = text.replace(m, this.getMarkUp(true, true, number));
      });
        // Convert subscripts
      nullcheck(text.match(subscript())).forEach(m => {
        const number = subscript().exec(m)[1];
        text = text.replace(m, this.getMarkUp(true, false, number));
      });
      const { footnotes } = this.options();
      const footnoteStyle = !footnotes.show ? 'display: none;' : '';
        // Convert superscript footnotes
      const superfootnotes = nullcheck(text.match(superfoot())).map(m => {
        const
          reference = superfoot().exec(m),
          number = reference[1],
          note = reference[2],
          html = this.getMarkUp(false, true, number, note);
          // Remove the references
        text = text.replace(m, '');
        return html;
      }).join('');
      text = $.isEmptyObject(superfootnotes) ?
        text :
          `${text} <ol class="smallfoot footnotes supfoots" style="${footnoteStyle}">
             ${superfootnotes}
          </ol>`;
        // Convert subscript footnotes
      const subfootnotes = nullcheck(text.match(subfoot())).map(m => {
        const
          reference = subfoot().exec(m),
          number = reference[1],
          note = reference[2],
          html = this.getMarkUp(false, false, number, note);
          // Remove the references
        text = text.replace(m, '');
        return html;
      }).join('');
      text = $.isEmptyObject(subfootnotes) ?
        text :
        `${text} <ul class="smallfoot footnotes subfoots" style="${footnoteStyle}">
          ${subfootnotes}
        </ul>`;
      $(p).replaceWith(`<p>${text}</p>`);
      this.emit('process', text, p);
    });
      // Clean up empty paragraphs
    this.$paragraphs.forEach(p => { if ($(p).text() === '') $(p).remove(); });
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
  getMarkUp(isRef, isSuper, number, note) {
    const { references } = this.options();
    const type = isSuper ? 'sup' : 'sub';
    const { useDiv } = references;
    const element = useDiv ? 'div' : type;
    return isRef ?
        `
          <${element} class="smallfoot ${type}script reference" id="${type}-fn-${number}">
            <a href="#sup-fn-ref-${number}" rel="footnote">${number}</a>
          </${element}>` :
          `<li>
            <div class="smallfoot ${type}script footnote">
              <p id="${type}-fn-ref-${number}">
                ${note}<a href="#${type}-fn-${number}" title="return to article"> ↩</a>
              <p>
            </div>
          </li>`;
  }
  /**
   * @method defaults
   * @returns {Object} options The default options.
   */
  defaults() {
    return {
      core: {
        preprocess: true,
        process: true,
      },
      references: {
        useDiv: false,
      },
      footnotes: {
        show: true,
      },
    };
  }
  /**
   * @method options
   * @param {Object} options? The options to set.
   * @returns {Object} options The options to get.
   */
  options(options) {
    this._options = options ? $.extend({}, this._options, options) : this._options;
    return this._options;
  }
  /**
   * @method ready
   * @param {Function} callback The callback function to be called when all processing has been completed.
   */
  ready(callback = (() => {})) {
    this.on('ready', callback);
    return this;
  }
  /**
   * @method onClick
   * @param {Function} callback The callback function to be called when event is emitted.
   */
  onClick(callback = (() => {})) {
    return this.on('click', callback);
  }
  /**
   * @method onMouseEnter
   * @param {Function} callback The callback function to be called when event is emitted.
   */
  onMouseEnter(callback = (() => {})) {
    return this.on('mouseenter', callback);
  }
  /**
   * @method onMouseLeave
   * @param {Function} callback The callback function to be called when event is emitted.
   */
  onMouseLeave(callback = (() => {})) {
    return this.on('mouseleave', callback);
  }
  /**
   * @private
   * @method $on
   * @param {String} event  The name of the jQuery event to register the callback function.
   * @param {Function} callback The callback function to be called when event is emitted.
   */
  $on(event, callback = (() => {})) {
    const getType = element => $(element)
      .hasClass('superscript') ? 'superscript' : 'subscript';
    const getClass = element => $(element)
      .hasClass('footnote') ? 'footnote' : 'reference';
    const getParam = (e, target) =>
      ({ event: e, type: getType(target), class: getClass(target), target });
    $('.smallfoot.reference').toArray().concat($('.small.footnote').toArray())
      .forEach(el => $(el).bind(event, e => {
        let target = $(e.target);
        switch ($(e.target).get(0).tagName.toLowerCase()) {
          case 'p': target = $(target).filter('sup');
            return callback(getParam(e, target));
          case 'sup': return callback(getParam(e, target));
          case 'sub': return callback(getParam(e, target));
          case 'a': target = $(target).parent();
            return callback(getParam(e, target));
        }
      }));
    return this;
  }
}

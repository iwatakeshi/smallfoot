/* eslint-env node, jquery, browser */
(function ($) {
  class SmallFoot {
    /**
     * @constructor
     * @param {Object} param The options for smallfoot.
     */
    constructor(options) {
      this._options = $.extend({}, this.defaults(), options);
      // The regex patterns
      this.regex = () => ({
        superscript: () => (/\^([0-9])\^/g),
        superfoot: () => (/\^([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g),
        subscript: () => (/~(([0-9]))~/g),
        subfoot: () => (/~([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g),
      });
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
      // Start the conversion
      return this.process();
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

        if (text !== '') $(p).replaceWith(`<p>${text}</p>`);
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
     * @param {Function} callback The callback function to be called when ready.
     */
    ready(callback = (() => {})) {
      callback({
        references: $('.smallfoot.reference').toArray(),
        footnotes: $('.smallfoot.footnote').toArray(),
      });
      return this;
    }
    /**
     * @method on
     * @param {String} event  The name of the event to register the callback function.
     * @param {Function} callback The callback function to be called when event is emitted.
     */
    on(event, callback = (() => {})) {
      $('.smallfoot').filter('.reference').toArray()
      .forEach(el => $(el).bind(event, e => {
        let target = $(e.target);
        const getType = element => $(element)
          .hasClass('superscript') ? 'superscript' : 'subscript';
        switch ($(e.target).get(0).tagName.toLowerCase()) {
          case 'p': target = $(target).filter('sup');
            return callback({ event: e, type: getType(target), target });
          case 'sup': return callback({ event: e, type: getType(target), target });
          case 'sub': return callback({ event: e, type: getType(target), target });
          case 'a': target = $(target).parent();
            return callback({ event: e, type: getType(target), target });
        }
      }));
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
  }
  $.smallfoot = (options) => new SmallFoot(options);
})($ || jQuery);

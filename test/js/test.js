/* eslint-env node, jquery, browser */
(function ($) {
  class SmallFoot {
    constructor(options) {
      this._options = $.extend({}, options);
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
      return this._process();
    }
    _process() {
      // Convert all markups in each paragraph to html
      this.$paragraphs.forEach(p => {
        let text = $(p).text();
        const { superscript, subscript, superfoot, subfoot } = this.regex();
        const nullcheck = array => array === null ? [] : array;

        nullcheck(text.match(superscript())).forEach(m => {
          const number = superscript().exec(m)[1];
          text = text.replace(m,
            `<sup class="smallfoot superscript reference" id="sup-fn-${number}">
              <a href="#sup-fn-ref-${number}" rel="footnote">${number}</a>
            </sup>`
          );
        });

        nullcheck(text.match(subscript())).forEach(m => {
          const number = subscript().exec(m)[1];
          text = text.replace(m,
          `<sub class="smallfoot subscript reference" id="sub-fn-${number}">
            <a href="#sub-fn-ref-${number}" rel="footnote">${number}</a>
          </sub>`
        );
        });
        const superfootnotes = nullcheck(text.match(superfoot())).map(m => {
          const
            reference = superfoot().exec(m),
            number = reference[1],
            note = reference[2],
            html =
          `<li>
            <div class="smallfoot superscript footnote">
              <p id="sup-fn-ref-${number}">
                ${note}<a href="#sup-fn-${number}" title="return to article"> ↩</a>
              <p>
            </div>
          </li>`;
          // Remove the references
          text = text.replace(m, '');
          return html;
        }).join('');
        text = $.isEmptyObject(superfootnotes) ?
        text : `${text} <ol class="smallfoot footnotes supfoots">${superfootnotes}</ol>`;

        const subfootnotes = nullcheck(text.match(subfoot())).map(m => {
          const
            reference = subfoot().exec(m),
            number = reference[1],
            note = reference[2],
            html =
          `<li>
            <div class="smallfoot subfoot footnote">
              <p id="sub-fn-ref-${number}">
              ${note}<a href="#sub-fn-${number}" title="return to article"> ↩</a>
              <p>
            </div>
          </li>`;
          // Remove the references
          text = text.replace(m, '');
          return html;
        }).join('');
        text = $.isEmptyObject(subfootnotes) ?
        text : `${text} <ul class= "smallfoot footnotes subfoots">${subfootnotes}</ul>`;

        if (text !== '') $(p).replaceWith(`<p>${text}</p>`);
      });
      return this;
    }

    ready(callback = (() => {})) {
      callback({
        references: $('.smallfoot.reference').toArray(),
        footnotes: $('.smallfoot.footnote').toArray(),
      });
      return this;
    }
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
    onClick(callback = (() => {})) {
      return this.on('click', callback);
    }
    onMouseEnter(callback = (() => {})) {
      return this.on('mouseenter', callback);
    }
    onMouseLeave(callback = (() => {})) {
      return this.on('mouseleave', callback);
    }
}
  $.smallfoot = (options) => new SmallFoot($, options);
})($ || jQuery);

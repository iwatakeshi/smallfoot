'use strict'

/*
  Example:

  Something just happened^1^.

  ^1: { I didn't mean to say it just happened. But I just did }
  ^2: { Whatever }
*/
function regex () {

  return {
    superscript: () => (/\^([0-9])\^/g),
    superfoot: () => (/\^([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g),
    subscript: () => (/~(([0-9]))~/g),
    subfoot: () => (/~([0-9])\s?:\s?\{\s?([^}]+)\s?\}/g)
  };
}

class SmallFoot {
  constructor($, options) {
    this._options = $.extend({}, options);

    this.$scripts = $('p')
      .toArray()
      .filter(p => {
        const
          text = $(p).text(),
          { superscript, subscript } = regex();
        return superscript().test(text) || subscript().test(text);
      });

    this.$footnotes = $('p')
      .toArray()
      .filter(p => {
        const
          text = $(p).text(),
          { superfoot, subfoot } = regex();
          return superfoot().test(text) || subfoot().test(text);
      });

      this.$paragraphs = $.uniqueSort(this.$scripts.concat(this.$footnotes));

      this.toHTML($);
  }

  toHTML($) {
    this.$paragraphs.forEach(p => {
      let text = $(p).text();
      const { superscript, subscript, superfoot, subfoot } = regex();
      const nullcheck = array => array === null ? [] : array;

      nullcheck(text.match(superscript())).forEach(m => {
        const number = superscript().exec(m)[1];
        text = text.replace(m,
          `<sup class="smallfoot superscript reference" id="sup.fn:${number}">
            <a href="#sup.fn.ref:${number}" rel="footnote">${number}</a>
          </sup>`
        )
      });

      nullcheck(text.match(subscript())).forEach(m => {
        const number = subscript().exec(m)[1];
        text = text.replace(m,
          `<sub class="smallfoot subscript reference" id="sub.fn:${number}">
            <a href="#sub.fn.ref:${number}" rel="footnote">${number}</a>
          </sub>`
        );
      });
      let superfootnotes = nullcheck(text.match(superfoot())).map(m => {
        const
          reference = superfoot().exec(m),
          number = reference[1],
          note = reference[2],
          html =
          `<li>
            <div class="smallfoot superscript footnote" id="sup.fn.ref:${number}">
              <p>${note}<a href="#sup.fn:${number}" title="return to article"> ↩</a><p>
            </div>
          </li>`;
          // Remove the references
          text = text.replace(m, '');
          return html;
      }).join('');
      text = $.isEmptyObject(superfootnotes) ? text : text + `<ol> ${superfootnotes} </ol>`;

      let subfootnotes = nullcheck(text.match(subfoot())).map(m => {
        const
          reference = subfoot().exec(m),
          number = reference[1],
          note = reference[2],
          html =
          `<li>
            <div class="smallfoot subfoot footnote" id="sub.fn.ref:${number}">
              <p><sub>${number}</sub> ${note}<a href="#sub.fn:${number}" title="return to article"> ↩</a><p>
            </div>
          </li>`;
          // Remove the references
          text = text.replace(m, '');
          return html;
      }).join('');
      text = $.isEmptyObject(subfootnotes) ? text : text + `<ul style="list-style-type: none"> ${subfootnotes} </ul>`;
      $(p).replaceWith(`<p>${text}</p>`)
    });
  }
}

(function ($) {
  $.smallfoot = (options) => new SmallFoot($, options);
})($ || jQuery)

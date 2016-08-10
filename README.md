# smallfoot
A simpler version of [bigfoot.js](https://github.com/lemonmade/bigfoot) in ES6

smallfoot is a small footnote library that takes a different approach to writing footnotes
compared to bigfoot. smallfoot is all about the KISS principle and therefore leaves styling
up to the user. However, smallfoot does provide a powerful syntax converter along with css
classes that help the user find the right script or footnote.

## Usage

```html

<!-- Write your superscripts and subscripts -->
<p>
  This is a superscript^1^
  This is a subscript~1~
</p>
<!-- 
  Write your footnotes; Note that it doesn't matter where the
  footnotes are placed and could have been together with the scripts.
 -->
<p>
  ^1: { This is a footnote for the superscript. }
  ~1: { This is a footnote for the subscript. }
</p>

<!-- Add JQuery -->
<script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>
<!-- Add smallfoot -->
<script src="{path to smallfoot}">
  // Initialize
  $.smallfoot();
</script>
```

## Advanced Usage

### Using [Tooltipster](http://iamceege.github.io/tooltipster/) for footnotes.

```js
$(document).ready(function ({ references }){
  $.smallfoot({
    footnotes: {
      show: false
    }
  })
  .ready(function ({ references }) {
    references.forEach(el => $(el).addClass('tooltip'));
    $('.tooltip').tooltipster({ trigger: 'click' });
  })
  .onClick(function ({ target, event }) {
    event.preventDefault();
  })
  .onMouseEnter(function ({ target }) {
    const footnote = $(target).find('a').attr('href');
    $(target).tooltipster('content', $(footnote).text());
  });
})
```

## Methods

### `ready(callback: Function)`

This method calls the callback function and passes an *object* with an array of `references`
and `footnotes`.

Note/TODO: This method is not event based and happens when you call it after initialization.

Exmaple:

```js
$.smallfoot().ready(function ({ references, footnotes }) { /* */ })
```

### `on(event: String, callback: Function)`

This method registers the callback to the specified event for any superscript and subscript references.

Note: Helper methods such as `onClick(), onMouseEnter(), onMouseLeave()` are available.
Also, every registered callback will receive an *object* with `event`, `type: String`, and a custom `target`
which will always refer wrapper of `<a>`.

## Options

### `{Boolean} options.references.useDiv`
  
Determines whether a `div` should be used instead of `sup` or `sub`.
### `{Boolea} options.footnotes.show` 
  
Determines whether the `ul` or `ol` containing the footnotes should be displayed.

## CSS Classes

smallfoot follows a simple convention for its classes:

```css
/* Every element that contains the smallfoot class */
.smallfoot { }

/* Every element that contains the superscript class */
.smallfoot .superscript { }
/* Every element that contains the subscript class */
.smallfoot .subscript { }

/* Every element that contains the reference class */
.smallfoot .superscript .reference { }
/* Every element that contains the reference class */
.smallfoot .subscript .reference { }

/* Every element that contains the footnote class */
.smallfoot .superscript .footnote { }
/* Every element that contains the footnote class */
.smallfoot .subscript .footnote { }

/* Every element that contains the footnotes class */
.smallfoot .footnotes { }

/* Every element that contains the supfoots class */
.smallfoot .footnotes .supfoots { }
/* Every element that contains the subfoots class */
.smallfoot .footnotes .subfoots { }
```
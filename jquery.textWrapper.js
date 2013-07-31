(function($){

var defaultOptions = {
    colWidth:         72,
    autoWrap:         true,
    codeLineTest:     null // custom code line test function.
                           // Used to tell if line should be autowrapped.
                           // signature : func( currentLine, currentParagraph )
                           // returns : boolean (false == no wrap)
};

var TextWrapper = $.TextWrapper = function( element, options ){
  this.element  = element;
  this.$element = $( element );
  this.options  = options;

  this.initialize();
};

$.extend( TextWrapper.prototype, {
  initialize: function(){
    this.autoWrap = this.options.autoWrap;
    this.scrollTop = this.$element.scrollTop();
    this.bindEvents();
  },

  bindEvents: function(){
    this.$element.on( 'keypress', $.proxy( this.wrap, this ) );
    this.$element.on( 'keydown', $.proxy( this.control, this ) );
  },

  wrap: function( event ){
    if ( event.which !== 0 && event.which != 13 ){
      if ( this.autoWrap && this.atEndOfLine() && ! this.codeLine() && this.widthThresholdReached() ){
        this.insertBreak();
        this.$element.trigger( 'wrap' );
      }
    }
  },

  control: function( event ){
    // C-l
    if ( event.ctrlKey && event.keyCode == 76 ){
      event.preventDefault();
      this.manualWrap();
    }

    // C-m
    if ( event.ctrlKey && event.keyCode == 77 ){
      event.preventDefault();
      this.toggleAutoWrap();
    }
  },

  manualWrap: function(){
    this.savePosition();
    this.$element.val( this.beforeParagraph() + this.wrappedParagraph() + this.afterParagraph() );
    this.restorePosition();
    this.$element.trigger( 'manualWrap' );
  },

  toggleAutoWrap: function(){
    this.autoWrap = ! this.autoWrap;
    this.$element.trigger( 'toggleAutoWrap', this.autoWrap );
  },

  beforeParagraph: function(){
    var paragraphStart = this.paragraphStartPosition();

    return paragraphStart !== -1 ? this.beforeCursor().slice( 0, paragraphStart ) : '';
  },

  afterParagraph: function(){
    var paragraphEnd = this.paragraphEndPosition();

    return paragraphEnd !== -1 ? this.afterCursor().slice( paragraphEnd ) : '';
  },

  wrappedParagraph: function(){
    var quote, i, paragraph;

    i = 0;
    paragraph = this.currentParagraph();
    quote = paragraph.match( /^\s*>/ ) ? '> ' : '';

    if ( quote ){
      paragraph = paragraph.replace( /\n> /g, "\n" );
    }
    
    return paragraph.replace( /\s+/g, ' ' ).replace( /(.*?)(\S+)/g, $.proxy( function( match, spaces, word ){
      if ( i + match.length >= this.options.colWidth ){
        i = word.length + quote.length;
        return "\n" + quote + word;
      }

      else {
        i += match.length;
        return match;
      }
    }, this ));
  },

  atEndOfLine: function(){
    var after, nextJump;

    after = this.afterCursor();
    nextJump = after.indexOf( "\n" );

    return ( nextJump === -1 ? after : after.slice( 0, nextJump ) ).length == 0
  },

  codeLine: function(){
    if ( this.options.codeLineTest ){
      return this.options.codeLineTest( this.currentLine(), this.currentParagraph() );
    }

    else {
      return this.currentLine().match( /^\s{4}/ );
    }
  },

  cursorPosition: function(){
    return this.element.selectionStart;
  },

  paragraphStartPosition: function(){
    var previousJump, before = this.beforeCursor();

    previousJump = before.split( '' ).reverse().join( '' ).indexOf( "\n\n" );

    return previousJump === -1 ? 0 : before.length - previousJump;
  },

  paragraphEndPosition: function(){
    var nextJump = this.afterCursor().indexOf( "\n\n" );
    return nextJump === -1 ? this.$element.val().length : nextJump;
  },

  widthThresholdReached: function(){
    return this.currentLine().length >= this.options.colWidth;
  },

  beforeCursor: function(){
    return this.$element.val().slice( 0, this.cursorPosition() );
  },

  afterCursor: function(){
    return this.$element.val().slice( this.cursorPosition() );
  },

  currentLine: function(){
    var index, before = this.beforeCursor(), after = this.afterCursor();

    if ( before.match( /\n/ ) ){
      index = before.length - before.split( '' ).reverse().join( '' ).indexOf( "\n" );
      before = before.slice( index );
    }

    if ( after.match( /\n/ ) ){
      after = after.slice( 0, after.indexOf( "\n" ) );
    }

    return before + after;
  },

  currentParagraph: function(){
    var firstHalf,
        secondHalf,
        paragraphStart = this.paragraphStartPosition(),
        paragraphEnd = this.paragraphEndPosition(),
        before = this.beforeCursor(),
        after = this.afterCursor();


    firstHalf = paragraphStart !== -1 ? before.slice( paragraphStart ) : before;
    secondHalf = paragraphEnd !== -1 ? after.slice( 0, paragraphEnd ) : after;

    return firstHalf + secondHalf;
  },

  insertBreak: function(){
    var before, after, finalWordMatch, quote;
    
    before = this.beforeCursor();
    after = this.afterCursor();
    finalWordMatch = before.match( /\S+$/ );
    quote = this.currentParagraph().match( /^\s*>/ ) ? '> ' : '';

    if ( finalWordMatch ){
      finalWordMatch = finalWordMatch[0];
      before = before.replace( /\S+$/, '' );
    }

    if ( ! ( finalWordMatch && finalWordMatch.length >= this.options.colWidth ) ){
      this.$element.val( before + "\n" + quote + ( finalWordMatch || '' ) + "\x01" + after );
      this.restorePosition();
    }
  },

  savePosition: function(){
    var position;

    this.scrollTop = this.$element.scrollTop();
    this.$element.val( this.beforeCursor() + "\x01" + this.afterCursor() );
    position = this.$element.val().indexOf( "\x01" );
    this.moveCursorTo( position );
    this.$element.scrollTop( this.scrollTop );
  },

  restorePosition: function(){
    var position = this.$element.val().indexOf( "\x01" );

    this.$element.val( this.$element.val().replace( /\x01/, '' ) );
    this.moveCursorTo( position );
    this.$element.scrollTop( this.scrollTop );
  },

  moveCursorTo: function( position ){
    var range;

    if ( this.element.setSelectionRange ){
      this.element.setSelectionRange( position, position );
    }

    else {
      range = this.element.createTextRange();
      range.collapse( true );
      range.moveEnd( 'character', position );
      range.moveStart( 'character', position );
      range.select();
    }
  }
});

$.fn.textWrapper = function( options ){
  options = $.extend( {}, defaultOptions, options );

  $(this).each( function(){
    $(this).data( 'textWrapper', new TextWrapper( this, options ) );
  });
};

})(jQuery);

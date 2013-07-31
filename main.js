(function($){

var addWrapper = function( $textarea ){
  $textarea.before( '<small style="color: #aaa;">Autowrapping : <span class="textWrapper-autowrapping-state" style="color: green;">ON</span> <span class="markdown-body" style="font-size: 90%;">(<code>C-m</code> to toggle, <code>C-l</code> to manually wrap)</span>.</small>' );

  $textarea.on( 'toggleAutoWrap', function( event, wrapped ){
    if ( wrapped ){
      $( '.textWrapper-autowrapping-state' ).text( 'ON' ).css( 'color', 'green' );
    }

    else {
      $( '.textWrapper-autowrapping-state' ).text( 'OFF' ).css( 'color', 'red' );
    }
  });

  $textarea.addClass( 'text-wrapped' ).textWrapper();
};

$(function(){
  $( 'textarea' ).each( function( i, textarea ){
    addWrapper( $( textarea ) );
  });

  $( document ).on( 'DOMNodeInserted', function( event ){
    var $new_element = $( event.target );

    if ( $new_element.is( 'textarea' ) ){
      addWrapper( $new_element );
    }

    else {
      $new_element.find( 'textarea' ).each( function( i, textarea ){
        addWrapper( $( textarea ) );
      });
    }
  });
});

})(jQuery);

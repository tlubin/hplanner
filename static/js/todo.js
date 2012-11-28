
var itemCount = 0;

$(document).ready( initializeForm );

function initializeForm() {

    // Start out by clearing the To Do input
    $("input#todo").focus().val("");

    // Define what happens when we click the "Remove All" link
    $("a#remove-all").click( removeAllItems );

    // Define what happens when we click the "Add Item" link
    $("a#add-item").click( addItem );

    // Define what happens when we press the enter key on the to do input.
    $("input#todo").keypress(function(e){
        if(e.which==13) { e.preventDefault(); addItem(); }
    });

    // the items list will be sortable.
    $( "ul#items" ).sortable().disableSelection();
}

function removeAllItems() {
    if( $("ul#items li").size() > 0 && confirm("Remove all items?" ) ) {
        $("ul#items li").hide('slow', function() { $(this).remove(); });
    }
    $("input#todo").focus();
}

function addItem() {
    var todoInput = $("input#todo");
    if( todoInput.val() == '' ) { return; }

    // get the items list and item to add
    var itemTodo = todoInput.val();
    todoInput.val("");

    // create a list item initially hidden, assigning an id to it. add a way to remove it.
    var listItem = buildListItemHidden( itemTodo, itemCount++ );
    $("ul#items").append( listItem );
    listItem.show('slow');

    // remove the corresponding list item when remove is clicked.
    listItem.find("a").click( function() {
        $(this).parent().hide('slow', function() { $(this).remove(); });
    });

    // clear input and refocus
    todoInput.focus();
}

function buildListItemHidden( itemTodo, itemId ) {
    var listItem = $("<li> " + itemTodo + "</li>",
        { id : "item[" + itemId + "]" } ).
        css( {'cursor' : 'pointer', 'color' : 'black'} );

    var spanForImage = $("<span></span>").addClass("ui-icon ui-icon-arrowthick-2-n-s");
    var removeLink = buildRemoveLink();

    return listItem.addClass('ui-state-default').prepend( spanForImage ).prepend( removeLink ).hide();
}

function buildRemoveLink() {
    return $("<a href='#'>Remove: </a>" ).css('color','#555555').hover(
        function(){ $(this).css('color', '#F68'); },
        function(){ $(this).css('color', '#555555'); } )
}

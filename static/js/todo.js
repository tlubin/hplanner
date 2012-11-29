
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


    // populate the to do list with all the tasks in the database
    $.ajax(
        {
            type:"GET",
            url:'get_tasks',
            dataType: "json",
            success: function (data)
            {
                JSONtoTASKS(data);
            }
        }
    )
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
    listItem.find("#checker").click( function() {
        $(this).parent().hide('slow', function() { $(this).remove(); });
    });

    // clear input and refocus
    todoInput.focus();
}

function buildListItemHidden( itemTodo, itemId ) {
    var listItem = $("<li> " + itemTodo + "</li>",
        { id : "item[" + itemId + "]" } ).
        css( {'cursor' : 'pointer', 'color' : 'black'} );

    var checkbox = $('<input type="checkbox" id="checker"/>').css('float', 'right');

    return listItem.addClass('ui-state-default').append( checkbox ).hide();
}


function JSONtoTASKS(json)
{
    // array of new tasks we'll build
    var new_tasks = {};

    //convert the json to this other format and add items to list
    for (var index in json)
    {
        var new_task = {};
        var json_task = json[index];

        // required fields
        new_task["title"] = json_task["fields"]["title"];

        // optional fields ToDO: change the .js file here to incorporate due dates, may also need to store id later on

        // add new task to array
        var listItem = buildListItemHidden( new_task["title"], itemCount++ );
        $("ul#items").append( listItem );
        listItem.show();

        // set up the check box that kills it (from addItem)
        listItem.find("#checker").click( function() {
            $(this).parent().hide('slow', function() { $(this).remove(); });
        });
    }
}
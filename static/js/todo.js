var itemCount = 0;

$(document).ready( initializeForm );

function initializeForm() {

    // Start out by clearing the To Do input
    $("#todo_input").val("");

    // Define what happens when we click the "Add Item" link
    $("#add-item").click( addItem );

    // Define what happens when we press the enter key on the to do input.
    $("#todo_input").keypress(function(e){
        if(e.which==13) { e.preventDefault(); addItem(); }
    });

    // the items list will be sortable.
    $( "ul#items" ).sortable({
        update: function( event, ui ) {

        }
    }).disableSelection();

    // populate the to do list with all the tasks in the database
    LOADTASKS();
}


function addItem() {

    // get user input
    var itemTitle = $("#todo_input").val();

    // return on no input
    if (itemTitle == '')
        return;

    // create a list item initially hidden, assigning an id to it. add a way to remove it.
    $listItem = AppendItem( itemTitle, 0 );

    // add this item to the database, filling in its id field with the id given by the database
    ADDtoDATABASE($listItem);

    // clear the input box
    $("#todo_input").val("");
}

function AppendItem( itemTitle, itemId) {
    // build checkbox
    var checkbox = "<input type='checkbox' id='checker' style='float: right'/>";

    // build list item, add an id (which may be a placeholder, hide it
    var $listItem = $("<li class='ui-state-default'> " + itemTitle + checkbox + "</li>");
    $listItem.attr('id', itemId);
    $listItem.hide();

//    remove the corresponding list item when remove is clicked.
    $listItem.find("#checker").click( function() {
        REMOVEfromDATABASE($(this).parent().attr("id"));
        $(this).parent().hide('slow', function() {
            $(this).remove();
        });
    });

    // add item to DOM and show it
    $("ul#items").append( $listItem );
    $listItem.show('slow');

    return $listItem;
}

function LOADTASKS()
{
    $.ajax(
        {
            type:"GET",
            url:'todo/get_tasks',
            dataType: "json",
            success: function (data)
            {
                // add tasks to todo_ list
                JSONtoTASKS(data);
            }
        }
    );
}


function JSONtoTASKS(json)
{
    //convert the json to this other format and add items to list
    for (var index in json)
    {
        task = json[index];
        AppendItem(task["fields"]["title"], task["pk"]);
    }
}

function ADDtoDATABASE($listItem)
{
    var item_to_send = {
        title: $listItem.text()
        // todo add a date
    };
    $.ajax(
        {
            type: "POST",
            url: 'todo/add_task',
            data:$.param(item_to_send),
            dataType: "text",
            success: function (data){
                $listItem.attr('id', data);
            }
        }
    )
}


function REMOVEfromDATABASE(id_to_delete)
{
    var item_to_send = {
        id: id_to_delete
        // todo add a date
    };
    $.ajax(
        {
            type: "POST",
            url: 'todo/remove_task',
            data: $.param(item_to_send),
            dataType: "text"
        }
    )
}
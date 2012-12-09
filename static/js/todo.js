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
            UpdateOrder($(this).sortable('toArray'));
        }
    }).disableSelection();

    // populate the to do list with all the tasks in the database
    LOADTASKS();
}

function UpdateOrder(array)
{
    // build a specially-formatted string and send over the new order to the server
    var item_to_send = {
        text: array.toString()
    };

    $.ajax(
        {
            type: "POST",
            url: 'todo/update_order',
            data: $.param(item_to_send),
            dataType: "text"
        }
    );
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
    var checkbox = "<img src ='http://www-03.ibm.com/software/lotus/symphony/gallery.nsf/GalleryClipArtAll/DB4C92E3748B027785257596003148CF/$File/Sign-Checkmark02-Green.png' width='32px;' height='24px;' id='checker' style='float: right'/>";

    // build list item, add an id (which may be a placeholder, hide it
    var $listItem = $("<li class='ui-state-default'> " + itemTitle + checkbox + "</li>");
    $listItem.attr('id', itemId);
    $listItem.find("#checker").hide();

    $listItem.hide();
    $listItem.mouseover( function(){
        $listItem.find("#checker").show();

    });
    $listItem.mouseleave( function(){
        $listItem.find("#checker").hide();
    });

//  remove the corresponding list item when remove is clicked, and update the TaskManager to store the new order
    $listItem.find("#checker").click( function() {
        REMOVEfromDATABASE($(this).parent().attr("id"));
        $(this).parent().hide('slow', function() {
            $(this).remove();
            UpdateOrder($("ul#items").sortable('toArray'));
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
    $.ajax(
        {
            type:"GET",
            url:'todo/get_order',
            dataType: "json",
            success: function (data)
            {
                // get the order of elements as an array
                if (data.length != 0) {
                    csv_order = data[0]["fields"]["order"];
                    order = csv_order.split(',');

                    // for each element of the order array, pick out the task with that id and render it
                    for (var i = 0, n = order.length; i < n; i++)
                    {
                        for (index in json)
                        {
                            task = json[index];
                            if (task["pk"] == order[i])
                                AppendItem(task["fields"]["title"], task["pk"]);
                        }
                    }
                }

            }
        }
    );
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
                // now that this id has gone through, update the database ordering
                UpdateOrder($( "ul#items" ).sortable('toArray'));
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
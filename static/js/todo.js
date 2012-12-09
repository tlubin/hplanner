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
        },
        axis: 'y'
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
    var checkbox = "<img src='../static/images/checkbox.png' id='checker' width='19px' style='float: right'/>";
    var checkbox2 = "<img src='../static/images/checkbox2.png' id='checker2' width='19px' style='float: right'/>";

    // build list item, add an id (which may be a placeholder, hide it
    var $listItem = $("<li class='ui-state-default'> " + itemTitle + checkbox + checkbox2 +"</li>");
    $listItem.attr('id', itemId);
    $listItem.hide();
    $listItem.find("#checker").hide();
    $listItem.find("#checker2").hide();

    //set up animation with checkbox
    // if you scroll enter the to_do div, show the small check
    $listItem.mouseenter( function(){
        $listItem.find("#checker").show();
        $listItem.find("#checker2").hide();

    });
    // if you leave the to_do div, hide the small check
    $listItem.mouseleave( function(){
        $listItem.find("#checker").hide();
        $listItem.find("#checker2").hide();
    });
    // if you scroll over the check itself, hide the small, show the big
    $listItem.find("#checker").mouseenter( function(){
        $listItem.find("#checker").hide();
        $listItem.find("#checker2").show();
    });
    // if you leave the check itself, hide the big, show the small
    $listItem.find("#checker2").mouseleave( function(){
        $listItem.find("#checker2").hide();
        $listItem.find("#checker").show();
    });

//  remove the corresponding list item when remove is clicked, and update the TaskManager to store the new order
    $listItem.find("#checker2").click( function() {
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
    // make another http request to figure out the order in which we want to display the tasks, the do it
    $.ajax(
        {
            type:"GET",
            url:'todo/get_order',
            dataType: "json",
            success: function (data)
            {
                if (data.length != 0)
                {
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
    // package up the data to send to the server
    var item_to_send = {
        title: $listItem.text()
        // todo add a date
    };

    // send it, modifying the list element according to how the database saves it
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
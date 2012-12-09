$(document).ready( initializeForm );

function initializeForm() {

    // the note list.
    $( "ul#notification" ).disableSelection();

    // populate the to do list with all the tasks in the database
    loadNotifications();
}

function loadNotifications()
{
    $.ajax(
        {
            type:"GET",
            url:'notification/get_notes',
            dataType: "json",
            success: function (data)
            {
                // add notification notification tab
                JSONtoNOTES(data);
            }
        }
    );
}

function JSONtoNOTES(json)
{
    for (index in json)
    {
        var note = json[index];
        AppendNote(note["fields"]["message"], note["pk"]);
    }
}


function AppendNote( noteTitle, noteId) {
    // build checkbox to close notification

    // build notification list item
    var $notification = $("<li class='notificationClass'><a href='javascript: void(0)'>" + noteTitle + "</a></li >");
    $notification.attr('id', noteId);
    $notification.hide();


//  remove the corresponding list item when remove is clicked, and remove that one from the database
    $notification.click( function() {

        RemoveNoteFromDatabase($(this).attr("id"));
        $(this).hide(400, function() {
            $(this).remove();
        });
    });

    // add item to DOM and show it
    $("ul#notifications").append( $notification );
    $notification.show();
}

// removes the selected notification from the database
function RemoveNoteFromDatabase(id_to_delete)
{
    var item_to_send = {
        id: id_to_delete
    };

    $.ajax(
        {
            type: "POST",
            url: 'notification/remove_note',
            data: $.param(item_to_send),
            dataType: "text"
        }
    )
}
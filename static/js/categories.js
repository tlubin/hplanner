$(document).ready( initializeForm );

function initializeForm() {

    // Start out by clearing the To Do input
    $("#cat-input").val("");

//    Define what happens when we click the "Add Item" link
    $("#add-cat").click( addCat );

//    Define what happens when we press the enter key on the to do input.
    $("#cat-input").keypress(function(e){
        if(e.which==13) { e.preventDefault(); addCat(); }
    });

    // the categories list is not sortable
    $( "ul#cats" ).disableSelection();

    // populate the to do list with all the tasks in the database
    LoadCats();
}


function addCat() {

    // get user input
    var catTitle = $("#cat-input").val();

    // return on no input
    if (catTitle == '')
        return;

    // create a list item initially hidden, assigning an id to it. add a way to remove it.
    $listItem = AppendCat( catTitle,  "", 0);

    // add this item to the database, filling in its id field with the id given by the database
    CatADDtoDATABASE($listItem);

    // clear the input box
    $("#cat-input").val("");
}


function AppendCat( catTitle, catColor, catId) {
    // build checkbox
    var checkbox = "<input type='checkbox' id='cat_checker' style='float: right'/>";

    // build list item, add an id (which may be a placeholder) hide it
    var $listItem = $("<li class='ui-state-default'> " + catTitle + checkbox + "</li>");
    $listItem.attr('id', catId);
    // maybe add color in here
    $listItem.hide();

//  remove the corresponding list item when remove is clicked, and update the TaskManager to store the new order
    $listItem.find("#cat_checker").click( function() {
        CatREMOVEfromDATABASE($(this).parent().attr("id"));
        $(this).parent().hide('slow', function() {
            $(this).remove();
        });
    });

    // add item to DOM and show it
    $("ul#cats").append( $listItem );
    $listItem.show('slow');

    return $listItem;
}

function LoadCats()
{
    $.ajax(
        {
            type:"GET",
            url:'cat/get_cats',
            dataType: "json",
            success: function (data)
            {
                // add categories to category list
                JSONtoCATS(data);
            }
        }
    );
}


function JSONtoCATS(json)
{
    // for each category element returned in the json, append it to our list
    for (index in json)
    {
        cat = json[index];
        AppendCat(cat["fields"]["title"], cat["fields"]["color"], cat["pk"]);
    }
}


function CatADDtoDATABASE($listItem)
{
    // set up the package to send to the server
    var item_to_send = {
        title: $listItem.text()
    };

    // Send it, modifying the list element upon success
    $.ajax(
        {
            type: "POST",
            url: 'cat/add_cat',
            data: $.param(item_to_send),
            dataType: "text",
            success: function (data){
                $listItem.attr('id', data);
//                ADD the color to the category
            }
        }
    )
}

function CatREMOVEfromDATABASE(id_to_delete)
{
    // set up the package to send to the server
    var item_to_send = {
        id: id_to_delete
    };

    // send over the package, telling the server what to remove
    $.ajax(
        {
            type: "POST",
            url: 'cat/remove_cat',
            data: $.param(item_to_send),
            dataType: "text"
        }
    )
}
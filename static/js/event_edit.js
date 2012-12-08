$(document).ready(function() {
    console.log("document ready");
       showRepeat();
        hideRepeat();

    // repeat box checked handler

});


function showRepeat(){
        $('#repeat_check').bind('change', function(){

            $('#end_div').show();
        })
}

function hideRepeat(){
    $("#end_div").hide();
}
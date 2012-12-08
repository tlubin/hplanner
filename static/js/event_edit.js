$(document).ready(function() {
    showEndRepeat();
    hideEndRepeat();

    // repeat box checked handler

});


function showEndRepeat(){

    // initially hide
    $("#end_repeat").hide();

    //
    $('#repeat_rule').bind('change', function(){

        $('#end_repeat').show();
    })
}

function hideEndRepeat(){
}
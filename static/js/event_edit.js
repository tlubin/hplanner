$(document).ready(function() {
    // configure the endRepeat box
    configureEndRepeat();

    // configure the hour/min inputs of start/end
    configureTimeInputs();

});


function configureEndRepeat() {

    // initially hidden
    $("#end_repeat").hide();

    //
    $('#rrule').bind('change', function(){
        var val = $('#rrule').val();

        // if repeat rule is not 'None'
        if (val != '0')
            $('#end_repeat').show();

        // repeat rule changed to 'None'
        else
            $('#end_repeat').hide();
    })
}

function configureTimeInputs() {
    // configure hour inputs to be only 0-12
    $('.hour_filter').each(function() {
        // highlight on click
        $(this).click( function() {
            $(this).val('');
        });

        // filter input to only numbers
        $(this).keyfilter(/[0-9]/);

        // deal with special cases
        $(this).keypress(function(e){
            // if there is a 1 in the box, only allow 0,1,2
            if ($(this).val() == '1') {
                if (e.which != 48 && e.which != 49 && e.which != 50) // 0, 1, 2
                    e.preventDefault();
            }
            // if there is any other value, dont allow other input
            else if ($(this).val() == '2' || $(this).val() == '3' || $(this).val() == '4' || $(this).val() == '5' ||
                $(this).val() == '6' || $(this).val() == '7' || $(this).val() == '8' || $(this).val() == '9')
                e.preventDefault();

        });

    });

    // configure minute inputs to be only 0-60
    $('.min_filter').each(function() {
        // highlight on click
        $(this).click( function() {
            $(this).val('');
        });

        // filter input to only numbers
        $(this).keyfilter(/[0-9]/);

        // deal with special cases
        $(this).keypress(function(e){
            // if there is a 6,7,8,9 in the box don't allow other input
            if ($(this).val() == '6' || $(this).val() == '7' || $(this).val() == '8' || $(this).val() == '8')
                e.preventDefault();
        });

    });

}
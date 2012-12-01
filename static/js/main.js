$(document).ready(function() {
    // set up event handler for clicking settings button
    // jquery ui dialog options -- http://api.jqueryui.com/dialog/
    var $settings = $("#settings");
    $("#settings_button").click(function() {
        $settings.dialog({
            title: "This is the settings page",
            width: 400,
            draggable: false,
            resizable: false,
            close: function() {
                $settings.dialog("destroy");
                $settings.hide();
            },
            buttons: {
                'Save Changes' : function() {
                    $settings.dialog("close");
                }
            }
        }).show();
    });
});
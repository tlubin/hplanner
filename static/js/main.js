$(document).ready(function() {
    // ajax request to get event data from server
    $.ajax(
        {
            type:"GET",
            url:'get_events',
            dataType: "json",
            success: function (data)
            {
                // convert JSON to array of Event objects
                // http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
                var user_events = JSONtoEVENTS(data);

                // display javascript plugin fullCalendar
                // http://arshaw.com/fullcalendar/docs/
                var calendar = $('#calendar').fullCalendar({
                    theme: true,
                    header: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'month,agendaWeek,agendaDay'
                    },
                    allDayDefault: false,
                    editable: true,
                    selectable: true,
                    selectHelper: true,
                    events: user_events,
                    select: function(start, end, allDay) {
                        var $dialogContent = $("#event_edit_container");
                        $dialogContent.dialog({
                            title: "New Event:",
                            width: 400,
                            draggable: false,
                            resizable: false,
                            close: function() {
                                $dialogContent.dialog("destroy");
                                $dialogContent.hide();
                            },
                            buttons: {
                                save : function() {
                                    var new_title = $("#title").val();
                                    if (new_title) {
                                        var new_event = {
                                            title: new_title,
                                            start: start,
                                            end: end,
                                            allDay: allDay
                                        };

                                        // TODO: this should be done cleaner by using the function already made
                                        // add event to database
                                        $.ajax(
                                            {
                                                type: "POST",
                                                url: 'add_event',
                                                data:$.param(new_event),
                                                dataType: "text",
                                                success: function (data) {
                                                    alert(data);
                                                    // set id of new event
                                                    new_event['id'] = parseInt(data);
                                                }
                                            }
                                        );

                                        // update calendar and dialog display
                                        calendar.fullCalendar('renderEvent', new_event, true);
                                        calendar.fullCalendar('unselect');
                                        $dialogContent.dialog("close");

                                    }
                                },
                                cancel : function() {
                                    $dialogContent.dialog("close");
                                }
                            }
                        }).show();
                    },
                    eventClick: function(calEvent, jsEvent, view) {
                        var $dialogContent = $("#event_edit_container");
                        var titleField = $dialogContent.find("input[id='title']").val(calEvent.title);
                        $dialogContent.dialog({
                            title: "Edit - " + calEvent.title,
                            width: 400,
                            draggable: false,
                            resizable: false,
                            close: function() {
                                $dialogContent.dialog("destroy");
                                $dialogContent.hide();
                            },
                            buttons: {
                                save : function() {

                                    if (calEvent.title != titleField.val()) {
                                        // update title of event
                                        calEvent.title = titleField.val();

                                        // update database
                                        makePOST('update_event', calEvent);
                                    }

                                    calendar.fullCalendar("renderEvent", calEvent);
                                    $dialogContent.dialog("close");

                                },
                                delete : function() {
                                    // delete event from database
                                    makePOST('remove_event', calEvent);

                                    // update calendar and close dialog
                                    $dialogContent.dialog("close");
                                    calendar.fullCalendar("removeEvents", calEvent.id);
                                    calender.fullCalendar("render");

                                },
                                cancel : function() {
                                    $dialogContent.dialog("close");
                                }
                            }
                         }).show();
                    },
                    eventDrop: function( event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view ) {
                        // update database
                        makePOST('update_event', event);
                    },
                    eventResize: function( event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ) {
                        // update database
                        makePOST('update_event', event);
                    }
                });
            }
        });

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


/*
 * Takes in JSON of events from database and returns an array of Event Objects to be
 * passed to the fullCalendar
 */
function JSONtoEVENTS (json) {
    // array to hold event objects
    var events = [];

    // for each event
    for (var index in json) {
        // structure to hold new event
        var event = {};

        /*{
            "pk": 1,
            "model": "cal.event",
            "fields": {
                "start": "2012-11-27T01:41:20.229",
                "allDay": null,
                "end": null,
                "title": "Event title"
         } */
        var json_event = json[index];

        // required fields
        event["title"] = json_event["fields"]["title"];
        event["start"] = json_event["fields"]["start"];
        event["id"] = json_event["pk"];

        // optional fields
        if (json_event["fields"]["allDay"])
            event["allDay"] = json_event["fields"]["allDay"];
        if (json_event["fields"]["end"])
            event["end"] = json_event["fields"]["end"];

        // add event to array
        events.push(event);
    }
    return events;
}

/*
 * Takes in a url for the ajax POST request along with
 * the event Javascript object to be passed and makes the
 * appropriate ajax request with the data.
 */

function makePOST(url, event) {
    $.ajax(
        {
            type: "POST",
            url: url,
            data:$.param(event),
            dataType: "text",
            success: function (data) {
                alert(data);
            }
        }
    );

}
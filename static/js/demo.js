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
                                        calendar.fullCalendar('renderEvent', new_event, true);
//                                        $.ajaxSetup({
//                                            data: {csrfmiddlewaretoken: '{{ csrf_token }}' }
//                                        });

                                        // TODO add to database AJAX (ignores output, should change)
                                        $.ajax(
                                            {
                                                type:"POST",
                                                url:'add_event',
                                                data: new_event,
                                                dataType: "json",
                                                success: function (data) {
                                                    alert("success");
                                                }
                                            }
                                        );
                                    }
                                    calendar.fullCalendar('unselect');
                                    $dialogContent.dialog("close");

                                    // TODO update event in database with AJAX
                                },
                                cancel : function() {
                                    $dialogContent.dialog("close");
                                }
                            }
                        }).show();
                    },
                    events: user_events,
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

                                  //  calEvent.start =
                                  //  calEvent.end =
                                    calEvent.title = titleField.val();

                                    calendar.fullCalendar("renderEvent", calEvent);
                                    $dialogContent.dialog("close");

                                    // TODO update event in database with AJAX
                                },
                                delete : function() {
                                    $dialogContent.dialog("close");
                                    calendar.fullCalendar("removeEvents", calEvent.id);
                                    calender.fullCalendar("render");

                                    // TODO delete event from database with AJAX
                                },
                                cancel : function() {
                                    $dialogContent.dialog("close");
                                }
                            }
                         }).show();
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
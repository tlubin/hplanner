/**
 * Created with PyCharm.
 * User: todd
 * Date: 11/29/12
 * Time: 10:58 AM
 * Sets up the calendar and all the event handlers
 */

// global for next_id for calendar events
next_id = 1;

$(document).ready(function() {

    // ajax request to get event data from server
    $.ajax(
        {
            type:"GET",
            url:'cal/get_events',
            dataType: "json",
            success: function (data)
            {
                alert(data);
                // convert JSON to array of Event objects
                var user_events = JSONtoEVENTS(data);

                // initialize the calendar
                initializeCalendar(user_events);
            }
        });
});


/*
 * Takes in JSON of events from database and returns an array of Event Objects to be
 * passed to the fullCalendar
 *
 * http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
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
        event["sid"] = json_event["pk"]; // server id
        event["id"] = next_id;

        // increment next_id
        next_id++;

        // optional fields
        if (json_event["fields"]["allDay"])
            event["allDay"] = json_event["fields"]["allDay"];
        if (json_event["fields"]["end"])
            event["end"] = json_event["fields"]["end"];

        // check for repeating event
        var model = json_event["model"];
        if (model == "cal.event") {
            event["type"] = "event";
            events.push(event);
        }
        else if (model == "cal.repeatevent") {
            event["type"] = "repeat";

            // add "head" of repeat chain
            events.push(event);

            // add the rest of the repeated events
            var repeats = repeat_event(event);
            for (var key in repeats) {
                events.push(repeats[key]);
            }
        }
    }
    return events;
}

function repeat_event(event) {
    var events = [];

    // TODO: this is where we look at the rule and build accordingly

    for (var i = 1; i < 20; i++) {

        // container for new event
        var new_event = {};

        // get a copy of event
        $.extend(new_event,event);

        // give event a new id
        new_event['id'] = next_id;
        next_id++;

        // update the date
        var old_Date = $.fullCalendar.parseDate(new_event.start);
        var new_Date = new Date(old_Date.getFullYear(), old_Date.getMonth(), old_Date.getDate()+7*i,
                                old_Date.getHours(), old_Date.getMinutes());
        new_event['start'] = new_Date.toString();

        // add event to array
        events.push(new_event);
    }

    return events;
}


/*
 * Takes in array of Event objects and sets up
 * the calendar will all the appropriate options
 * and event handlers.
 */
function initializeCalendar(events) {
    // display javascript plugin fullCalendar
    // http://arshaw.com/fullcalendar/docs/
    var calendar = $('#calendar').fullCalendar({
        theme: true,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        weekMode: 'liquid',
        height: 600,
        allDayDefault: false,
        editable: true,
        selectable: true,
        selectHelper: true,
        events: events,
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
                                id: next_id,
                                title: new_title,
                                start: start,
                                end: end,
                                allDay: allDay
                            };
                            next_id++;

                            // TODO: this should be done cleaner by using the function already made
                            // add event to database
                            $.ajax(
                                {
                                    type: "POST",
                                    url: 'cal/add_event',
                                    data:$.param(new_event),
                                    dataType: "text",
                                    success: function (data) {
                                        alert(data);
                                        // set id of new event
                                        new_event['sid'] = parseInt(data);
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
                            makePOST('cal/update_event', calEvent);
                        }

                        calendar.fullCalendar("renderEvent", calEvent);
                        $dialogContent.dialog("close");

                    },
                    delete : function() {
                        // delete event from database
                        makePOST('cal/remove_event', calEvent);

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
            makePOST('cal/update_event', event);
        },
        eventResize: function( event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ) {
            // update database
            makePOST('cal/update_event', event);
        },
        droppable: true, // this allows things to be dropped onto the calendar !!!
        drop: function(date, allDay) { // this function is called when something is dropped
            alert("something dropped");
            // retrieve the dropped element's stored Event Object
            var dropppedObject = $(this).data('eventObject');
            alert(dropppedObject);
            // TODO: handle dropped object
            // we need to copy it, so that multiple events don't have a reference to the same object
//                        var copiedEventObject = $.extend({}, originalEventObject);
//
//                        // assign it the date that was reported
//                        copiedEventObject.start = date;
//                        copiedEventObject.allDay = allDay;
//
//                        // render the event on the calendar
//                        // the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
//                        $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
//
//                        // is the "remove after drop" checkbox checked?
//                        if ($('#drop-remove').is(':checked')) {
//                            // if so, remove the element from the "Draggable Events" list
//                            $(this).remove();
//                        }

        }
    });
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
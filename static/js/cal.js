// magic number for how many times to repeat events
MAXREPEAT = 2;

// global for next_id for calendar events
next_id = 1;


$(document).ready(function() {

    // get events and repeats from the server; upon success, initializeCalendar
    getEvents();
});


/*
 * Gets all the events from the calendar, passes them to JSONtoEVENTS, which gives them to the calendar initializer
 */
function getEvents() {
    $.ajax(
        {
            type:"GET",
            url:'cal/get_events',
            dataType: "json",
            success: function (data)
            {
                // convert JSON to array of Event objects
                var user_events = JSONtoEVENTS(data);

                // initialize the calendar, after getting the events to show from JSONtoEVENTS via repeat_events
                initializeCalendar(user_events);
            }
        });
}

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

        // optional fields
        if (json_event["fields"]["allDay"])
            event["allDay"] = json_event["fields"]["allDay"];
        if (json_event["fields"]["end"])
            event["end"] = json_event["fields"]["end"];

        // check for repeating event
        var model = json_event["model"];
        if (model == "cal.event") {
            // change type and id
            event["type"] = "event";
            event["id"] = next_id;
            // increment next_id
            next_id++;

            events.push(event);
        }
        else if (model == "cal.repeatevent") {
            event["type"] = "repeat";

            // get information about the repeat
            var repeat_until = json_event['fields']['endRepeat']; // null on no end repeat date
            var breaks = json_event['fields']['breaks']; // array of break dates

            // add the repeating events as distinct events
            var repeats = repeat_event(event, repeat_until, breaks);
            for (var key in repeats)
                events.push(repeats[key]);
        }
    }
    return events;
}

/*
 * Takes an event object with type 'repeat' as an input along with
 * an end repeat date (empty if no end) and an array of dates for breaks.
 * Returns an array of all the events to be displayed on the calendar.
 * Array includes the head, and builds according to the repeat rule and MAXREPEAT.
 */
function repeat_event(event, repeat_until, breaks) {
    var events = [];

    // TODO: this is where we look at the rule and build accordingly

    // get old start/end datetimes, repeat_until, break
    var old_start = $.fullCalendar.parseDate(event.start);
    var old_end = $.fullCalendar.parseDate(event.end);
    var endDate = $.fullCalendar.parseDate(repeat_until);
    for (var key in breaks) {
        breaks[key] = $.fullCalendar.parseDate(breaks[key]);
    }


    for (var i = 0; i < MAXREPEAT; i++) {
        // container for new event
        var new_event = {};

        // get a copy of event
        $.extend(new_event,event);

        // update the start date
        var new_start = new Date(old_start.getFullYear(), old_start.getMonth(), old_start.getDate()+7*i,
            old_start.getHours(), old_start.getMinutes());

//        check whether this date is a break, if so then continue TODO! check for empty breaks first to save time?
        var to_continue = false;
        if (breaks) {
            for (var key in breaks) {
                // times matched!
                if (new_start.getTime() == breaks[key].getTime()) {
                    to_continue = true;
                    break;
                }
            }
        }
        // continue if time matched a break
        if (to_continue)
            continue;

        // check whether you are past the end, if so then break
        if (endDate) {
//            console.log(new_start);
//            console.log(endDate);
//            console.log(new_start > endDate);
            if (new_start > endDate)
                break;
        }

        // set start time
        new_event['start'] = new_start.toString();

        // update the end date if it exists
        if (old_end) {
            var new_end = new Date(old_end.getFullYear(), old_end.getMonth(), old_end.getDate()+7*i,
                old_end.getHours(), old_end.getMinutes());
            new_event['end'] = new_end.toString();
        }

        // give event a new id
        new_event['id'] = next_id;
        next_id++;

        // add event to array
        events.push(new_event);
    }
    return events;
}


/*
 * Takes in array of Event objects and sets up
 * the calendar with all the appropriate options
 * and event handlers.
 */
function initializeCalendar(events) {
    // display javascript plugin fullCalendar
    // http://arshaw.com/fullcalendar/docs/

    // NOTE: we make the calendar a global variable in this script!
    calendar = $('#calendar').fullCalendar({

        // calendar options
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

        // select (when you click / click and drag the calendar) brings up a dialog for creating a new event
        select: function(start, end, allDay) {
            clearEventForm();

            // TODO prepopulate with the time, if this has come from dragging on the calendar

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

                        // save the inputted values. TODO: these should include date-time.
                        var new_title = $("#title").val();
                        var repeat = $("#repeat_check").is(':checked');
                        if (new_title) {
                            var new_event = {
                                id: next_id,
                                title: new_title,
                                start: start,
                                end: end,
                                allDay: allDay,
                                type: "event"
                            };
                            // update type if necessary
                            if (repeat)
                                new_event['type'] = "repeat";
                            next_id++;

                            // Depending on which type of event we have here, enter it into the database with one of 2 functions
                            // These functions also set the sid's and render
//                            console.log(new_event.end);
                            if (new_event['type'] == "event")
                                add_event(new_event);

                            else if (new_event['type'] == "repeat")
                                add_repeat(new_event);

                            // update the calendar / dialog displays
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

        // eventClick (when an event is clicked) brings up a dialog, from which the event can be edited
        eventClick: function(calEvent, jsEvent, view) {
            console.log(calEvent);

            // save the various fields from the dialog as variables
            var $dialogContent = $("#event_edit_container");
            var titleField = $dialogContent.find("input[id='title']").val(calEvent.title);
            var repeatBox = $("#repeat_check");
            // TODO: add time as one of these

            // setup checkbox according to event type
            (calEvent.type == 'repeat') ? repeatBox.attr('checked', true) : repeatBox.attr('checked', false);
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
                        // event
                        if (calEvent.type == 'event') {
                            // type change to RepeatEvent
                            if (repeatBox.is(':checked')) {
                                // delete the event
                                delete_event(calEvent);

                                // create new event object to be repeated
                                var repeat_event = {
                                    id: next_id,
                                    type: 'repeat',
                                    start: calEvent.start,
                                    end: calEvent.end,
                                    title: titleField.val(),
                                    allDay: calEvent.allDay
                                };
                                next_id++;
                                add_repeat(repeat_event);
                            }
                            // non-type change
                            else if (calEvent.title != titleField.val()) { // TODO! any change in anything
                                // update title
                                calEvent.title = titleField.val();

                                // edit event
                                edit_event(calEvent);
                            }
                        }
                        // repeat
                        else if (calEvent.type == 'repeat') {
                            // type change to Event
                            if (!repeatBox.is(':checked')) {
                                // update title
                                calEvent.title = titleField.val();

                                // change event type
                                calEvent.type = 'event';

                                // delete present and future of current repeating event
                                delete_repeat(calEvent);

                                // turn all past part of old repeat event into events (not including present)
                                free_repeat(calEvent);

                                // add present as an event
                                add_event(calEvent);


                            }
                            // non-type change
                            else if(calEvent.title != titleField.val()) { // TODO! any change in anything
                                // prompt user
                                var $prompt_user = $("#repeat_prompt");
                                $prompt_user.dialog({
                                    title: "Edit Repeating Event:",
                                    width: 400,
                                    draggable: false,
                                    resizable: false,
                                    close: function() {
                                        $prompt_user.dialog("destroy");
                                        $prompt_user.hide();
                                    },
                                    buttons: {
                                        "All Future Events": function() {
                                            // update title
                                            calEvent.title = titleField.val();

                                            var oldStart = calEvent.start;
                                            var oldEnd = calEvent.end;

                                            // TODO! get newStart, newEnd, allDay from fields
                                            // TODO! this is where we give default values
                                            // TODO! update calEvent and send these new values

                                            // make sure newEnd is not null
                                            if (!oldEnd)
                                                oldEnd = oldStart;

                                            edit_repeat(calEvent, oldStart, oldEnd);

                                            // close dialog
                                            $prompt_user.dialog("close");

                                        },
                                        "This Event Only": function() {
                                            // update title
                                            calEvent.title = titleField.val();
                                            // TODO! update the start and end times

                                            break_repeat(calEvent);

                                            // add event as new event
                                            var new_event = {
                                                id: next_id,
                                                type: 'event',
                                                start: calEvent.start,
                                                end: calEvent.end,
                                                title: titleField.val(),
                                                allDay: calEvent.allDay
                                            };
                                            next_id++;
                                            add_event(new_event);

                                            // close dialog
                                            $prompt_user.dialog("close");
                                        }
                                    }
                                }).show();


                            }

                        }
                        // close dialog
                        $dialogContent.dialog("close");

                    },
                    delete : function() {
                        // close dialog
                        $dialogContent.dialog("close");

                        if (calEvent.type == "event")
                        {
                            delete_event(calEvent);
                        }
                        else if (calEvent.type == "repeat")
                        {
                            // prompt the user "All Future Events" or "This Event Only"
                            var $prompt_user = $("#repeat_prompt");
                            $prompt_user.dialog({
                                title: "Delete Repeating Event:",
                                width: 400,
                                draggable: false,
                                resizable: false,
                                close: function() {
                                    $prompt_user.dialog("destroy");
                                    $prompt_user.hide();
                                },
                                buttons: {
                                    "All Future Events": function() {
                                        delete_repeat(calEvent);

                                        // close dialog
                                        $prompt_user.dialog("close");

                                    },
                                    "This Event Only": function() {
                                        break_repeat(calEvent);

                                        // close dialog
                                        $prompt_user.dialog("close");
                                    }
                                }
                            }).show();
                        }
                    },
                    cancel : function() {
                        $dialogContent.dialog("close");
                    }
                }
            }).show();
        },

        // eventDrop (triggered when an event is dropped from one datetime to another) ** event has new event times
        eventDrop: function( event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view ) {

            // event
            if (event.type == 'event') {
                edit_event(event);
            }
            // repeat
            else if (event.type == 'repeat') {
                var $prompt_user = $("#repeat_prompt");
                $prompt_user.dialog({
                    title: "Edit Repeating Event:",
                    width: 400,
                    draggable: false,
                    resizable: false,
                    close: function() {
                        $prompt_user.dialog("destroy");
                        $prompt_user.hide();
                    },
                    buttons: {
                        "All Future Events": function() {
                            // get oldStart and oldEnd
                            var newStart = event.start;
                            var newEnd = event.end;
                            if (!newEnd)
                                newEnd = newStart;
                            var oldStart = dateChange(newStart, -1 * dayDelta, -1 * minuteDelta);
                            var oldEnd = dateChange(newEnd, -1 * dayDelta, -1 * minuteDelta);

                            edit_repeat(event, oldStart, oldEnd);

                            // close dialog
                            $prompt_user.dialog("close");
                        },
                        "This Event Only": function() {
                            // new event that will be added
                            var new_event = {
                                id: next_id,
                                type: 'event',
                                start: event.start,
                                end: event.end,
                                title: event.title,
                                allDay: allDay
                            };
                            next_id++;

                            // create a break but change start date to old start date so the break is at the right date
                            var oldStart = dateChange(event.start, -1 * dayDelta, minuteDelta);
                            event.start = oldStart;
                            break_repeat(event);

                            // add new event
                            add_event(new_event);

                            // close dialog
                            $prompt_user.dialog("close");
                        }
                    }
                }).show();

            }

        },
        eventResize: function( event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ) {
            // event
            if (event.type == 'event') {
//                console.log(event);
//                console.log(minuteDelta);
//                console.log(dayDelta);
                edit_event(event);
            }
            // repeat
            else if (event.type == 'repeat') {
                var $prompt_user = $("#repeat_prompt");
                $prompt_user.dialog({
                    title: "Edit Repeating Event:",
                    width: 400,
                    draggable: false,
                    resizable: false,
                    close: function() {
                        $prompt_user.dialog("destroy");
                        $prompt_user.hide();
                    },
                    buttons: {
                        "All Future Events": function() {
                            // get newStart and newEnd
                            var oldStart = event.start;
                            var oldEnd = event.end;
                            if (!oldEnd)
                                oldEnd = oldStart;
                            var newStart = dateChange(oldStart, dayDelta, minuteDelta);
                            var newEnd = dateChange(oldEnd, dayDelta, minuteDelta);

                            edit_repeat(event, newStart, newEnd, allDay);

                            // close dialog
                            $prompt_user.dialog("close");
                        },
                        "This Event Only": function() {
                            // create a break
                            break_repeat(event);

                            // calculate start and end date of new event to add
                            var oldStart = event.start;
                            var oldEnd = event.end;
                            if (!oldEnd)
                                oldEnd = oldStart;
                            var newStart = dateChange(oldStart, dayDelta, minuteDelta);
                            var newEnd = dateChange(oldEnd, dayDelta, minuteDelta);

                            // add event as new event
                            var new_event = {
                                id: next_id,
                                type: 'event',
                                start: newStart,
                                end: newEnd,
                                title: event.title,
                                allDay: allDay
                            };
                            next_id++;
                            add_event(new_event);

                            // close dialog
                            $prompt_user.dialog("close");
                        }
                    }
                }).show();

            }
        },
        droppable: true, // this allows things to be dropped onto the calendar !!!
        drop: function(date, allDay) { // this function is called when something is dropped
            // retrieve the dropped element's stored Event Object
            var dropppedObject = $(this).data('eventObject');
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



// clears the event creation / editing form
function clearEventForm() {
    $('#title').val('');
    $('#repeat_check').attr('checked', false);
    // TODO clear other fields once they exist, namely the date
}

// adds a non-repeating event to the database, renders the calendar
function add_event(new_event){
    calendar.fullCalendar('renderEvent', new_event, true);
    $.ajax(
        {
            type: "POST",
            url: "cal/add_event",
            data:$.param(new_event),
            dataType: "text",
            success: function (data) {
                // we're being handed back this event's s-id (server id)
                new_event.sid = parseInt(data);
            }
        }
    );
}

// adds a repeating event to the database, renders the calendar
function add_repeat(new_event) {
    var new_events = repeat_event(new_event);
    console.log(new_events);
    for (var index in new_events)
    {
        // data gives back the sid
        calendar.fullCalendar('renderEvent', new_events[index], true); // TODO! this is super slow
    }

    // POST to database, store returning sid to each event
    $.ajax(
        {
            type: "POST",
            url: "cal/add_repeat",
            data:$.param(new_event),
            dataType: "text",
            success: function (data) {
                for (var index in new_events)
                {
                    // data gives back the sid, we add it and render
                    new_events[index].sid = parseInt(data);

                }
            }
        }
    );
}

// deletes an event from the calendar
function delete_event(event) {
    // delete from calendar
    calendar.fullCalendar('removeEvents', event.id);

    // delete from database
    makePOST('cal/delete_event', event);
}

// deletes current and all future events for a repeating event
function delete_repeat(event) {

    //  delete each event with the same sid as this, and with a current or future date
    calendar.fullCalendar('removeEvents', function(e) {
        return (e.type == 'repeat' && e.sid == event.sid && e.start >= event.start);
    });

    // check to see if only the head is left in the repeatevent chain
    var events_behind = calendar.fullCalendar('clientEvents', function(e) {
       return (e.type == 'repeat' && e.sid == event.sid && e.start < event.start);
    });
    if (events_behind.length == 1) {
        // only the head is left, turn this into an event object
        var head = events_behind[0];
        head.type = 'event';
    }

    // render the calendar
    calendar.fullCalendar("render");

    // delete from database
    $.ajax(
        {
            type: "POST",
            url: "cal/delete_repeat",
            data:$.param(event),
            dataType: "text",
            success: function (data) {
                // change sid of head if response has an id
                if (data.length != 0)
                    head.sid = parseInt(data);
            }
        }
    );
}

// edits an event from the calendar
function edit_event(event) {
    // render new event
    calendar.fullCalendar('renderEvent', event, true);

    // update database
    makePOST('cal/edit_event', event);
}

// ends the repeat event at the date of oldStart and starts a new repeat event
// with the new types
// event is the NEW event with new title and new start time, end time, allDay
function edit_repeat(event, oldStart, oldEnd) {
    //  get each event with the same sid as this, and with a current or future date from the oldStart
    // this doesn't include the passed in event
    var events_to_change = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == event.type && e.sid == event.sid && e.start > oldStart && e.id != event.id);
    });

    // calculate change in start and end times
    var dayDeltaStart = Math.ceil((event.start.getTime()-oldStart.getTime())/(one_day));
    var minuteDeltaStart = (event.start.getHours() - oldStart.getHours())*60 +
                           (event.start.getMinutes() - oldStart.getMinutes());
    console.log((event.start.getTime()-oldStart.getTime())/(one_day));

    // if event has no end, give it the start
    if (!event.end) {
        event.end = event.start;
    }
    var dayDeltaEnd = Math.ceil((event.end.getTime()-oldEnd.getTime())/(one_day));
    var minuteDeltaEnd = (event.end.getHours() - oldEnd.getHours())*60 +
        (event.end.getMinutes() - oldEnd.getMinutes());

    // move each start and end by dayDelta and minuteDelta, update title, set allDay
    for (var index in events_to_change) {
        // event to change
        var event_to_change = events_to_change[index];

        // set allDay
        event_to_change.allDay = event.allDay;

        // set title
        event_to_change.title = event.title;

        // set end date
        var ds = event_to_change.start;
        var de = event_to_change.end;
        // if event_to_change has no end, give it the start
        if (!de) {
            de = ds;
        }

        // change start and end dates
        event_to_change.start = dateChange(ds, dayDeltaStart, minuteDeltaStart);
        event_to_change.end = dateChange(de, dayDeltaEnd, minuteDeltaEnd);
    }

    // check to see if only the head is left in the repeatevent chain
    var events_behind = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == 'repeat' && e.sid == event.sid && e.start < event.start);
    });
    if (events_behind.length == 1) {
        // only the head is left, turn this into an event object
        var head = events_behind[0];
        head.type = 'event';
    }

    // render calendar
    calendar.fullCalendar("render");

    // make new event object to send along with old object
    var event_to_send = {};
    $.extend(event_to_send, event);

    // add fields for oldStart and oldEnd
    event_to_send['oldStart'] = oldStart;
    event_to_send['oldEnd'] = oldEnd;

    // update database and get back new sid for new repeatevent chain
    $.ajax(
        {
            type: "POST",
            url: "cal/edit_repeat",
            data:$.param(event_to_send),
            dataType: "text",
            success: function (data) {
                // check to see if response has a ',' meaning there are 2 sids to assign
                if (data.search(',') != -1) {
                    var ids = data.split(',');

                    // update sid of the head
                    head.sid = parseInt(ids[0]);

                    // update sid of event and events_to_change
                    event.sid = parseInt(ids[1]);

                    for (var key in events_to_change) {
                        events_to_change[key].sid = parseInt(ids[1]);
                    }
                }
                else {
                    // only update sid of event and events_to_change
                    event.sid = parseInt(data);

                    for (var key in events_to_change) {
                        events_to_change[key].sid = parseInt(data);
                    }
                }
            }
        }
    );


}

// removes "this only" from a repeat event
function break_repeat(event) {
    // remove from the calendar
    calendar.fullCalendar("removeEvents", event.id);
    calendar.fullCalendar("render");

    // update database
    console.log(event);
    makePOST('cal/break_repeat', event);
}

// NOT including the given event, turns all past events
// that were part of previous repeat event into events
function free_repeat(event) {
    // get all events that were part of previous repeat event
    var events = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == 'repeat' && e.sid == event.sid && e.start < event.start);
    });

    // free_repeat from database and update each event in events to match sid
    $.ajax(
        {
            type: "POST",
            url: "cal/free_repeat",
            data:$.param(event),
            dataType: "text",
            success: function (data) {
                console.log('csv: ' + data);
                // convert csv data into array of sids to be assigned to the events
                sids = data.split(',');

                // TODO!!! make this work blehhh
                for (var index in events)
                {
                    // change type
                    events[index].type = 'event';

                    // update allDay
                    events[index].allDay = event.allDay;

                    // give event an id
                    events[index].id = next_id;
                    next_id++;

                    // give event a sid
                    events[index].sid = parseInt(sids[index]);
                }
            }
        }
    );

}

// TODO! figure out how to pass a function into makePOST to be executed on success
/*
 * Takes in a url for the ajax POST request along with
 * the event Javascript object to be passed and makes the
 * appropriate ajax request with the data. Only used when
 * nothing needs to be done on success
 */
function makePOST(url, event) {
    $.ajax(
        {
            type: "POST",
            url: url,
            data:$.param(event),
            dataType: "text",
            success: function (data) {
                console.log(data);
            }
        }
    );
}

// function takes in an oldDate along with dayDelta and minuteDelta
// and returns a new Date with the changes applied
function dateChange(oldDate, dayDelta, minuteDelta) {
    var newDate = new Date(oldDate.getFullYear(),
        oldDate.getMonth(), oldDate.getDate()+ dayDelta,
        oldDate.getHours(), oldDate.getMinutes() + minuteDelta);

    // return new Date
    return newDate;
}

//
function getDayDelta(dateStart, dateEnd) {
    //Get 1 day in milliseconds
    var one_day=1000*60*60*24;

    // return the day difference
    return Math.ceil((s.getTime() - 60*60*1000*s.getHours() - 60*1000*s.getMinutes() -
        (t.getTime() - 60*60*1000*t.getHours() - 60*1000*t.getMinutes()))/(one_day));
}
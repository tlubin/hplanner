// magic number for how many times to repeat events
MAXREPEAT = 10;

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
            // clear the form
            clearEventForm();

            // populate the form
            drag_prepopulate(start, end, allDay);

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

                        // make event from field
                        var new_event = inputToEvent(start);
                        if (new_event) {

                            // Depending on which type of event we have here, enter it into the database with one of 2 functions
                            // These functions also set the sid's and render
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

            // clear the form
            clearEventForm();

            // populate the form
            click_prepopulate(calEvent);

            // save the various fields from the dialog as variables
            var $dialogContent = $("#event_edit_container");
            var titleField = $dialogContent.find("input[id='title']");
            var repeatBox = ($("#rrule").val() == '');
            // TODO: add fields that we need

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
                            if (repeatBox) {
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
                            if (!repeatBox) {
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
                                // check whether event is last in chain
                                if (lastRepeat(calEvent)) {
                                    // get oldStart and oldEnd
                                    var oldStart = calEvent.start;
                                    var oldEnd = calEvent.end;

                                    // if oldEnd is null, assign it as oldStart
                                    if (!oldEnd)
                                        oldEnd = oldStart;

                                    // update title and time
                                    calEvent.title = titleField.val();
                                    // TODO! update the start and end times

                                    edit_repeat(calEvent, oldStart, oldEnd);
                                }
                                else {
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
                // check whether event is last in chain
                if (lastRepeat(event)) {
                    // get oldStart and oldEnd
                    var newStart = event.start;
                    var newEnd = event.end;
                    if (!newEnd)
                        newEnd = newStart;
                    var oldStart = dateChange(newStart, -1 * dayDelta, -1 * minuteDelta);
                    var oldEnd = dateChange(newEnd, -1 * dayDelta, -1 * minuteDelta);

                    edit_repeat(event, oldStart, oldEnd);

                }
                else {
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
                // check whether event is last in chain
                if (lastRepeat(event)) {
                    // get newStart and newEnd
                    var oldStart = event.start;
                    var oldEnd = event.end;
                    if (!oldEnd)
                        oldEnd = oldStart;
                    var newStart = dateChange(oldStart, dayDelta, minuteDelta);
                    var newEnd = dateChange(oldEnd, dayDelta, minuteDelta);

                    edit_repeat(event, newStart, newEnd, allDay);
                }
                else {
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
    $("#title").val("");
    $("#start_datepicker").val("");
    $("#start_hour").val("");
    $("#start_min").val("");
    $("#start_ampm").val("AM");
    $("#end_datepicker").val("");
    $("#end_hour").val("");
    $("#end_min").val("");
    $("#end_ampm").val("AM");
    $("#allDay").attr('checked', false);
    $("#repeat_rule").val("");
    $("#repeat_datepicker").val("");
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

    // check to see if only the head is left in the repeatevent chain
    var events_behind = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == 'repeat' && e.sid == event.sid && e.start < oldStart && e.id != event.id);
    });
    console.log(events_behind);
    if (events_behind.length == 1) {
        // only the head is left, turn this into an event object
        var head = events_behind[0];
        head.type = 'event';
    }

    //  get each event with the same sid as this, and with a current or future date from the oldStart
    // this doesn't include the passed in event
    var events_to_change = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == event.type && e.sid == event.sid && e.start > oldStart && e.id != event.id);
    });

    // if editing the last in the chain
    if (events_to_change.length == 0) {
        // simply change type to 'event'
        event.type = 'event';
    }
    // move all future events by the deltas
    else {
        // calculate change in start and end times
        var dayDeltaStart = getDayDelta(oldStart, event.start);
        var minuteDeltaStart = (event.start.getHours() - oldStart.getHours())*60 +
            (event.start.getMinutes() - oldStart.getMinutes());

        // if event has no end, give it the start
        if (!event.end) {
            event.end = dateChange(event.start, 0, 120);
        }
        var dayDeltaEnd = getDayDelta(oldEnd, event.end);
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

            // if event_to_change has no end, give it the start plus 2 hours
            if (!de) {
                de = dateChange(ds, 0, 120);
            }

            // change start and end dates
            event_to_change.start = dateChange(ds, dayDeltaStart, minuteDeltaStart);
            event_to_change.end = dateChange(de, dayDeltaEnd, minuteDeltaEnd);
        }
    }

    // render calendar
    calendar.fullCalendar("render");

    // make new event object to send along with old object
    var event_to_send = {};
    $.extend(event_to_send, event);

    // add fields for oldStart and oldEnd
    event_to_send['oldStart'] = oldStart;

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

                    // update sid of event
                    event.sid = parseInt(ids[1]);

                    // update sids of events_to_change if there are any
                    if (events_to_change.length == 0) {
                        for (var key in events_to_change) {
                            events_to_change[key].sid = parseInt(ids[1]);
                        }
                    }
                }
                else {
                    // only update sid of event and events_to_change
                    event.sid = parseInt(data);

                    // update sids of events_to_change if there are any
                    if (events_to_change.length == 0) {
                        for (var key in events_to_change) {
                            events_to_change[key].sid = parseInt(ids[1]);
                        }
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
    var priors = calendar.fullCalendar('clientEvents', function(e) {
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
                for (var index in priors)
                {
                    // change type
                    priors[index].type = 'event';

                    // update allDay
                    priors[index].allDay = event.allDay;

                    // give event an id
                    priors[index].id = next_id;
                    next_id++;

                    // give event a sid
                    priors[index].sid = parseInt(sids[index]);
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

// checks whether the edited event object is the last in the repeat event chain
function lastRepeat(event) {
    // check to see if this is the last event in the repeat chain
    var events_ahead = calendar.fullCalendar('clientEvents', function(e) {
        return (e.type == 'repeat' && e.sid == event.sid && e.start > event.start);
    });

    return (events_ahead == 0);
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

// calculates and returns the integer difference in days between two dates (end - start)
function getDayDelta(start, end) {
    //Get 1 day in milliseconds
    var one_day=1000*60*60*24;

    // return the day difference
    return Math.ceil((end.getTime() - 60 * 60 * 1000 * end.getHours() - 60 * 1000 * end.getMinutes() -
        (start.getTime() - 60 * 60 * 1000 * start.getHours() - 60 * 1000 * start.getMinutes()))/(one_day));
}

// Convert a user's input (a slash_date, like 12/12/2012, and a time of day)
function toDatetime(slash_date, hr, min, ampm)
{

    var day_date = slash_date.split("/");
    hr = hr % 12;
    hr = (ampm == "AM") ? hr : hr + 12;


    var date_time = new Date(
        year = day_date[2],
        month = day_date[0] - 1,
        day = day_date[1],
        hour = hr,
        minute = min
    );
    return date_time;
}

//Convert from a datetime value to an array of stuff that can preopulate the edit event container
function fromDatetime(datetime)
{
    var slash_date = DatetimetoSlashdate(datetime)

    var hour = datetime.getHours();
    var ampm = (hour < 12) ? "AM" : "PM";
    hour = (ampm == "AM") ? hour : hour - 12;
    hour = (hour == 0) ? 12 : hour;
    hour.toString();
    var minutes = datetime.getMinutes();
    minutes = (minutes >= 10) ? minutes : '0'+minutes;
    minutes.toString();

    return [slash_date, hour, minutes, ampm]
}

// when someone clicks/drags on the calendar to make an event, populate the edit event container with their input
function drag_prepopulate(start, end, allDay)
{
    var start_array = fromDatetime(start);

    $("#start_datepicker").val(start_array[0]);
    $("#start_hour").val( start_array[1]);
    $("#start_min").val(start_array[2]);
    $("#start_ampm").val(start_array[3]);

    if (end)
    {
        var end_array = fromDatetime(end);
        $("#end_datepicker").val(end_array[0]);
        $("#end_hour").val(end_array[1]);
        $("#end_min").val(end_array[2]);
        $("#end_ampm").val(end_array[3]);
    }

    if (allDay)
        $("#allDay").attr('checked', true);
}

// prepopulate the edit event box when someone clicks on an event to edit it
function click_prepopulate(calEvent)
{
    $("#title").val(calEvent.title);
    // TODO: prepopulate the repeat rule and repeat end date
//    $("#rrule").val(calEvent.rrule);
//    $("#repeat_datepicker").val(calEvent.end_repeat OR SOMETHING LIKE THAT);

    drag_prepopulate(calEvent.start, calEvent.end, calEvent.allDay);
}

// creates an event object from the edit event form, even when user does dumb things
// returns null on no title inputted
function inputToEvent(start) {

    // get title
    var title = $("#title").val();

    // make sure title exists
    if (!title)
        return null;

    // get allDay
    var allDay = $("#allDay").is(':checked');

    // get rrule
    var rrule = $("#repeat_rule").val();

    // give type based on whether rrule exists
    var type = (rrule) ? 'repeat' : 'event';

    // get endRepeat if there is an rrule
    var endRepeat = $("#repeat_datepicker").val();



    // get start time data
    var start_date = $("#start_datepicker").val();
    var start_hour = parseInt($("#start_hour").val());
    var start_min = parseInt($("#start_min").val());
    var start_ampm = $("#start_ampm").val();

    // get end time data
    var end_date = $("#end_datepicker").val();
    var end_hour = parseInt($("#end_hour").val());
    var end_min = parseInt($("#end_min").val());
    var end_ampm = $("#end_ampm").val();


    // check the start and end inputs, set to certain defaults if the user was dumb

    // if they don't give a start date, make it the original start date
    if (! start_date)
        start_date = DatetimetoSlashdate(start);
    // if all we have is a start date and minutes, make the event at midnightt
    if (! start_hour) {
        start_hour = 12;
        start_min = 0;
        start_ampm = "AM";
    }
    // if we have a start hour but no minutes, give zero minutes
    else if (start_hour)
        start_min = 0;

    // same business for end inputs
    if (! end_date)
        end_date = DatetimetoSlashdate(end);
    if (! end_hour) {
        end_hour = 12;
        end_min = 0;
        end_ampm = "AM";
    }
    else if (end_hour)
        end_min = 0;

    // Now we can finally convert these to actual datetimes
    // get start
    var start_datetime = toDatetime( start_date, start_hour, start_min, start_ampm);

    // get end
    var end_datetime = toDatetime( end_date, end_hour, end_min, end_ampm);


    // handle the cases where the end is before the start
    if (end_datetime < start_datetime)
    {
        end_datetime = dateChange(start_datetime, 120);
    }
    // if start and end time are the same, let's say it's implied that we have an allDay event
    if (end_datetime == start_datetime)
        allDay = true;


    // create the event
    var event = {
        title: title,
        start: start_datetime,
        end: end_datetime,
        allDay: allDay,
        type: type,
        id: next_id,
        rrule: rrule,
        endRepeat: endRepeat
    };
    next_id++;

    return event;
}

function DatetimetoSlashdate(datetime)
{
    var year = datetime.getFullYear();
    var month = datetime.getMonth() + 1;
    var day = datetime.getDate();
    year.toString();
    month.toString();
    day.toString();
    var slash_date = month+'/'+day+'/'+year;

    return slash_date;
}
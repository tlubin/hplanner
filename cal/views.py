from django.core import serializers
from cal.models import Event, RepeatEvent, BreakEvent
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from notification.models import Note
import datetime
import re
import itertools


# ------------------------------------------------------------------------
# Gets events, and RepeatEvents from the user's database. Merges them into
# one json and sends the result
# ------------------------------------------------------------------------
def get_events(request):
    if request.is_ajax():
        # get events for user
        user = request.user
        events = user.event_set.all()
        repeat_events = user.repeatevent_set.all()
        all_events = itertools.chain(events, repeat_events)

        # convert event data to JSON
        json_data = serializers.serialize('json', all_events, use_natural_keys=True)
        return HttpResponse (json_data, mimetype='application/json')
    else:
        return HttpResponseRedirect('/')


# ------------------------------------------------------------------------
# Adds Event object to database. Returns the id given to the new object.
# ------------------------------------------------------------------------
@csrf_exempt
def add_event(request):
    if request.method == 'POST':
        # get new event data
        user = request.user
        title = request.POST['title']
        start = strToDateTime(request.POST['start'])
        end = strToDateTime(request.POST['end'])
        allDay = True if (request.POST['allDay'] == 'true') else False

        # make new event and save
        event = Event(
            user = user,
            title=title,
            start=start,
            end=end,
            allDay=allDay
        )
        event.save()

        # return the id of the new event
        return HttpResponse(str(event.id))
    else:
        return HttpResponseRedirect('/')



# ------------------------------------------------------------------------
# Adds RepeatEvent object to database. Returns the id given to the new object.
# ------------------------------------------------------------------------
@csrf_exempt
def add_repeat(request):
    if request.method == 'POST':
        # get new event data
        user = request.user
        title = request.POST['title']
        start = strToDateTime(request.POST['start'])
        end = strToDateTime(request.POST['end'])
        allDay = True if (request.POST['allDay'] == 'true') else False
        rrule = int(request.POST['rrule'])
        endRepeat = strToDateTime(request.POST['endRepeat'])
        print request.POST['endRepeat']
        print endRepeat

        # make new RepeatEvent and save
        event = RepeatEvent(
            user = user,
            title=title,
            start=start,
            end=end,
            allDay=allDay,
            endRepeat = endRepeat,
            rrule = rrule
        )
        event.save()

        # return the id of the new event
        return HttpResponse(str(event.id))
    else:
        return HttpResponseRedirect('/')


# ------------------------------------------------------------------------
# Remove Event object from database
# ------------------------------------------------------------------------
@csrf_exempt
def delete_event(request):
    if request.method == 'POST':
        # get event id
        user = request.user
        id = request.POST['sid']

        # delete event
        user.event_set.get(pk = id).delete()
        return HttpResponse("Okay")
    else:
        return HttpResponseRedirect('/')


# ------------------------------------------------------------------------
# Has the effect of deleting the current and future events from a RepeatEvent
# chain. In the database it simply adds an end date on the RepeatEvent unless
# the end date is the head, in which case it deletes the RepeatEvent. Also
# handles the case when there is only one event left behind, converting this
# to an Event object and sending the id as the result
# ------------------------------------------------------------------------
@csrf_exempt
def delete_repeat(request):
    if request.method == 'POST':
        # get event id and user
        user = request.user
        id = request.POST['sid']
        date = strToDateTime(request.POST['start'])

        # get type to deal with case of free repeat on second to last
        type = request.POST['type']

        # container for httpresponse
        idreturn = ''

        # get RepeatEvent object
        repeat = user.repeatevent_set.get(pk = id)

        # check whether date is at the head
        # special case of type change on the second from the head of repeat event (type is event)
        if date == repeat.start or type == 'event':
            # delete RepeatEvent
            repeat.delete()

        # check if you are one past the head
        elif oneBack(date, repeat) == repeat.start:
            # make the head into a new Event object
            event = Event(
                user = user,
                title=repeat.title,
                start=repeat.start,
                end=repeat.end,
                allDay=repeat.allDay
            )
            event.save()

            # save id to return
            idreturn = str(event.id)

            # delete RepeatEvent
            repeat.delete()
        # not head and not one past head
        else:
            # set end date to one instance back of the passed in date
            end = oneBack(date, repeat)
            # update repeat and save
            repeat.endRepeat = end
            repeat.save()

        # return id or ''
        return HttpResponse(idreturn)
    else:
        return HttpResponseRedirect('/')




# ------------------------------------------------------------------------
# Called only when an Event object is edited. Update the fields for the event
# in the database.
# ------------------------------------------------------------------------
@csrf_exempt
def edit_event(request):
    if request.method == 'POST':
        # get new event data
        user = request.user
        id = request.POST['sid']
        title = request.POST['title']
        start = strToDateTime(request.POST['start'])
        end = strToDateTime(request.POST['end'])
        allDay = True if (request.POST['allDay'] == 'true') else False

        # get event to update
        event = user.event_set.get(pk = id)

        # update elements and save
        event.title = title
        event.start = start
        event.end = end
        event.allDay = allDay
        event.save()

        return HttpResponse("Okay")
    else:
        return HttpResponseRedirect('/')


# ------------------------------------------------------------------------
# Called when a RepeatEvent is edited and applied to all future events.
# Must be given the new event information along with the old start date.
# Takes care of appropriately updating the old repeat event and making a new
# repeat event while handling corner cases of last in chain and leaving only head.
# Return ids of all instances that are created.
# ------------------------------------------------------------------------
@csrf_exempt
def edit_repeat(request):
    if request.method == 'POST':
        # get passed in data
        user = request.user
        id = request.POST['sid']
        oldStart = strToDateTime(request.POST['oldStart'])
        newStart = strToDateTime(request.POST['start'])
        newEnd = strToDateTime(request.POST['end'])
        type = request.POST['type']
        endRepeat = request.POST['endRepeat']

        # handle datatype conversions
        if endRepeat == 'null':
            endRepeat = None

        # get old RepeatEvent object
        repeat = user.repeatevent_set.get(pk = id)
        breaks = repeat.breaks.all()
        oldEndRepeat = repeat.endRepeat

        # get break events to move to new repeatevent
        breaks_new = []
        for br in breaks:
            if br.date > oldStart:
                # remove from old repeat
                repeat.breaks.remove(br)
                # add to breaks_new array
                breaks_new.append(br)

        # container to hold httpresponse of ids
        ids = ''

        # check whether oldStart is the head
        if oldStart == repeat.start:
            # delete old RepeatEvent
            repeat.delete()

        # check if you are one past the head
        elif oneBack(oldStart, repeat) == repeat.start:
            # make the head of the old RepeatEvent into a new Event object
            event = Event(
                user = user,
                title=repeat.title,
                start=repeat.start,
                end=repeat.end,
                allDay=repeat.allDay
            )
            event.save()

            # add id to container
            ids = str(event.id) + ','

            # delete old RepeatEvent
            repeat.delete()

        # otherwise
        else:
            # set end date of old RepeatEvent to one instance back of the passed in date
            end = oneBack(oldStart,repeat)
            # update old RepeatEvent and save
            repeat.endRepeat = end
            repeat.save()


        # create new Event object if you edited the last in the chain
        # could be editing last in chain and making it a new rrule
        if type == 'event':
            tail = Event(
                user = user,
                title=request.POST['title'],
                start=newStart,
                end=newEnd,
                allDay=request.POST['allDay']
            )
            tail.save()

            # add id to container
            ids += str(tail.id)

        # create new RepeatEvent object otherwise
        else:
            new_repeat = RepeatEvent(
                user = user,
                title=request.POST['title'],
                start=newStart,
                end=newEnd,
                allDay=request.POST['allDay'],
                rrule = int(request.POST['rrule']),
                endRepeat = endRepeat
            )
            new_repeat.save()

            # add id to container
            ids += str(new_repeat.id)

            # move breaks and endRepeat to new chain by delta
            delta = newStart - oldStart
            for br in breaks_new:
                br.date += delta
                br.save()
                new_repeat.breaks.add(br)
            if (oldEndRepeat):
                new_repeat.endRepeat = oldEndRepeat + delta
                new_repeat.save()

        # '3' OR '1,3' where first number is the event id for the head and second is id of new RepeatEvent / Event (if last moved is tail)
        return HttpResponse(ids)
    else:
        return HttpResponseRedirect('/')



# ------------------------------------------------------------------------
# Called for a RepeatEvent object when 'just this' date is deleted. Simply
# adds a BreakEvent for the RepeatEvent current object
# ------------------------------------------------------------------------
@csrf_exempt
def break_repeat(request):
    if request.method == 'POST':
        # get event id
        user = request.user
        id = request.POST['sid']
        date = strToDateTime(request.POST['start'])

        # get the RepeatEvent object
        repeat = user.repeatevent_set.get(pk = id)

        # add a BreakEvent to repeat
        new_break = BreakEvent(date=date)
        new_break.save()
        repeat.breaks.add(new_break)

        return HttpResponse("Okay")
    else:
        return HttpResponseRedirect('/')



# ------------------------------------------------------------------------
# NOT including the present object, this converts a RepeatEvent object from its
# head until the inputted date into all Event objects. Returns csv of new ids
# from head to tail
# ------------------------------------------------------------------------
@csrf_exempt
def free_repeat(request):
    if request.method == 'POST':
        # get passed in data
        user = request.user
        event_start = strToDateTime(request.POST['start']) # last date to free (starting from head)
        event_end = strToDateTime(request.POST['end'])
        id = request.POST['sid']
        title = request.POST['title']
        allDay = True if (request.POST['allDay'] == 'true') else False
        rrule = int(request.POST['rrule'])

        # calculate the event length if an end exists
        if event_end:
            event_length = event_end - event_start

        # get the old RepeatEvent object
        repeat = user.repeatevent_set.all().get(pk = id)
        head = repeat.start
        rruleOld = repeat.rrule;

        # format the breaks array
        breaks = []
        for _break in repeat.breaks.all():
            breaks.append(_break.date)

        # delete the old RepeatEvent object
        repeat.delete()

        # loop from head to event_start, making new Event objects
        cursor = head
        ids = ''
        while cursor < event_start:
            # check if current date is a break
            if cursor in breaks:
                continue

            # make new event and save
            event = Event(
                user=user,
                title=title,
                start=cursor,
                end=cursor,
                allDay=allDay
            )

            # add length of event if it exists
            if event_end:
                event.end += event_length

            # save the event
            event.save()

            # add id to ids csv string
            ids += str(event.id) + ','

            # move cursor
            cursor = oneForward(cursor, rruleOld)

        # remove last comma
        ids = ids[:-1]

        return HttpResponse(ids)
    else:
        return HttpResponseRedirect('/')



# ------------------------------------------------------------------------
# Takes client side input and shares an event with one or more users
# ------------------------------------------------------------------------
@csrf_exempt
def share_event(request):

    if request.method == 'POST':
        # unload the sent data
        to_user = request.POST["user"]
        title = request.POST["title"]
        start = strToDateTime(request.POST["start"])
        end = strToDateTime(request.POST["end"])
        allDay = True if (request.POST["allDay"] == "true") else False
        type = request.POST["type"]
        rrule = request.POST["rrule"]
        endRepeat = strToDateTime(request.POST["endRepeat"])

        # convert 'null' to None where needed

        # get the actual user
        user = User.objects.filter(username = to_user)[0]

        # handle if non-repeating event
        if type == "event":
            shared_event = Event(
                user = user,
                title = title,
                start = start,
                end = end,
                allDay = allDay
            )

        # handle if repeating event
        else:
            shared_event = RepeatEvent(
                user = user,
                title = title,
                start = start,
                end = end,
                allDay = allDay,
                rrule =  rrule,
                endRepeat = endRepeat
            )

        # save the shared event
        shared_event.save()

        # leave a message for whoever we shared with
        slash_date = str(start.month) + "/" + str(start.day) + "/" + str(start.year)[2] + str(start.year)[3]
        repeat_message = "an" if (type == "event") else "a repeating"
        start_message = "" if (type == "event") else "starting "
        message = request.user.username + " added " + repeat_message + " event to your calendar " + start_message + "on " + slash_date
        note = Note(
            user = user,
            message = message
        )
        note.save()

        return HttpResponse ("event shared")
    else:
        return HttpResponseRedirect('/')



# ------------------------------------------------------------------------
# Takes in string with format "Fri Nov 16 2012 00:00:00 GMT-0500 (EST)"
# and converts it to a DateTime object. Returns None on no match
# ------------------------------------------------------------------------
def strToDateTime(string):
    # pattern to strip "GMT-0500 (EST)"
    pattern = re.compile('.*\d{2}:\d{2}:\d{2}')

    # Return datetime object upon match, otherwise None
    if pattern.search(string):
        string2 = pattern.search(string).group(0)
        return datetime.datetime.strptime(string2, "%a %b %d %Y %H:%M:%S")
    else:
        return None


# ------------------------------------------------------------------------
# Functions that take in a DateTime object and return a DateTime object of
# the next or previous date according to a given RepeatEvent object's breaks
# or rrule
# ------------------------------------------------------------------------
def oneBack(date, repeat):
    breaks = list(repeat.breaks.all())
    breakdates = []
    for _break in breaks:
        breakdates.append(_break.date)

    rrule = repeat.rrule

    # get first date back that isn't a break
    previous = date - datetime.timedelta(days=rrule) # based on rrule
    while (previous in breakdates):
        previous = previous - datetime.timedelta(days=rrule)

    return previous

def oneForward(date, rrule):
    # return the next date according to the repeat rule
    # doesn't have to deal with breaks because of the way it is
    # implemented when oneForward is called
    return date + datetime.timedelta(days=rrule)
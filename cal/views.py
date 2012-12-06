from django.core import serializers
from cal.models import Event, RepeatEvent, BreakEvent
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
import re
import itertools


# ------------------------------------------------------------------------
# Gets events, and repeatEvents from the user's database. Merges them into
# one json and sends the result
# ------------------------------------------------------------------------
def get_events(request):
    # get events for user
    user = request.user
    events = user.event_set.all()
    repeat_events = user.repeatevent_set.all()
    all_events = itertools.chain(events, repeat_events)

    # convert event data to JSON
    json_data = serializers.serialize('json', all_events)
    print json_data
    return HttpResponse (json_data, mimetype='application/json')


# ------------------------------------------------------------------------
# Adds event to database. Checks type and adds to the appropriate database.
# Returns the id given to the new object.
# ------------------------------------------------------------------------
@csrf_exempt
def add_event(request):
    # get new event data
    user = request.user
    title = request.POST['title']
    start = strToDateTime(request.POST['start'])
    end = strToDateTime(request.POST['end'])
    allDay = True if (request.POST['allDay'] == 'true') else False

    # Event object
    if request.POST['type'] == 'event':
        # make new event and save
        event = Event(
            user = user,
            title=title,
            start=start,
            end=end,
            allDay=allDay
        )
        event.save()
    # RepeatEvent object
    elif request.POST['type'] == 'repeatevent':
        # make new RepeatEvent and save
        event = RepeatEvent(
            user = user,
            title=title,
            start=start,
            end=end,
            allDay=allDay
        )
        event.save()
    # return the id of the new event
    return HttpResponse(str(event.id))


# ------------------------------------------------------------------------
# Called only when an Event object is updated. Update the fields for the event
# in the database.
# ------------------------------------------------------------------------
@csrf_exempt
def update_event(request):
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


# ------------------------------------------------------------------------
# Called for Event object and when repeatEvent object is deleted and
# "apply to all future" is selected. For Event object, simply remove from database.
# For repeatEvent, add an end date on the repeatEvent object in the database.
# ------------------------------------------------------------------------
@csrf_exempt
def remove_event(request):
    # get event id
    user = request.user
    id = request.POST['sid']

    # Event
    if request.POST['type'] == 'event':
        user.event_set.get(pk = id).delete()
    # RepeatEvent
    elif request.POST['type'] == 'repeatevent':
        # TODO: make past events into a RepeatEvent with an end_date
        user.repeatevent_set.get(pk = id).delete()

    return HttpResponse("Okay")

# ------------------------------------------------------------------------
# Called only for a RepeatEvent object when 'just this' is selected. Simply
# add a BreakEvent for the RepeatEvent current object
# ------------------------------------------------------------------------
@csrf_exempt
def break_delete(request):
    # get event id
    user = request.user
    id = request.POST['sid']
    date = request.POST['start']

    # get the RepeatEvent object
    repeat = user.repeatevent_set.get(pk = id)

    # add a BreakEvent to repeat
    new_break = BreakEvent(date=date, headEvent=repeat)
    new_break.save()

    return HttpResponse("Okay")

# ------------------------------------------------------------------------
# Called for a RepeatEvent object only. Must be given event_orig and event_new
# for the event that was edited. Add an end date on the RepeatEvent object based
# on the event_orig date. Then create a new RepeatEvent object based on the event_new
# date.
# ------------------------------------------------------------------------
@csrf_exempt
def update_repeat(request):
    # TODO: IMPLEMENT!!
    return HttpResponse("Okay")

# ------------------------------------------------------------------------
# Called for a RepeatEvent object only. Must be given event_orig and event_new
# for the event that was edited. Add a BreakEvent at the event_orig date for
# the RepeatEvent object. Then create a new Event object based on the info
# from the event_new.
# ------------------------------------------------------------------------
@csrf_exempt
def break_edit(request):
    # TODO: IMPLEMENT!!
    return HttpResponse("Okay")



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
        return datetime.strptime(string2, "%a %b %d %Y %H:%M:%S")
    else:
        return None
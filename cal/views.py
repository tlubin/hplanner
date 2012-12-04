from django.core import serializers
from cal.models import Event
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
import re


def get_events(request):
    # get events for user
    user = request.user
    events = user.event_set.all()

    # convert event data to JSON
    json_data = serializers.serialize('json', events)
    return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_event(request):
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

@csrf_exempt
def update_event(request):
    # get new event data
    user = request.user
    id = request.POST['id']
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

@csrf_exempt
def remove_event(request):
    # get event id
    user = request.user
    id = request.POST['id']

    # get event and delete
    user.event_set.get(pk = id).delete()

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
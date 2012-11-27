from django.core import serializers
from cal.models import Event
from django.http import HttpResponse


def get_events(request):
    # get events for user
    events = Event.objects.all()

    if request.is_ajax():
        #Prepares a JSON "message" to send back of the slug
        json_data = serializers.serialize('json', events)
        return HttpResponse (json_data, mimetype='application/json')


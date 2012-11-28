from django.core import serializers
from cal.models import Event
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt



def get_events(request):
    # get events for user
    events = Event.objects.all()

    if request.is_ajax():
        #Prepares a JSON "message" to send back of the slug
        json_data = serializers.serialize('json', events)
        return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_event(request):
    print request.POST
#    event = request.POST
#    event.save()
    return HttpResponse("TEST")
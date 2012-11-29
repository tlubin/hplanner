from django.core import serializers
from to_do.models import Task
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt



def get_tasks(request):
    # get tasks for user
    tasks = Task.objects.all()

    if request.is_ajax():
        #Prepares a JSON "message" to send back of the slug
        json_data = serializers.serialize('json', tasks)
        return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_task(request):
    print request.POST
    #    event = request.POST
    #    event.save()
    return HttpResponse("TEST")
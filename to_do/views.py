from django.core import serializers
from to_do.models import Task
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone


def get_tasks(request):

    # get tasks for user
    tasks = Task.objects.all()

    #Prepares a JSON "message" to send back to the browser
    json_data = serializers.serialize('json', tasks)
    return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_task(request):

    # make new event and save
    task = Task(
        title=request.POST["title"],
        # TODO set this up really time stuff
        due_date= timezone.now()
        # TODO include user id
    )

    task.save()

    return HttpResponse(task.id)


@csrf_exempt
def remove_task(request):

    # get the id of the to_do we want to get rid of
    id_to_remove = request.POST["id"]
    print id_to_remove

    # fetch that task and delete it
    task = Task.objects.get(id=id_to_remove)
    task.delete()

    return HttpResponse("task removed")


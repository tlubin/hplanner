from django.core import serializers
from to_do.models import Task, TaskManager
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@csrf_exempt
def update_order(request):

    # clear the ordering
    TaskManager.objects.all().delete()


    # make new ordering and save it
    ordering = TaskManager(order = request.POST["text"])
    print ordering
    ordering.save()

    return HttpResponse("order saved")


def get_tasks(request):

    # get tasks for user
    tasks = Task.objects.all()

    # send back a json message of it
    json_data = serializers.serialize('json', tasks)
    return HttpResponse (json_data, mimetype='application/json')

def get_order(request):
    # get task order
    order = TaskManager.objects.filter(pk=1)

    # send back a json message of it
    json_data = serializers.serialize('json', order)
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

    # fetch that task and delete it
    task = Task.objects.get(id=id_to_remove)
    task.delete()

    return HttpResponse("task removed")


from django.core import serializers
from to_do.models import Task, TaskManager
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@csrf_exempt
def update_order(request):

    # clear the ordering
    user = request.user
    user.taskmanager_set.all().delete()

    # make new ordering and save it
    ordering = TaskManager(user = user, order = request.POST["text"])
    print ordering
    ordering.save()

    return HttpResponse("order saved")


def get_tasks(request):

    # get tasks for user
    user = request.user
    tasks = user.task_set.all()

    # send back a json message of it
    json_data = serializers.serialize('json', tasks)
    return HttpResponse (json_data, mimetype='application/json')

def get_order(request):
    # get task order
    user = request.user
    order = user.taskmanager_set.all()

    # send back a json message of it
    json_data = serializers.serialize('json', order)
    return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_task(request):

    # make new event and save
    task = Task(
        title=request.POST["title"],
        user = request.user,
        # TODO set this up really time stuff
    )

    task.save()
    return HttpResponse(task.id)


@csrf_exempt
def remove_task(request):

    # get the id of the to_do we want to get rid of
    user = request.user
    id_to_remove = request.POST["id"]

    # fetch that task and delete it
    user.task_set.get(id=id_to_remove).delete()

    return HttpResponse("task removed")


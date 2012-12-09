from django.core import serializers
from to_do.models import Task, TaskManager
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@csrf_exempt
def update_order(request):
    if request.method == 'POST':
        # clear the ordering
        user = request.user
        user.taskmanager_set.all().delete()

        # make new ordering and save it
        ordering = TaskManager(user = user, order = request.POST["text"])
        print ordering
        ordering.save()

        return HttpResponse("order saved")
    else:
        return HttpResponseRedirect('/')


def get_tasks(request):
    if request.is_ajax():
        # get tasks for user
        user = request.user
        tasks = user.task_set.all()

        # send back a json message of it
        json_data = serializers.serialize('json', tasks)
        return HttpResponse (json_data, mimetype='application/json')
    else:
        return HttpResponseRedirect('/')


def get_order(request):
    if request.is_ajax():
        # get task order
        user = request.user
        order = user.taskmanager_set.all()

        # send back a json message of it
        json_data = serializers.serialize('json', order)
        return HttpResponse (json_data, mimetype='application/json')
    else:
        return HttpResponseRedirect('/')


@csrf_exempt
def add_task(request):
    if request.method == 'POST':

        # make new event and save
        task = Task(
            title=request.POST["title"],
            user = request.user,
            # TODO set this up really time stuff
        )

        task.save()
        return HttpResponse(task.id)
    else:
        return HttpResponseRedirect('/')


@csrf_exempt
def remove_task(request):
    if request.method == 'POST':

        # get the id of the to_do we want to get rid of
        user = request.user
        id_to_remove = request.POST["id"]

        # fetch that task and delete it
        user.task_set.get(id=id_to_remove).delete()

        return HttpResponse("task removed")
    else:
        return HttpResponseRedirect('/')



from django.core import serializers
from categories.models import Cat
from cal.models import Event
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


def get_cats(request):

    # get categories for user
    user = request.user
    cats = user.cat_set.all()

    # send back a json message of it
    json_data = serializers.serialize('json', cats)
    return HttpResponse (json_data, mimetype='application/json')

@csrf_exempt
def add_cat(request):

    # make new category and save
    cat = Cat(
        title = request.POST["title"],
        user = request.user,
        # put in some color
    )

    cat.save()
    return HttpResponse(cat.id) #also return a color


@csrf_exempt
def remove_cat(request):

    # TODO change back all the events with this category to the default category


    # get the id of the category we want to get rid of
    user = request.user
    id_to_remove = request.POST["id"]

    # fetch that one and delete it
    user.cat_set.get(id=id_to_remove).delete()

    return HttpResponse("category removed")
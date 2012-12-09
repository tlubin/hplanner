from django.core import serializers
from notification.models import Note
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt



def get_notes(request):
    if request.is_ajax():
        # get notes for user
        user = request.user
        notes = user.note_set.all()

        # convert note data to JSON
        json_data = serializers.serialize('json', notes)
        return HttpResponse (json_data, mimetype='application/json')
    else:
        return HttpResponseRedirect('/')


@csrf_exempt
def remove_note(request):
    if request.method == 'POST':
        # get note id
        id = request.POST['id']

        # get note and delete
        note = Note.objects.get(pk = id)
        note.delete()

        return HttpResponse("Note deleted")
    else:
        return HttpResponseRedirect('/')

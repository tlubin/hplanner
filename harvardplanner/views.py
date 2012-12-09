from django.shortcuts import render_to_response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt


def home(request):
    if request.user.is_authenticated():
        # user is valid
        return render_to_response('home.html')
    else:
        # redirect to login
        return HttpResponseRedirect('/login')

def login_view(request):
    return render_to_response('login.html')

@csrf_exempt
def login_check(request):
    username = request.POST['username']
    pword = request.POST['password']
    user = authenticate(username=username, password=pword)
    if user is not None:
        # log the user in to set the session id global
        login(request, user)
        # Success!
        return HttpResponse('success')
    else:
        return HttpResponse("invalid login")

def logout_view(request):
    logout(request)
    # Redirect to login page
    return HttpResponseRedirect('/login')

@csrf_exempt
def register(request):
    username = request.POST['username']
    pword = request.POST['password']

    print username
    print pword
    # register the new user
    try:
        User.objects.create_user(username, password=pword)
        # log user in
        user = authenticate(username=username, password=pword)
        login(request, user)
        # Success!
        return HttpResponse('success')
    except:
        return HttpResponse('failure')


# ------------------------------------------------------------------------
# Returns all the User objects. Used for autocomplete in sharing.
# ------------------------------------------------------------------------
def get_users(request):
    # get all the users
    users = User.objects.all()

    # exclude the current user
    users = users.exclude(username=request.user.username)

    # convert user data to JSON
    json_data = serializers.serialize('json', users)
    return HttpResponse (json_data, mimetype='application/json')



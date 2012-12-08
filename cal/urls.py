from django.conf.urls import patterns, include, url

urlpatterns = patterns('cal.views',

    # get events when page is loaded
    url(r'^get_events', 'get_events'),

    # adding event or repeat event
    url(r'^add_event', 'add_event'),
    url(r'^add_repeat', 'add_repeat'),

    # deleting event or repeat event
    url(r'^delete_event', 'delete_event'),
    url(r'^delete_repeat', 'delete_repeat'),

    # editing event or repeat event
    url(r'^edit_event', 'edit_event'),
    url(r'^edit_repeat', 'edit_repeat'),

    # for repeat events, adding break / converting past to events
    url(r'^break_repeat', 'break_repeat'),
    url(r'^free_repeat', 'free_repeat'),
)
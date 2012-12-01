from django.conf.urls import patterns, include, url

urlpatterns = patterns('cal.views',
    url(r'^get_events', 'get_events'),
    url(r'^add_event', 'add_event'),
    url(r'^update_event', 'update_event'),
    url(r'^remove_event', 'remove_event'),
)
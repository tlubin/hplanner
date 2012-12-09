from django.conf.urls import patterns, include, url

urlpatterns = patterns('notification.views',
    url(r'^get_notes', 'get_notes'),
    url(r'^remove_note', 'remove_note'),
)
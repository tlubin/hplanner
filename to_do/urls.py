from django.conf.urls import patterns, include, url

urlpatterns = patterns('to_do.views',
    url(r'^get_tasks', 'get_tasks'),
    url(r'^add_task', 'add_task'),
    url(r'^remove_task', 'remove_task')
)
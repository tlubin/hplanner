from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # TODO: abstract out the urls for the calendar into its own urls.py
    url(r'^$', 'harvardplanner.views.home'),
    url(r'^get_events', 'cal.views.get_events'),
    url(r'^add_event', 'cal.views.add_event'),
    url(r'^update_event', 'cal.views.update_event'),
    url(r'^remove_event', 'cal.views.remove_event'),
    url(r'^get_tasks', 'to_do.views.get_tasks'),
    url(r'^add_task', 'to_do.views.add_task'),
    url(r'^remove_task', 'to_do.views.remove_task'),

    # url(r'^harvardplanner/', include('harvardplanner.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)

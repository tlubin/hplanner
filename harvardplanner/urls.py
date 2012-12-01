from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # main page!
    url(r'^$', 'harvardplanner.views.home'),

    # url patterns for user authentication
    url(r'^login$', 'harvardplanner.views.login_view'),
    url(r'^login_check$', 'harvardplanner.views.login_check'),
    url(r'^logout$', 'harvardplanner.views.logout_view'),
    url(r'^register$', 'harvardplanner.views.register'),

    # calendar urls
    url(r'^cal/', include('cal.urls')),

    # to_do urls
    url(r'^todo/', include('to_do.urls')),

)
from django.conf.urls import patterns, include, url

urlpatterns = patterns('categories.views',
    url(r'^get_cats', 'get_cats'),
    url(r'^add_cat', 'add_cat'),
    url(r'^remove_cat', 'remove_cat'),
)
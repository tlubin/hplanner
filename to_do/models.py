from django.db import models
from django.contrib.auth.models import User

#the following copied from cal/:
#each person is going to have a to_do
#class to_do
#TODO use ForeignKey to link events to a calendar

# http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
class Task(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length = 200)
    due_date = models.DateTimeField(null = True)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.title)

class TaskManager(models.Model):
    user = models.ForeignKey(User)
    order = models.CommaSeparatedIntegerField(max_length=100, null = True)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.order)
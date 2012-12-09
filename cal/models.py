from django.db import models
from django.contrib.auth.models import User

# http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
class Event(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length = 200)
    allDay = models.NullBooleanField()
    start = models.DateTimeField()
    end = models.DateTimeField(null = True)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.title)

class BreakEvent(models.Model):
    date = models.DateTimeField()
    def __unicode__(self):
        return u'%s' % (self.date)
    def natural_key(self):
        return (self.date)


class RepeatEvent(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length = 200)
    allDay = models.NullBooleanField()
    start = models.DateTimeField()
    end = models.DateTimeField(null = True)
    endRepeat = models.DateTimeField(null = True)
    rrule = models.PositiveSmallIntegerField()
    breaks = models.ManyToManyField(BreakEvent)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.title)


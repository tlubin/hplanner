from django.db import models

#each person is going to have a calendar
#class Calendar
#TODO use ForeignKey to link events to a calendar
#TODO blank = True isn't doing anything, maybe use NULL?

# http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
class Event(models.Model):
    title = models.CharField(max_length = 200)
    allDay = models.NullBooleanField()
    start = models.DateTimeField()
    end = models.DateTimeField(null = True)
    def __unicode__(self):
        return self.title
        # TODO group for event, user id, repeat
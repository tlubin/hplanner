from django.db import models

#the following copied from cal/:
#each person is going to have a to_do
#class to_do
#TODO use ForeignKey to link events to a calendar
#TODO blank = True isn't doing anything, maybe use NULL?

# http://arshaw.com/fullcalendar/docs/event_data/Event_Object/
class Task(models.Model):
    title = models.CharField(max_length = 200)
    due_date = models.DateTimeField(blank = True)
    def __unicode__(self):
        return self.title
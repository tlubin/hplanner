from django.contrib.auth.models import User
from django.db import models

#each person is going to have a list of notification

class Note(models.Model):
    user = models.ForeignKey(User)
    message = models.CharField(max_length = 200)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.message)
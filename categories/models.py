from django.db import models
from django.contrib.auth.models import User

# here's the model for a calendar category:
class Cat(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length = 20)
    color = models.CharField(max_length = 6)
    def __unicode__(self):
        return u'%s %s' % (self.user, self.title)
from django.contrib.auth.models import User, UserManager
from django.db import models


class CustomUser(User):
    # custom user fields
    color = models.CharField(max_length=50)

    # Use UserManager to get the create_user method, etc.
    objects = UserManager()

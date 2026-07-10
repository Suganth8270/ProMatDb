from django.db import models

class Biomaterial(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    source = models.CharField(max_length=200)
    description = models.TextField()
    applications = models.TextField()

    def __str__(self):
        return self.name
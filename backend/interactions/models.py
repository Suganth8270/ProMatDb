from django.db import models
from proteins.models import Protein
from biomaterials.models import Biomaterial


class Interaction(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    biomaterial = models.ForeignKey(Biomaterial, on_delete=models.CASCADE)
    binding_energy = models.FloatField()
    docking_score = models.FloatField()
    interaction_type = models.CharField(max_length=100)
    reference = models.TextField()

    def __str__(self):
        return f"{self.protein} - {self.biomaterial}"
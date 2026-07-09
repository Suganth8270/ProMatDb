from django.db import models


class Protein(models.Model):
    protein_name = models.CharField(max_length=200)
    uniprot_id = models.CharField(max_length=20, unique=True)
    pdb_id = models.CharField(max_length=10, blank=True)
    organism = models.CharField(max_length=200)
    sequence = models.TextField()
    molecular_weight = models.FloatField(default=0.0)
    function = models.TextField(blank=True)

    def __str__(self):
        return self.protein_name
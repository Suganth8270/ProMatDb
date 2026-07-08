from django.db import models


class Protein(models.Model):
    protein_name = models.CharField(max_length=200)
    uniprot_id = models.CharField(max_length=20, unique=True)
    pdb_id = models.CharField(max_length=10, blank=True)
    organism = models.CharField(max_length=200)
    sequence = models.TextField()
    molecular_weight = models.FloatField()
    function = models.TextField()

    def __str__(self):
        return self.protein_name
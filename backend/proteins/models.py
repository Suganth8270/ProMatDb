from django.db import models


class Protein(models.Model):
    protein_name = models.CharField(max_length=200)
    uniprot_id = models.CharField(max_length=20, unique=True)
    pdb_id = models.CharField(max_length=10, blank=True)
    organism = models.CharField(max_length=200)
    sequence = models.TextField()
    molecular_weight = models.FloatField(default=0.0)
    function = models.TextField(blank=True)

    # Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.protein_name
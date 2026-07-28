from django.db import models


class Biomaterial(models.Model):
    # Basic Information
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=200, blank=True)

    description = models.TextField(blank=True)
    applications = models.TextField(blank=True)

    # External Database IDs
    pubchem_cid = models.CharField(max_length=50, blank=True)
    chebi_id = models.CharField(max_length=50, blank=True)

    # Scientific Information
    molecular_formula = models.CharField(max_length=100, blank=True)
    molecular_weight = models.CharField(max_length=100, blank=True)
    chemical_type = models.CharField(max_length=100, blank=True)

    # Material Properties
    biocompatibility = models.CharField(max_length=100, blank=True)
    biodegradability = models.CharField(max_length=100, blank=True)
    mechanical_strength = models.CharField(max_length=100, blank=True)
    thermal_stability = models.CharField(max_length=100, blank=True)

    # Images
    image_url = models.URLField(blank=True, default="")
    structure_image = models.URLField(blank=True, default="")
    sem_image = models.URLField(blank=True, default="")

    # References
    doi = models.CharField(max_length=200, blank=True)
    pubmed_url = models.URLField(blank=True, default="")

    # Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
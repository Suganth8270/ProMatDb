from django.db import migrations, models


def classify_supported_records(apps, schema_editor):
    Biomaterial = apps.get_model("biomaterials", "Biomaterial")
    Biomaterial.objects.filter(pk=2, pubchem_cid="107735").update(entity_type="biomaterial")
    Biomaterial.objects.filter(pk=3, pubchem_cid="71853", category__iexact="Natural Polymer").update(entity_type="biomaterial")
    Biomaterial.objects.filter(pk=6, pubchem_cid="2244").update(entity_type="drug")


def unclassify_records(apps, schema_editor):
    Biomaterial = apps.get_model("biomaterials", "Biomaterial")
    Biomaterial.objects.filter(pk__in=[2, 3, 6]).update(entity_type=None)


class Migration(migrations.Migration):
    dependencies = [("biomaterials", "0005_biomaterial_biocompatibility_and_more")]

    operations = [
        migrations.AddField(
            model_name="biomaterial",
            name="entity_type",
            field=models.CharField(blank=True, choices=[("biomaterial", "Biomaterial"), ("drug", "Drug"), ("small_molecule", "Small Molecule")], max_length=32, null=True),
        ),
        migrations.RunPython(classify_supported_records, unclassify_records),
    ]

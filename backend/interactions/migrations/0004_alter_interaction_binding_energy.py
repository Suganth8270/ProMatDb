from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interactions", "0003_interaction_created_at_interaction_updated_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="interaction",
            name="binding_energy",
            field=models.FloatField(blank=True, null=True),
        ),
    ]

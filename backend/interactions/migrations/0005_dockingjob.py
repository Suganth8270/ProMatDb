from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("interactions", "0004_alter_interaction_binding_energy"),
    ]

    operations = [
        migrations.CreateModel(
            name="DockingJob",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[
                    ("queued", "Queued"),
                    ("preparing_receptor", "Preparing receptor"),
                    ("preparing_ligand", "Preparing ligand"),
                    ("docking", "Docking"),
                    ("importing", "Importing result"),
                    ("completed", "Completed"),
                    ("failed", "Failed"),
                ], default="queued", max_length=32)),
                ("center_x", models.FloatField()),
                ("center_y", models.FloatField()),
                ("center_z", models.FloatField()),
                ("size_x", models.FloatField()),
                ("size_y", models.FloatField()),
                ("size_z", models.FloatField()),
                ("error_message", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("interaction", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="docking_jobs", to="interactions.interaction")),
                ("biomaterial", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="docking_jobs", to="biomaterials.biomaterial")),
                ("protein", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="docking_jobs", to="proteins.protein")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="dockingjob",
            constraint=models.UniqueConstraint(
                condition=models.Q(status__in=["queued", "preparing_receptor", "preparing_ligand", "docking", "importing"]),
                fields=("protein", "biomaterial"),
                name="unique_active_docking_pair",
            ),
        ),
    ]

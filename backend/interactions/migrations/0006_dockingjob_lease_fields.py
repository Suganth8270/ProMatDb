from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("interactions", "0005_dockingjob"),
    ]

    operations = [
        migrations.AddField(
            model_name="dockingjob",
            name="attempt_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="dockingjob",
            name="worker_token",
            field=models.UUIDField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="dockingjob",
            name="lease_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dockingjob",
            name="last_heartbeat_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dockingjob",
            name="failure_stage",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]

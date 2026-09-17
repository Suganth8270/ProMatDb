from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
class Migration(migrations.Migration):
    dependencies = [("interactions", "0006_dockingjob_lease_fields")]
    operations = [migrations.AddField(model_name="dockingjob", name="owner", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="docking_jobs", to=settings.AUTH_USER_MODEL))]

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("wallet", "0003_alter_wallettransaction_tx_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(model_name="stakingrecord", name="user", field=models.ForeignKey(to=settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="staking_positions")),
        migrations.AddField(model_name="stakingrecord", name="wallet_address", field=models.CharField(max_length=42, blank=True)),
    ]

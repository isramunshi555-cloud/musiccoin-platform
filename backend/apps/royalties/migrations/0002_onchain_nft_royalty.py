from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("royalties", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="OnchainNFTRoyalty",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("contract_address", models.CharField(max_length=42)),
                ("token_id", models.PositiveIntegerField()),
                ("receiver_wallet", models.CharField(max_length=42)),
                ("amount", models.DecimalField(max_digits=24, decimal_places=6)),
                ("currency", models.CharField(max_length=10, default="POL")),
                ("tx_hash", models.CharField(max_length=66, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]

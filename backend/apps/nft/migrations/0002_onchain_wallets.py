from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("nft", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(name="ChainSyncCursor", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("key", models.CharField(max_length=100, unique=True)), ("next_block", models.PositiveBigIntegerField())]),
        migrations.CreateModel(name="ChainEvent", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("key", models.CharField(max_length=100, unique=True))]),
        migrations.AlterField(model_name="nftitem", name="creator", field=models.ForeignKey(to=settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_nfts")),
        migrations.AlterField(model_name="nftitem", name="current_owner", field=models.ForeignKey(to=settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="owned_nfts")),
        migrations.AlterField(model_name="nftlisting", name="seller", field=models.ForeignKey(to=settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="nft_sales")),
        migrations.AddField(model_name="nftitem", name="creator_wallet", field=models.CharField(max_length=42, blank=True)),
        migrations.AddField(model_name="nftitem", name="owner_wallet", field=models.CharField(max_length=42, blank=True)),
        migrations.AddField(model_name="nftlisting", name="seller_wallet", field=models.CharField(max_length=42, blank=True)),
        migrations.AddField(model_name="nftlisting", name="buyer_wallet", field=models.CharField(max_length=42, blank=True)),
        migrations.AddField(model_name="nftlisting", name="listing_tx_hash", field=models.CharField(max_length=66, blank=True)),
    ]

# Generated by Django 5.0.6 on 2024-07-31 22:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_alter_show_show_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="show",
            name="disabled",
            field=models.BooleanField(default=False),
        ),
    ]

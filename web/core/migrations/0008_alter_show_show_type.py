# Generated by Django 5.0.6 on 2024-11-07 21:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_show_disabled'),
    ]

    operations = [
        migrations.AlterField(
            model_name='show',
            name='show_type',
            field=models.CharField(choices=[('text', 'Text'), ('shader', 'Shader'), ('p5', 'P5'), ('wasm', 'WASM')], max_length=100),
        ),
    ]
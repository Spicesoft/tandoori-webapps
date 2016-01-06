# -*- coding: utf-8 -*-
# flake8: noqa
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone
import django_extensions.db.fields


def add_apps(apps, schema_editor):
    """Create meetingroom and concierge app."""
    App = apps.get_model("tandoori_webapps", "App")

    concierge = App()
    concierge.name = "Conciergerie"
    concierge.slug = "conciergerie"
    concierge.description = "Alfred vous servira 24h/24"
    concierge.version_name = "BETA 1"
    concierge.version_code = 1
    concierge.apk_call = ("cowork.app://monolith/?url={host}"
                          "%2Fwebapps%2Fconcierge%2F")
    concierge.save()

    meeting_room = App()
    meeting_room.name = "Meeting Room"
    meeting_room.slug = "meeting-room"
    meeting_room.description = "Votre affichage salle de réunion avec réservation."
    meeting_room.version_name = "BETA 1"
    meeting_room.version_code = 1
    meeting_room.apk_call = ("cowork.app://monolith/?url={host}"
                             "%2Fwebapps%2Fmeeting_room%2F")
    meeting_room.save()


class Migration(migrations.Migration):

    dependencies = [
        ('tandoori_tenant', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='App',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'', max_length=200, verbose_name="Nom de l'application")),
                ('slug', django_extensions.db.fields.AutoSlugField(populate_from=b'name', verbose_name='Application slug', editable=False, blank=True)),
                ('description', models.CharField(default=b'', max_length=200, verbose_name="Description de l'application")),
                ('version_name', models.CharField(default=b'', max_length=200, verbose_name="Nom de version de l'application")),
                ('version_code', models.IntegerField(default=0, verbose_name="Code de version de l'application")),
                ('apk_call', models.CharField(max_length=200, null=True, verbose_name="Appel de l'application")),
            ],
            options={
                'permissions': (('can_use_tablet', 'Can view tablet apps'),),
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='AppSubscription',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', django_extensions.db.fields.CreationDateTimeField(default=django.utils.timezone.now, verbose_name='created', editable=False, blank=True)),
                ('modified', django_extensions.db.fields.ModificationDateTimeField(default=django.utils.timezone.now, verbose_name='modified', editable=False, blank=True)),
                ('from_date', models.DateTimeField(verbose_name='date de d\xe9but')),
                ('to_date', models.DateTimeField(verbose_name='date de fin')),
                ('app', models.ForeignKey(to='tandoori_webapps.App')),
                ('tenant', models.ForeignKey(to='tandoori_tenant.Tenant')),
            ],
            options={
                'ordering': ('-modified', '-created'),
                'abstract': False,
                'get_latest_by': 'modified',
            },
            bases=(models.Model,),
        ),
        migrations.RunPython(add_apps)
    ]

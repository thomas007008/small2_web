# celery.py

from celery import Celery
from django.conf import settings
from datetime import timedelta

app = Celery('music_site')
# app = Celery('music_app')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.conf.beat_schedule = {
    'execute-cleanup-every-day': {
        'task': 'music_app.delete_expired_files',
        'schedule': timedelta(hours=1),
    },
}
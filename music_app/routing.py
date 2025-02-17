from django.urls import path
from . import consumer

websocket_urlpatterns = [
    path('ws/music_processing', consumer.MusicProcessingConsumer.as_asgi())
]

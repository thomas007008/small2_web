"""
ASGI config for music_site project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

import music_app.routing  # 导入 WebSocket 路由配置

from django.urls import re_path
from . import consumers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'music_site.settings')

# application = get_asgi_application()

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": AuthMiddlewareStack(
        URLRouter(
            music_app.routing.websocket_urlpatterns
        )
        
    ),
    # "websocket": URLRouter(
    #     music_app.routing.websocket_urlpatterns
    #     # consumers.MusicProcessingConsumer.as_asgi()
    # ),
})

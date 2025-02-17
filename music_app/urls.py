from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

app_name = 'music_app'

schema_view = get_schema_view(
    openapi.Info(
        title="API Documentation",
        default_version='v1',
        description="API documentation for my project",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [

    

  

    ########################3
    path("tools.html",views.tools,name="tools"),
    path("m-tools.html",views.tools,name="m_tools"),
    

    path("music_upload/",views.music_upload,name="music_upload"),
    

    
 
    path('get_algo_status/',views.get_algo_status, name='get_algo_status'),
    path('get_session_key/', views.get_session_key, name='get_session_key'),
    path('download_static_file/', views.download_static_file, name='download_static_file'),
    path('get_algo_progress/', views.get_algo_progress, name='get_algo_progress'),

]




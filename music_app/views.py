from django.shortcuts import render,redirect
from django.http import HttpResponse,HttpResponseServerError,HttpResponseNotFound,FileResponse
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from .forms import RegistVerificationForm,DescribeCreatForm,AddMusicForm,DelMusicForm
from .models import UserTmpMusic,SessionFile,ContentType,TempUser

from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
# from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
# from django.utils.encoding import force_bytes, force_text
# from .forms import EmailVerificationForm, RegistrationForm
from django.urls import reverse
from smtplib import SMTPServerDisconnected
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes,force_str
import random, string
from django.contrib import messages
# from django.core.cache import cache
from django.core.cache import caches
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth.decorators import user_passes_test
from django.db import IntegrityError, transaction
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from django.conf import settings

import requests
import time
from datetime import datetime

from .task import process_record_audio_convert_midi

from django.http import JsonResponse

import json

from .logger_config import logger
from .save_music import save_music_file,create_music_file_path,save_music_file_by_name,save_music_file_by_file
from .public_func import generate_verification_code,delete_file,cut_audio,generate_long_filename,generate_filename,copy_file,is_safe_path,safe_join

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import render
from django_user_agents.utils import get_user_agent
# from mutagen import File
import mutagen
from io import BytesIO
import os


#@login_required

# 获取 Redis 缓存
cache = caches['default']
# 获取数据库缓存
db_cache = caches['db']


#https://mubert.com/render/sign-up
####

def anonymous_required(function=None, redirect_url='music_app:tools'):
    """
    Decorator for views that checks that the user is not logged in, redirecting
    to the specified page if necessary.
    """
    actual_decorator = user_passes_test(
        lambda u: not u.is_authenticated,
        login_url=redirect_url,
        redirect_field_name=None
    )
    if function:
        return actual_decorator(function)
    return actual_decorator


    


















##################3
# @never_cache
# @login_required
def tools(request):
    if not request.session.session_key:
        request.session.save()
    context = {}
    return render(request, "music/tools.html", context)

# @never_cache
# @login_required
def m_tools(request):
    if not request.session.session_key:
        request.session.save()
    context = {}
    return render(request, "music/m-tools.html", context)




@transaction.atomic    
def get_algo_progress(request):
    print("get_algo_progress_fun")
    try:
        if not request.session.session_key:
            request.session.save()
        print("request.session.session_key ",request.session.session_key)
        db_session_file = SessionFile.objects.filter(session_key=request.session.session_key).first()            
        if db_session_file:
            print("db_session_file")
            return JsonResponse({'data': db_session_file.file_info})
        else:
            print("no_db_session_file")
            return JsonResponse({'error': 'No session file found.'}, status=404)
    
    except Exception as e:
        print("get_algo_progress_fun_error",str(e))
        return JsonResponse({'error': str(e)}, status=500)



@transaction.atomic
    # transaction.atomic装饰器可以保证该函数中所有的数据库操作都在一个事务中
def music_upload(request):
    if not request.session.session_key:
        request.session.save()
    if request.method == 'POST':
        audio_file = request.FILES['file']
        print("File name:", audio_file.name)
        print("File size:", audio_file.size, "bytes")
        print("Content type:", audio_file.content_type)

        # 获取文件名
        file_name = audio_file.name
        # 提取文件后缀名
        file_extension = file_name.split('.')[-1] if '.' in file_name else ''
  
        user_id = request.POST.get('user_id')
        music_type = request.POST.get('music_type')
        music_title = request.POST.get('music_title')

        url_path = None
        
        try:
            file_name = f"{music_type}_"
            file_name += request.session.session_key
            file_name += f".{file_extension}"
            file_path_str,url_dir = create_music_file_path(str(user_id),"music_upload",file_name)
            save_music_file_by_file(file_path_str,audio_file)
            
            # 使用mutagen读取音频信息
            audio = mutagen.File(file_path_str)
            # 获取音乐时长（秒）
            duration_in_seconds = audio.info.length

            # 创建临时音乐记录
            tmp_music = UserTmpMusic()
            
         
            # 临时用户
            temp_user, created = TempUser.objects.get_or_create(
                session_key=request.session.session_key
            )
            tmp_music.content_type = ContentType.objects.get_for_model(TempUser)
            tmp_music.object_id = temp_user.id

            tmp_music.music_type = music_type
            tmp_music.title = music_title
            tmp_music.path = file_path_str
            tmp_music.music_long = duration_in_seconds
            tmp_music.save()

            save_music_file_by_file(file_path_str,audio_file)

            print(f"save_path {file_path_str}")
            print("music_type",music_type)
            if music_type == 'RECORDED':
                clientUUID = request.POST.get('clientUUID')
                algo_uuid = request.POST.get('algo_uuid')
                print("process_record_audio_convert_midi ",algo_uuid,user_id,request.session.session_key,url_dir,file_path_str,clientUUID)
                process_record_audio_convert_midi.delay(algo_uuid,user_id,request.session.session_key,url_dir,file_path_str,clientUUID)

        except Exception as e:
            message = e.args[0] if e.args else "Unknown error"
            print(f"Uploaded failed: {message}")
            return JsonResponse({"message": f"Uploaded failed: {message}"}, status=500)
            
        return JsonResponse({"message": "Uploaded successfully!"})







    

    

def get_algo_status(request):
    if not request.session.session_key:
        request.session.save()
    if request.method == 'POST':
        try:
        # 解析来自请求体的JSON数据
            request_data = json.loads(request.body)
            algo_type = request_data.get('algo_type')

            # 从数据库获取JSON字符串
            db_session_file = SessionFile.objects.filter(session_key=request.session.session_key).first()
            if db_session_file:
                json_session_string = db_session_file.file_info
                data = json.loads(json_session_string)

                # 获取算法信息
                algo_info = data.get(algo_type)
                if algo_info is not None:
                    return JsonResponse(algo_info, safe=False, status=200)
                else:
                    return JsonResponse({'error': 'Algorithm type not found'}, status=404)
            else:
                return JsonResponse({'error': 'Session file not found'}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': str(e)}, status=500)
    

def get_session_key(request):
    if not request.session.session_key:
        request.session.save()
    session_key = request.session.session_key
    print("session_key is ",session_key)
    return JsonResponse({'session_key': session_key})





def download_static_file(request):
    # 从请求中获取文件路径参数
    print('11111111111111111')
    file_path = request.GET.get('file_path', '')

    file_title = request.GET.get('file_title', '')

    print('file_path:',file_path)
    print('file_title:',file_title)

    # 定义允许的基本目录，例如 MEDIA_ROOT 或其他安全目录
    base_path = settings.BASE_DIR

    print('base_path',base_path)
    # 完整的文件路径
    full_file_path = safe_join(base_path, file_path)

    print('full_file_path111111111:',full_file_path)

    # 检查路径是否安全
    if not is_safe_path(base_path, full_file_path):
        return HttpResponse("Unauthorized access.", status=403)

    print('full_file_path:',full_file_path)

    # 尝试打开文件
    try:
        # 使用 'rb' 模式以二进制读取文件，适用于任何类型的文件
        file = open(full_file_path, 'rb')
    except IOError:
        return HttpResponse("File not found.", status=404)

    # 创建并返回一个FileResponse
    response = FileResponse(file)
    name, extension = os.path.splitext(file_path)
    file_title = file_title + extension
    response['Content-Disposition'] = f'attachment; filename="{file_title}"'
    return response


    
        

import os
from django.conf import settings
import shutil


def save_music_file(user_name,type,file):
    save_dir = os.path.join(settings.MEDIA_ROOT, user_name)
    save_dir = os.path.join(save_dir, type)

    # 确保目录存在
    if not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
    # raise Exception("ffaaiilleedd!")

    file_path = os.path.join(save_dir, file.name)
    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
            
    print("save_file_path ",file_path)
    url_dir = os.path.join(settings.MEDIA_URL, user_name)
    url_dir = os.path.join(url_dir, type)
    url_dir = os.path.join(url_dir, file.name)

    return (file_path,url_dir)

def create_music_file_path(user_name,type,file_name):
    save_dir = os.path.join(settings.MEDIA_ROOT, user_name)
    save_dir = os.path.join(save_dir, type)

    # 确保目录存在
    if not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
    # raise Exception("ffaaiilleedd!")

    file_path = os.path.join(save_dir, file_name)


    url_dir = os.path.join(settings.MEDIA_URL, user_name)
    url_dir = os.path.join(url_dir, type)
    url_dir = os.path.join(url_dir, file_name)

    return (file_path,url_dir)


def save_music_file_by_name(file_path,file_byte):
    with open(file_path, 'wb+') as destination:
        destination.write(file_byte)
    return

def save_music_file_by_file(file_path,file_buffer):
    with open(file_path, 'wb+') as destination:
        for chunk in file_buffer.chunks():
            destination.write(chunk)
    return




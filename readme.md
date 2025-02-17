## Requirements
- Python 3.10

## nVidia版本准备
- 安装nivida官方驱动 535.161.08
- sudo apt-get update
- sudo apt-get install -y docker
- sudo apt-get install -y nvidia-docker2
- 安装nv-tensorrt-local-repo-ubuntu2004-8.5.2-cuda-11.8_1.0-1_amd64.deb
- sudo systemctl restart docker
- sudo docker pull nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04

## 运行镜像
- sudo docker run --gpus all --cap-add=SYS_PTRACE -d  -v /home/workspace/music_site:/home/workspace/music_site/   -p 9000:9000 -p 9001:9001  --name dev_gpu_music_site  nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04 tail -f /dev/null

## 在镜像中安装tensorrt
- 下载TensorRT-8.5.3.1.Linux.x86_64-gnu.cuda-11.8.cudnn8.6.tar.gz
- 解压TensorRT安装包并安装
RUN tar -xzvf /tmp/TensorRT-8.5.3.1.Linux.x86_64-gnu.cuda-11.8.cudnn8.6.tar.gz -C /usr/local && \
    rm /tmp/TensorRT-8.5.3.1.Linux.x86_64-gnu.cuda-11.8.cudnn8.6.tar.gz

## 设置环境变量
ENV TENSORRT_ROOT /usr/local/TensorRT-8.5.3.1
ENV LD_LIBRARY_PATH $TENSORRT_ROOT/lib:$LD_LIBRARY_PATH
ENV PATH $TENSORRT_ROOT/bin:$PATH
ENV PYTHONPATH $TENSORRT_ROOT/python:$PYTHONPATH

## 安装TensorRT Python 绑定
RUN pip install $TENSORRT_ROOT/python/tensorrt-8.5.3.1-cp310-none-linux_x86_64.whl

## 安装其他依赖
RUN pip install -r requirements.txt

## 安装ffmpeg
RUN apt-get update && apt-get install -y ffmpeg


##  设置环境变量
export DJANGO_SETTINGS_MODULE=music_site.settings
                                
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/demucs
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/music_source_separation
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/piano_transcription
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/instrument_transcription_new
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/singing_transcription_ICASSP2021/AST
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/

export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi/pytorch
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi/utils
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/python_audio_separator_main

export GOOGLE_APPLICATION_CREDENTIALS="/home/workspace/music_site/ga_credentials.json"

## 运行程序

python manage.py runserver 0.0.0.0:8000

## 另外开一个终端 同样设置环境变量并运行算法任务

export DJANGO_SETTINGS_MODULE=music_site.settings
                                
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/demucs
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/music_source_separation
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/piano_transcription
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/instrument_transcription_new
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/singing_transcription_ICASSP2021/AST
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/

export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi/pytorch
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/new_convert_midi/utils
export PYTHONPATH=$PYTHONPATH:/home/workspace/music_site/music_app/algo/python_audio_separator_main

export GOOGLE_APPLICATION_CREDENTIALS="/home/workspace/music_site/ga_credentials.json"

celery -A music_site.celery_app worker --loglevel=info


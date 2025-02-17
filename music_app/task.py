from .celery_app import app
from celery import shared_task
from django.core.mail import send_mail
import time
from datetime import timedelta, datetime
from .logger_config import logger
from django.core.mail import EmailMultiAlternatives
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import os
from django.conf import settings
from pydub import AudioSegment
from pydub.utils import mediainfo
import torch
from django.db import transaction
import librosa
import mido
from mido import MidiFile, MidiTrack, Message
from .save_music import save_music_file,create_music_file_path,save_music_file_by_name
# from .models import TmpFile
from .models import SessionFile
from .public_func import combine_midi_bytime_overlap,split_audio_overlap,generate_filename,split_audio,check_audio_channels,concat_wav,combine_midi_bytime,combine_midi_bytracks,save_music,copy_file,generate_long_filename,cut_audio
# from .public_func import save_process_progress
import tempfile
import magic  # 使用python-magic库来检测文件类型
import sys
import redis
import uuid
import pickle
import numpy
import io
import traceback
from pathlib import Path
import soundfile
import ffmpeg
import wave
from .public_func import delete_file
import json
# import fluidsynth
# from midi2audio import FluidSynth
from third_part.midi2audio.midi2audio import FluidSynth

import zipfile

from .models import SessionFile
from mutagen import File



from pedalboard import Pedalboard, Reverb, load_plugin
from pedalboard.io import AudioFile

import dawdreamer as daw
from scipy.io import wavfile

# g_process_manage = None
# if 'celery' in sys.argv[0]:
#     print("celery...................")
#     g_process_manage = process_manage()
g_redis_time = 300

def algo_queue_process(music_data,algo_type,music_sr=44100,separation_algo_type='',source_type_set=[]):
    print(f"algo_queue_process: {algo_type}")
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB,health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL)
    task_id = str(uuid.uuid4())
    # 创建一个字典，包含音乐数据和ID
    music_data_to_pickle = {
        'music_data': music_data,
        'task_id': task_id,
        'music_sr':music_sr,
        'expiration_time': time.time() + g_redis_time, # 设置 300 秒后过期
        'source_type_set':source_type_set,
        'separation_algo_type':separation_algo_type
    }
    # 将字典 pickle
    pickled_music_data = pickle.dumps(music_data_to_pickle)
    # 'task_queue_' + type
    print(f'send task_queue_{algo_type}')
    r.rpush(f'task_queue_{algo_type}', pickled_music_data)
    print(f'push result_{algo_type}_{task_id}')
    result = r.blpop(f'result_{algo_type}_{task_id}',timeout=g_redis_time)
    if result is None:
        print(f"algo_{algo_type} is error,task id is {task_id}")
        raise Exception(f"algo_{algo_type} is error,task id is {task_id}")
    else:
        print(f"algo_{algo_type} is not none")
    _, pickled_result = result
    print(f'result_{algo_type}_{task_id}')
    unpickled_result = pickle.loads(pickled_result)
    ret_data = unpickled_result['ret_data']
    return ret_data

def save_process_progress(session_key,select_audio_type,process_pregress,status,music_file_path,music_file_url,cut_music,algo_uuid,error_message):
    with transaction.atomic():    #事务悲观锁
        db_session_file = SessionFile.objects.select_for_update().filter(session_key=session_key).first()
        if db_session_file:
            json_session_string = db_session_file.file_info
 
            # 使用 json.loads() 解析字符串
            data = json.loads(json_session_string)
            if select_audio_type not in data:
                # 如果不存在，则创建一个空字典作为该键的值
                data[select_audio_type] = {}
            data[select_audio_type]['process_pregress'] = process_pregress
            data[select_audio_type]['status'] = status
            data[select_audio_type]['music_file_path'] = music_file_path
            data[select_audio_type]['music_file_url'] = music_file_url
            data[select_audio_type]['cut_music'] = cut_music
            data[select_audio_type]['algo_uuid'] = algo_uuid
            data[select_audio_type]['error_message'] = error_message
            # 转换回JSON字符串
            updated_json_string = json.dumps(data)
            # 更新现有记录
            db_session_file.file_info = updated_json_string
            db_session_file.save()


def save_splitter_progress(session_key,select_audio_type,merge_mp3_path,process_pregress,status,algo_uuid,error_message):
    updated_json_string = ""
    with transaction.atomic():    #事务悲观锁
        db_session_file = SessionFile.objects.select_for_update().filter(session_key=session_key).first()
        if db_session_file:
            json_session_string = db_session_file.file_info
            # 使用 json.loads() 解析字符串
            data = json.loads(json_session_string)
            
            if select_audio_type not in data:
                # 如果不存在，则创建一个空字典作为该键的值
                data[select_audio_type] = {}
            else:
                del data[select_audio_type]
                data[select_audio_type] = {}
            # del data[select_audio_type]
            data[select_audio_type]['process_pregress'] = process_pregress
            data[select_audio_type]['status'] = status
            data[select_audio_type]['algo_uuid'] = algo_uuid
            data[select_audio_type]['error_message'] = error_message
            if(merge_mp3_path != None):
                for key, value in merge_mp3_path.items():
                    # 检查 select_audio_type 是否存在于 data 字典中
                    if select_audio_type not in data:
                        # 如果不存在，创建一个新的字典
                        data[select_audio_type] = {}
                    # 检查 key 是否存在于 select_audio_type 字典中
                    if key not in data[select_audio_type]:
                        # 如果不存在，创建一个新的字典
                        data[select_audio_type][key] = {}
                    data[select_audio_type][key]['music_file_path'] = value['music_file_path']
                    data[select_audio_type][key]['music_file_url'] = value['music_file_url']
            

            # 转换回JSON字符串
            updated_json_string = json.dumps(data)
            # 更新现有记录
            db_session_file.file_info = updated_json_string
            db_session_file.save()

    
def save_midi_progress(session_key,select_audio_type,process_pregres,status,algo_uuid,error_message,
                        instru_midi_file_path='',instru_midi_file_url='',vocals_midi_file_path='',vocals_midi_file_url='',
                        midi_audio_file='',midi_audio_url='',instrument_type='',cut_music=''):
    updated_json_string = ""
    with transaction.atomic():    #事务悲观锁
        db_session_file = SessionFile.objects.select_for_update().filter(session_key=session_key).first()
        if db_session_file:
            json_session_string = db_session_file.file_info
            # 使用 json.loads() 解析字符串
            data = json.loads(json_session_string)

            if select_audio_type not in data:
                # 如果不存在，则创建一个空字典作为该键的值
                data[select_audio_type] = {}
            else:
                del data[select_audio_type]
                data[select_audio_type] = {}
            
            data[select_audio_type]['process_pregress'] = process_pregres
            data[select_audio_type]['status'] = status
            data[select_audio_type]['algo_uuid'] = algo_uuid
            data[select_audio_type]['error_message'] = error_message
            

            if 'instrument' not in data[select_audio_type]:
                data[select_audio_type]['instrument'] = {}
            if 'vocals' not in data[select_audio_type]:
                data[select_audio_type]['vocals'] = {} 

            data[select_audio_type]['instrument']['midi_file_path'] = instru_midi_file_path
            data[select_audio_type]['instrument']['midi_file_url'] = instru_midi_file_url
            data[select_audio_type]['vocals']['midi_file_path'] = vocals_midi_file_path
            data[select_audio_type]['vocals']['midi_file_url'] = vocals_midi_file_url
            data[select_audio_type]['midi_audio_file'] = midi_audio_file
            data[select_audio_type]['midi_audio_url'] = midi_audio_url
            data[select_audio_type]['instrument_type'] = instrument_type
            data[select_audio_type]['cut_music'] = cut_music
            # 转换回JSON字符串
            updated_json_string = json.dumps(data)
            # 更新现有记录
            db_session_file.file_info = updated_json_string
            db_session_file.save()


def save_record_progress(session_key,select_audio_type,process_pregres,status,algo_uuid,error_message,
                        midi_mp3_file_path='',midi_mp3_file_url='',midi_file_path='',midi_file_url='',
                        music_file_path='',music_file_url='',zip_file_path='',zip_file_url=''):
    with transaction.atomic():    #事务悲观锁
        db_session_file = SessionFile.objects.select_for_update().filter(session_key=session_key).first()
        if db_session_file:
            
            json_session_string = db_session_file.file_info
            # 使用 json.loads() 解析字符串
            data = json.loads(json_session_string)

            if select_audio_type not in data:
                # 如果不存在，则创建一个空字典作为该键的值
                data[select_audio_type] = {}

            data[select_audio_type]['process_pregress'] = process_pregres
            data[select_audio_type]['status'] = status
            data[select_audio_type]['algo_uuid'] = algo_uuid
            data[select_audio_type]['error_message'] = error_message

            data[select_audio_type]['midi_mp3_file_path'] = midi_mp3_file_path
            data[select_audio_type]['midi_mp3_file_url'] = midi_mp3_file_url
            data[select_audio_type]['midi_file_path'] = midi_file_path
            data[select_audio_type]['midi_file_url'] = midi_file_url
            data[select_audio_type]['music_file_path'] = music_file_path
            data[select_audio_type]['music_file_url'] = music_file_url
            data[select_audio_type]['zip_file_path'] = zip_file_path
            data[select_audio_type]['zip_file_url'] = zip_file_url
            # 转换回JSON字符串
            updated_json_string = json.dumps(data)
            # 更新现有记录
            db_session_file.file_info = updated_json_string
            db_session_file.save()



def get_chanel_id(clientUUID):
    # 创建Redis连接
    redis_client = redis.StrictRedis(
        settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB
    )

    retrieved_channel = redis_client.get(clientUUID)
    if retrieved_channel:
        retrieved_channel = retrieved_channel.decode('utf-8')
        print(f"clientUUID ID {clientUUID} 映射到通道名称 {retrieved_channel}")
    else:
        print(f"找不到与用户ID {clientUUID} 相关联的通道名称。")
    return retrieved_channel















        
@shared_task
def process_record_audio_convert_midi(algo_uuid,user_id,session_key,audio_url_dir,file_path,clientUUID):
    # audio processing logic here
    # ...

    print("process_record_audio_convert_midi")
    #先去人声再音源分离 再转midi 
    # retrieved_channel = get_chanel_id(session_key)
    # channel_layer = get_channel_layer()
    select_audio_type = "record_algo_process";
    try:     
        
        set_audio_type_processing(session_key,"record_algo_process")
        #分拆长度到1分钟
        audio_chunks,chunks,bit_depth,audio_time = split_audio(file_path, 60000)
        # bit_depth = 32
        merge_tmp_audio_path = []
        sr=44100
        merge_tmp_mp3 = []
      
        finish_percent = 0.2

        
        save_record_progress(session_key,select_audio_type,finish_percent,'run',algo_uuid,'')
        # save_record_progress(session_key,select_audio_type,process_pregres,status,algo_uuid,error_message,
        #                 midi_mp3_file_path='',midi_mp3_file_url='',midi_file_path='',midi_file_url='',
        #                 music_file_path='',music_file_url='',zip_file_path='',zip_file_url=''):


        percent_per_value = 0.7/chunks
        average_rms = 0
        vocals_midis = []

        for index, chunk in enumerate(audio_chunks):
            # 创建一个字节流
            audio_byte_stream = io.BytesIO()

            # 将AudioSegment对象导出到字节流
            chunk.export(audio_byte_stream, format="wav")

            # 移动字节流的位置到起始处，这样librosa就可以从头读取它
            audio_byte_stream.seek(0)

            # y, sr = librosa.load(file_path,sr=44100)
            y, sr = librosa.load(audio_byte_stream,sr=44100)

    
            print(f"sr ==== {sr}")
            # 获取 y 的形状，以确定它是单声道还是立体声
            if len(y.shape) == 1:  # y 是单声道
                y_stereo = numpy.vstack((y, y))  # 创建一个伪立体声信号
            else:  # y 是立体声
                y_stereo = y
            # 获取样本数量
            num_samples = y_stereo.shape[1]
            # 创建一个形状为 (2, num_samples) 的新数组，并用 y_stereo 填充它
            waveform = numpy.zeros((2, num_samples))
            waveform[:, :num_samples] = y_stereo
            # 创建输入字典
            input_dict = {'waveform': waveform}
            # sep_audio = algo_queue_process(input_dict,'vocals',sr)
            sep_audio = algo_queue_process(y_stereo,'accompaniment_or_vocals',sr,'vocals')
            sep_audio = sep_audio.T
            print("sep_audio",sep_audio)
            ret = check_audio_channels(sep_audio)
            mono_audio = None
            if(ret == 'Multiple_channels'):
                # 将其转换为单声道音频，通过沿第一个维度取平均值
                mono_audio = numpy.mean(sep_audio, axis=0)
                #取左声道
                # mono_audio = numpy_array[:, 0]
            elif(ret == 'Single_channel'):
                mono_audio = sep_audio
            else:
                print("channel error!")

            # audio, sr = librosa.load("lshs.mp3", mono=False, sr=44100)
            # # if len(audio.shape) == 1:
            # #     audio = np.stack([audio, audio], axis=0)
            # print("Input audio: {} Sample rate: {}".format(audio.shape, sr))

            vocals_midi = algo_queue_process(mono_audio,'singing_transcription',sr)
            if vocals_midi == None:
                print("no vocals find")
                raise Exception("no vocals find")
            vocals_midis.append(vocals_midi)

            finish_percent += percent_per_value
            save_record_progress(session_key,select_audio_type,finish_percent,'run',algo_uuid,'')
            
            # async_to_sync(channel_layer.send)(retrieved_channel,{
            #     'type': 'send_record_convert_midi_finish',
            #     'text': {
            #         'type': 'send_record_convert_midi_finish',
            #         'status': 'run',
            #         'percent':finish_percent,
            #         'algo_type':"record_algo_process",
            #         'algo_uuid':algo_uuid
            #     }   
            # })
        
        if len(vocals_midis) == 0:
            print("no vocals instrument")
            raise Exception("no vocals instrument")
        
        print("algo_finish")

        vocals_finish_midi_file = combine_midi_bytime(vocals_midis)

        
        file_name = "record_midi_task_"
        file_name += session_key
        wav_name = file_name
        wav_name += f".wav"
        mp3_name = file_name
        mp3_name += f".mp3"
        zip_name = file_name
        zip_name += f".zip"
        file_name += f".mid"
        
        file_path_str,url_dir = create_music_file_path(str(user_id),"record_midi",file_name)
        wav_file_path_str,wav_url_dir = create_music_file_path(str(user_id),"record_midi",wav_name)
        mp3_file_path_str,mp3_url_dir = create_music_file_path(str(user_id),"record_midi",mp3_name)
        zip_file_path_str,zip_url_dir = create_music_file_path(str(user_id),"record_midi",zip_name)
        
        print(f"save_path {file_path_str}")

        print(f"process_record_audio_convert_midi_url_dir {url_dir}")
        vocals_finish_midi_file.save(file_path_str)

         # 获取脚本文件所在的目录
        base_dir = Path(__file__).resolve().parent
        # 创建相对于脚本文件所在目录的路径
        sf2_path = base_dir / "soundfont" / "FluidR3_GM.sf2"
        sf2_path = base_dir / "soundfont" / "MS_Basic.sf3"

        # 初始化 FluidSynth，使用 SoundFont
        fs = FluidSynth(str(sf2_path), sample_rate=44100, gain=1)


        # 读取并播放 MIDI 文件
        fs.midi_to_audio(file_path_str, wav_file_path_str)

        # 读取 WAV 文件
        audio = AudioSegment.from_wav(wav_file_path_str)  # 替换为你的 WAV 文件路径

        # 转换为 MP3 格式并保存
        audio.export(mp3_file_path_str, format="mp3")  # 输出的 MP3 文件名

        with zipfile.ZipFile(zip_file_path_str, 'w') as myzip:
            # 获取当前日期并格式化为指定格式
            current_date = datetime.now().strftime('%Y%m%d')
            # 将音频时间转换为秒
            audio_time_s = audio_time // 1000
            print(f"audio_time {audio_time}")
            print(f"audio_time_s {audio_time_s}")
            # 生成文件名
            file_name_base = f'hum_{current_date}_{audio_time_s:04d}'
            # 使用 os.path.splitext() 获取文件名和后缀名
            file_name, file_extension = os.path.splitext(file_path_str)
             # 获取文件的基本名称，即去掉目录路径后的文件名
            # file_name = os.path.basename(file_path_str)
            # 向ZIP文件中添加文件
            myzip.write(file_path_str,arcname=file_name_base+file_extension)
            # file_name = os.path.basename(file_path)
            file_name, file_extension = os.path.splitext(file_path)
            # 向ZIP文件中添加文件
            myzip.write(file_path,arcname=file_name_base+file_extension)

        save_record_progress(session_key,select_audio_type,finish_percent,'done',algo_uuid,'',
                    mp3_file_path_str,mp3_url_dir,file_path_str,url_dir,
                    file_path,audio_url_dir,zip_file_path_str,zip_url_dir)


    except Exception as e:
    # 处理异常
        print(f"发生错误：{e}")
        logger.debug(f"process_record_audio_convert_midi: {e}")
        # 打印异常信息和发生异常的行号
        traceback.print_exc()
        # 如果有异常，发送包含异常信息的消息
        save_record_progress(session_key,select_audio_type,finish_percent,'',algo_uuid,str(e))
   






   






def set_audio_type_processing(session_key,select_audio_type):
    with transaction.atomic():    #事务悲观锁
        db_session_file = SessionFile.objects.select_for_update().filter(session_key=session_key).first()
        if db_session_file:
            json_session_string = db_session_file.file_info
            # 使用 json.loads() 解析字符串
            data = json.loads(json_session_string)
        else:
            # 创建一个新的字典，因为没有找到现有记录
            data = {}

        # 确保 'algo_select_audio_task' 存在
        if select_audio_type not in data:
            data[select_audio_type] = {}

        # 更新状态algo_select_audio_task_select_vocal
        data[select_audio_type]['status'] = 'run'

        # 转换回JSON字符串
        updated_json_string = json.dumps(data)

        if db_session_file:
            # 更新现有记录
            db_session_file.file_info = updated_json_string
            db_session_file.save()
        else:
            # 创建新记录
            SessionFile.objects.create(session_key=session_key, file_info=updated_json_string)

def convert_timestamps_to_absolute(midi_file):
    for track in midi_file.tracks:
        absolute_time = 0
        for msg in track:
            absolute_time += msg.time
            msg.time = absolute_time
    return midi_file



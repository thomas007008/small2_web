from multiprocessing import Pool, current_process
from music_app.process_demucs import DemucsProcessor
from music_app.process_music_source_separation import MusicSourceSeparationVocals,MusicSourceSeparationAccompaniment
from music_app.process_piano_transcription import MyPianoTranscription
from music_app.process_singing_transcription import SingingTranscription
from music_app.process_instrument_transcription import MyInstrumentTranscriptionBass,MyInstrumentTranscriptionDrums,MyInstrumentTranscriptionGuitar
from music_app.process_music_separation_mdx23 import MusicSeparationMdx23
from music_app.process_new_convert_midi import NewConvertMidiPiano 

from music_app.public_func import deep_getsizeof

import multiprocessing
import redis
import json
import pickle
import uuid
import time
import traceback
import signal
import sys
import threading
import time

import os
from django.conf import settings


g_redis_time = 300

def init_worker(processor_type):
    # return
    processor = None

    if processor_type == 'separate_6_instruments': 
        processor = MusicSeparationMdx23()
    elif processor_type == 'accompaniment_or_vocals':
        processor = MusicSeparationMdx23()
    elif processor_type == 'singing_transcription':
        processor = NewConvertMidiPiano(algo_type='vocal')
    elif processor_type == 'piano_transcription':
        processor = MyPianoTranscription()
    elif processor_type == 'bass_transcription':
        processor = NewConvertMidiPiano(algo_type='bass')
    elif processor_type == 'drums_transcription':
        processor = NewConvertMidiPiano(algo_type='drums')
    elif processor_type == 'guitar_transcription':
        processor = NewConvertMidiPiano(algo_type='guitar')
    else:
        print('error!no algo_type found!,type is {processor_type}')
    print(f"Initialized processor for {current_process().name},{processor_type}")
    return processor





def process_audio(type,redis_host, redis_port, redis_db,redis_health_check_interval):
    try:
        print(f"Start processing {type}")

        processor = init_worker(type)

        # 启动一个线程，用于处理过期的数据
        t_process_redis_del= threading.Thread(target=process_redis_del_thread, args=(redis_host, redis_port, redis_db,redis_health_check_interval))
        t_process_redis_del.start()


        # signal.signal(signal.SIGUSR1, handle_signal)
        r = redis.Redis(host=redis_host, port=redis_port, db=redis_db,health_check_interval=redis_health_check_interval)
        
        
        while True:
            queue_name = 'task_queue_' + type
            print(f'{queue_name} wait')
            _, pickled_data = r.blpop(queue_name)
            print(f'algo_rec_task_queue_{type}')
            # Unpickling 数据
            unpickled_data = pickle.loads(pickled_data)

            separation_algo_type = None
            if 'separation_algo_type' in unpickled_data:
                separation_algo_type = unpickled_data['separation_algo_type']

            task_id = unpickled_data['task_id']
            music_data = unpickled_data['music_data']
            music_sr = 44100
            print(f'algo_unpickled_{type}')
            if 'music_sr' in unpickled_data:
                music_sr = unpickled_data['music_sr']
            source_type_set = unpickled_data['source_type_set']
            result = None
      
            tmp_result = processor.process_algo(music_data,music_sr,source_type_set)
  
            if type == 'accompaniment_or_vocals':
                if separation_algo_type == 'accompaniment':
                    # result = tmp_result['bass'] + tmp_result['drums'] + tmp_result['other'] + tmp_result['piano'] + tmp_result['guitar']
                    result = tmp_result['instument']
                elif separation_algo_type == 'vocals':
                    result = tmp_result['vocals']
                elif separation_algo_type == 'accompaniment_and_vocals':
                    print('accompaniment_and_vocals')
                    audio_result = {}
                    audio_result['vocals'] = tmp_result['vocals']
                    audio_result['accompaniment'] = tmp_result['instument']
                    result = audio_result
            else:
                result = tmp_result

            # 创建一个字典，包含音乐数据和ID
            ret_data_to_pickle = {
                'ret_data': result,
                'task_id': task_id
            }
            size_in_bytes = deep_getsizeof(ret_data_to_pickle, set())
            print(f"Size of pre_serialized object: {size_in_bytes} bytes")
            # 将字典 pickle
            pickled_ret_data = pickle.dumps(ret_data_to_pickle)
            # 获取序列化对象的大小（字节为单位）
            size_in_bytes = len(pickled_ret_data)
            print(f"Size of serialized object: {size_in_bytes} bytes")
            size_in_kb = size_in_bytes / 1024  # 转换为千字节
            print(f"Size of serialized object: {size_in_kb} KB")
            r.rpush(f'result_{type}_{task_id}', pickled_ret_data)
            # 为整个列表设置生存时间（例如，300 秒）
            r.expire('mylist', g_redis_time)
            print(f'algo_finish_{type}_{task_id}')
    
    except Exception as e:
        print(f"An error occurred in process {type}: {e}")
        traceback.print_exc()  # This will print the stack trace

    finally:
        print(f"Finished processing {type}")        
        sys.exit(1)
        
  

def process_redis_del_thread(redis_host, redis_port, redis_db,redis_health_check_interval):
        while True:
            cleanup_expired_items(redis_host, redis_port, redis_db,redis_health_check_interval)
            time.sleep(g_redis_time)







def cleanup_expired_items(redis_host, redis_port, redis_db,redis_health_check_interval):
    r = redis.Redis(host=redis_host, port=redis_port, db=redis_db,health_check_interval=redis_health_check_interval)
    list_names = ['separate_6_instruments','accompaniment','vocals','piano_transcription','singing_transcription',
                  'bass_transcription','drums_transcription','guitar_transcription']
    for list_name in list_names:
        list_length = r.llen(list_name)  # 获取列表的初始长
        for _ in range(list_length):
            pipe = r.pipeline()
            # 使用 WATCH 命令监视一个或多个键，如果在事务执行之前这些键被其他客户端修改了，事务将被中断
            try:
                pipe.watch(list_name)
                # 开始事务
                pipe.multi()
                pickle_data = pipe.lpop(list_name).execute()[0]
                if pickle_data:
                    unpickled_data = pickle.loads(pickle_data)
                    # Unpickling 数据
                    expiration_time = unpickled_data['expiration_time']
                    if expiration_time > time.time():
                        # 元素未过期，将其放回列表
                        pipe.rpush(list_name, pickle.dumps(unpickled_data))  # 数据重新打包
                        pipe.execute()  # 执行事务
                    else:
                        print(f"Removed expired item: {expiration_time}")
            except redis.WatchError:
                print("WatchError: The watched key was modified, transaction aborted.")
                continue


if __name__ == '__main__':
    algo_type = sys.argv[1]
    redis_host = sys.argv[2]
    redis_port = int(sys.argv[3])
    redis_db = int(sys.argv[4])
    redis_health_check_interval = int(sys.argv[5])
    process_audio(algo_type, redis_host, redis_port, redis_db,redis_health_check_interval)
            


    
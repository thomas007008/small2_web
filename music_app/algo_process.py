from multiprocessing import Pool, current_process

# from .process_audio_separator_main import AudioSeparatorMain
from .process_music_separation_mdx23 import MusicSeparationMdx23

from .process_new_convert_midi import NewConvertMidiPiano 

from .public_func import deep_getsizeof

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
    # if processor_type == 'accompaniment':
    #     processor = MusicSourceSeparationAccompaniment()
    # elif processor_type == 'vocals':
    #     processor = MusicSourceSeparationVocals()
    
    if processor_type == 'accompaniment_or_vocals':
        processor = MusicSeparationMdx23()
    elif processor_type == 'singing_transcription':
        # processor = SingingTranscription()
        processor = NewConvertMidiPiano(algo_type='vocal')
   
    else:
        print('error!no algo_type found!,type is {processor_type}')
    print(f"Initialized processor for {current_process().name},{processor_type}")
    return processor

def handle_signal(signum, frame):
    if(28 == signum):
        print(f"Received signal return: {signum} in process: {multiprocessing.current_process().name}")
        # 恢复默认信号处理行为
        return signal.SIG_DFL
    pid = os.getpid()
    print(f"exception process,pid={pid}")
    print(f"Received signal {signum} from frame {frame}")
    print(f"Received signal: {signum} in process: {multiprocessing.current_process().name}")
    traceback.print_stack(frame)
    # 退出整个进程
    sys.exit()

def process_test(name,started_event):
    print(f"Start process_test{name},{started_event}")
    # started_event.set()
    print(f"finish process_test")
    while True:
        time.sleep(5)

def send_heartbeat():
    while True:
        # print("Heartbeat")
        time.sleep(10)


def process_audio(type,started_event):
    try:
        print(f"Start processing {type}")
        started_event.set()
        pid = os.getpid()  # 获取当前进程的PID
        print(f"Init {type},pid={pid}")
        # 获取当前进程对象
        current_process = multiprocessing.current_process()
        print(f"current_process {type},pid={current_process.pid}")
        processor = init_worker(type)

        # 获取所有可用信号的列表
        signals_list = [i for i in dir(signal) if i.startswith("SIG") and not i.startswith("SIG_")]
        # 为每个信号注册处理函数
        for s in signals_list:
            try:
                signum = getattr(signal, s)
                signal.signal(signum, handle_signal)
                print(f"Handler registered for {s}")
            except Exception as e:
                print(f"Could not register handler for {s}: {e}")

        # signal.signal(signal.SIGUSR1, handle_signal)
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB,health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL)
        
         # 启动心跳线程
        heartbeat_thread = threading.Thread(target=send_heartbeat)
        heartbeat_thread.daemon = True
        heartbeat_thread.start()
        
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
            print("process_audio type",type)
            if type == 'accompaniment_or_vocals':
                print("process_audio separation_algo_type ",separation_algo_type)
                print("process_audio tmp_result ",tmp_result)
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
            print("process_audio result ",result)
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


class process_manage:
    def __init__(self):
        print("process_manage __init__")
        self.init()

    def init(self):
        multiprocessing.set_start_method('spawn')
        # 创建一个包含特定数量进程的进程池（例如4个进程）
        print("process_manage init(self)")
        # 初始化时创建一个字典来存储进程池
        self.pools = {}
        process_num = 1

        # self.pool_separate_6_instruments = Pool(processes=process_num)
        self.pool_accompaniment_or_vocals = Pool(processes=process_num)
        # self.pool_process_piano_transcription = Pool(processes=process_num)
        self.pool_process_singing_transcription = Pool(processes=process_num)
        # self.pool_process_drums_transcription = Pool(processes=process_num)
        # self.pool_process_guitar_transcription = Pool(processes=process_num)
        # self.pool_process_bass_transcription = Pool(processes=process_num)


        print("process_manage pool finish")

        # self.pools['accompaniment'] = self.pool_accompaniment
        # self.pools['separate_6_instruments'] = self.pool_separate_6_instruments
        # self.pools['vocals'] = self.pool_vocals
        self.pools['accompaniment_or_vocals'] = self.pool_accompaniment_or_vocals
        # self.pools['piano_transcription'] = self.pool_process_piano_transcription
        self.pools['singing_transcription'] = self.pool_process_singing_transcription
        # self.pools['bass_transcription'] = self.pool_process_bass_transcription
        # self.pools['drums_transcription'] = self.pool_process_drums_transcription
        # self.pools['guitar_transcription'] = self.pool_process_guitar_transcription

        print("process_manage pools= finish")
        
        # 将进程设置为守护进程

        # self.pool_separate_6_instruments.daemon = True
        self.pool_accompaniment_or_vocals.daemon = True
        # self.pool_process_piano_transcription.daemon = True
        self.pool_process_singing_transcription.daemon = True
        # self.pool_process_bass_transcription.daemon = True
        # self.pool_process_drums_transcription.daemon = True
        # self.pool_process_guitar_transcription.daemon = True

        self.started_event_list = []


        # 使用 pool.apply_async 异步地在进程池中运行 algorithm_process 函数
        # for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
        #     with multiprocessing.Manager() as manager:
        #         event = manager.Event()
        #         self.pool_separate_6_instruments.apply_async(process_audio, ('separate_6_instruments',event,))
        #         print(f"separate_6_instruments process start wait...")
        #         event.wait()       
        #         print(f"separate_6_instruments process start success")
        for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
            with multiprocessing.Manager() as manager:
                event = manager.Event()
                self.pool_accompaniment_or_vocals.apply_async(process_audio, args=('accompaniment_or_vocals',event))
                event.wait()
                print(f"accompaniment_or_vocals process start success")

        # for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
        #     with multiprocessing.Manager() as manager:
        #         event = manager.Event()
        #         self.pool_process_piano_transcription.apply_async(process_audio, args=('piano_transcription',event))
        #         event.wait()
        #         print(f"piano_transcription process start success")
        # time.sleep(5)
        for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
            with multiprocessing.Manager() as manager:
                event = manager.Event()
                self.pool_process_singing_transcription.apply_async(process_audio, args=('singing_transcription',event))
                event.wait()
                print(f"singing_transcription process start success")
        # time.sleep(5)

        # for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
        #     with multiprocessing.Manager() as manager:
        #         event = manager.Event()
        #         self.pool_process_bass_transcription.apply_async(process_audio, args=('bass_transcription',event))
        #         event.wait()
        #         print(f"bass_transcription process start success")

        # for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
        #     with multiprocessing.Manager() as manager:
        #         event = manager.Event()
        #         self.pool_process_drums_transcription.apply_async(process_audio, args=('drums_transcription',event))
        #         event.wait()
        #         print(f"drums_transcription process start success")

        # for _ in range(process_num):  # 因为有4个进程，所以我们执行4次
        #     with multiprocessing.Manager() as manager:
        #         event = manager.Event()
        #         self.pool_process_guitar_transcription.apply_async(process_audio, args=('guitar_transcription',event))
        #         event.wait()
        #         print(f"guitar_transcription process start success")


        print("process_manage apply_async= finish")
       

        t_process_check= threading.Thread(target=self.process_check_schedule_thread)
        t_process_check.start()

        t_process_redis_del= threading.Thread(target=self.process_redis_del_thread)
        t_process_redis_del.start()

        print("process_manage init(finishs)")

        # signal.signal(signal.SIGINT, self.main_signal_handler)
  

    def main_signal_handler(self,signal, frame):
        print('You pressed Ctrl+C!')
        # self.pool_accompaniment.terminate()
        # self.pool_accompaniment.join()

        # self.pool_separate_6_instruments.terminate()
        # self.pool_separate_6_instruments.join()

        # self.pool_vocals.terminate()
        # self.pool_vocals.join()

        self.pool_accompaniment_or_vocals.terminate()
        self.pool_accompaniment_or_vocals.join()

        # self.pool_process_piano_transcription.terminate()
        # self.pool_process_piano_transcription.join()

        self.pool_process_singing_transcription.terminate()
        self.pool_process_singing_transcription.join()

        sys.exit(0)

    def process_check_schedule_thread(self):
        print("all process start success!begin monitor")
        while True:
            self.monitor_processes()
            time.sleep(60)  # wait for 60 seconds
        
    def process_redis_del_thread(self):
        while True:
            cleanup_expired_items()
            time.sleep(g_redis_time)



    def monitor_processes(self):
        while True:
            for task_type, pool in self.pools.items():
                new_processes = []
                for process in pool._pool:
                    if not process.is_alive():
                        print(f"Process for {task_type} is not alive. Restarting...")
                        process.terminate()
                        process.join()
                        with multiprocessing.Manager() as manager:
                            event = manager.Event()
                            print(f"Process for {task_type} stop")
                            new_process = multiprocessing.Process(target=process_audio, args=(task_type,event,))
                            new_process.start()
                            event.wait()
                            print(f"Process for start {task_type} successs")
                            new_processes.append(new_process)
                    else:
                        new_processes.append(process)
                pool._pool = new_processes
            time.sleep(30)





def cleanup_expired_items():
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB,health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL)
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

    
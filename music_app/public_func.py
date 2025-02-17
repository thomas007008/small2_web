import random, string
import os
import time
import sys
from datetime import datetime
from pydub import AudioSegment
from pydub.effects import normalize
from pathlib import Path
import wave
from mido import MidiFile, MetaMessage,MidiTrack,Message
import numpy
import io
import soundfile
import shutil

# from django.db import transaction
# from .models import SessionFile

import json

def generate_verification_code():
    """ 生成6位数字验证码 """
    code = ''.join(random.choices(string.digits, k=6))
    return code

def delete_file(path):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        error_message = f"Error deleting file: {e}"
        print(error_message)

def generate_filename():
    # 获取当前时间
    now = datetime.now()
    
    # 创建一个包含日期和时间的字符串，精确到分
    timestamp_str = now.strftime("%m%d%H%M")
    
    # 返回作为文件名的字符串
    return timestamp_str

def generate_long_filename():
    # 获取当前时间
    now = datetime.now()
    
    # 创建一个包含日期和时间的字符串，精确到毫秒
    timestamp_str = now.strftime("%Y%m%d_%H%M%S_") + f"{now.microsecond//1000}"
    
    # 返回作为文件名的字符串
    return timestamp_str

def cut_audio(input_file,start_time = None,end_time = None):
    # 加载MP3文件
    audio = AudioSegment.from_file(input_file)
    if((start_time != None) and (end_time != None)):
        audio = audio[start_time:end_time] #单位毫秒
    return audio



def split_audio(input_file, chunk_length_ms,start_time = None,end_time = None):
   
    # 加载MP3文件
    audio = AudioSegment.from_file(input_file)

    bit_depth = audio.sample_width * 8

    if((start_time != None) and (end_time != None)):
        audio = audio[start_time:end_time] #单位毫秒
    
    # 计算分段数量
    chunks = 0

    if len(audio) % chunk_length_ms == 0:
        chunks = len(audio) // chunk_length_ms
    else:
        chunks = len(audio) // chunk_length_ms + 1

    # 在内存中存储分段
    audio_chunks = []
    
    # 分割音频并导出
    for i in range(chunks):
        # 计算分段的开始和结束时间
        start = i * chunk_length_ms
        end = start + chunk_length_ms
        
        # 切割音频
        chunk = audio[start:end]

        print(f"chunk_len {len(chunk)},start {start},end {end}")
        
        # 将音频分段添加到列表中
        audio_chunks.append(chunk)


    return audio_chunks,chunks,bit_depth,len(audio)



def split_audio_overlap(input_file, chunk_length_ms,overlap_time_ms = 10000,start_time = None,end_time = None):
   
    # 加载MP3文件
    audio = AudioSegment.from_file(input_file)

    bit_depth = audio.sample_width * 8

    if((start_time != None) and (end_time != None)):
        audio = audio[start_time:end_time] #单位毫秒
    
    print("start_time",start_time)
    print("end_time",end_time)
    print("len(audio)",len(audio))
    print("chunk_length_ms",chunk_length_ms)
    # 计算分段数量
    chunks = 0

    if len(audio) % chunk_length_ms == 0:
        chunks = len(audio) // chunk_length_ms
    else:
        chunks = len(audio) // chunk_length_ms + 1

    # 在内存中存储分段
    audio_chunks = []
    audio_chunks_origin = []
    #60 60 60 60 18
    # 分割音频并导出
    print("split_chunks",chunks)
    for i in range(chunks):
        # 计算分段的开始和结束时间
        start = i * chunk_length_ms
        start = start - overlap_time_ms
        end = 0
        if start <= 0:
            start = 0
            end = start + chunk_length_ms
        else:
            end = start + chunk_length_ms+ overlap_time_ms
        
        print("split_i",i)
        print("split_start",start/1000)
        print("split_end",end/1000)
        # 切割音频
        chunk = audio[start:end]
        
        # 将音频分段添加到列表中
        audio_chunks.append(chunk)

        start_origin = i * chunk_length_ms
        end_origin = start_origin + chunk_length_ms
        
        # 切割音频
        chunk_origin = audio[start_origin:end_origin]
        
        # 将音频分段添加到列表中
        audio_chunks_origin.append(chunk_origin)


    return audio_chunks,audio_chunks_origin,chunks,bit_depth




def deep_getsizeof(o, ids):
    """深度递归计算对象的大小"""
    d = sys.getsizeof(o)
    if id(o) in ids:
        return 0

    # 记录已访问对象的ID以防止循环引用
    ids.add(id(o))

    if isinstance(o, str) or isinstance(o, bytes):
        return d

    if isinstance(o, dict):
        return d + sum(deep_getsizeof(k, ids) + deep_getsizeof(v, ids) for k, v in o.items())

    if isinstance(o, (list, tuple, set, frozenset)):
        return d + sum(deep_getsizeof(i, ids) for i in o)

    return d

def check_audio_channels(audio_array):
    # shape = audio_array.shape
    
    # # 如果数组是一维的，那么它是单声道的
    # if len(shape) == 1:
    #     return "Single_channel"
    
    # # 如果数组是二维的，并且第一个维度的长度大于 1，那么它是多声道的
    # elif len(shape) == 2 and shape[0] > 1:
    #     return f"Multiple_channels"
    
    # # 如果数组是二维的，但第一个维度的长度为 1，那么它是单声道的
    # elif len(shape) == 2 and shape[0] == 1:
    #     return "Single_channel"
    
    # else:
    #     return "Unknown format"
    # 这里假设audio_data是一个numpy数组
    # 你需要根据实际情况编写此函数来检查音频是单通道还是双通道
    if audio_array.ndim == 1 or audio_array.shape[1] == 1:
        return "Single_channel"
    else:
        return f"Multiple_channels"

def get_audio_bit_depth_using_pydub(filename):
    audio = AudioSegment.from_file(filename)
    return audio.sample_width * 8



def concat_wav(files, output):
    with wave.open(output, 'wb') as outfile:
        for wav_file in files:
            with wave.open(wav_file, 'rb') as infile:
                if not outfile.getnframes():
                    outfile.setparams(infile.getparams())
                outfile.writeframes(infile.readframes(infile.getnframes()))
              
def save_music(audio_data,file_path_str,format,bit_depth,sr,average_rms,db_change=0):
    

    channel = 1
    ret = check_audio_channels(audio_data)
    if(ret == "Single_channel"):
        channel = 1
    else:
        channel = 2
    print("channel",channel)
    max_int_value = numpy.iinfo(numpy.int32).max
    dtype = numpy.int32
    if bit_depth == 16:
        max_int_value = numpy.iinfo(numpy.int16).max
        dtype = numpy.int16
    elif bit_depth == 24:
        # 24位整数的最大值是 2^23 - 1
        max_int_value = 2**23 - 1  # 24位整数的最大值是 2^23 - 1
        # 对于24位，我们使用np.int32作为容器，因为没有np.int24
        dtype = numpy.int32 # 对于24位，我们使用np.int32作为容器
    elif bit_depth == 32:
        max_int_value = numpy.iinfo(numpy.int32).max
        dtype = numpy.int32
    else:
        raise ValueError("Unsupported bit depth is",bit_depth)

    # 将浮点数组转换为整数
    print("dtype",dtype)
    print("max_int_value",max_int_value)

    # source_int = (audio_data * max_int_value).astype(dtype)

    # 将浮点数组转换为整数
    source_int = numpy.clip(audio_data * max_int_value, -max_int_value, max_int_value).astype(dtype)

    # 创建音频段
    sample_width = dtype().itemsize
    audio_segment = AudioSegment.from_raw(io.BytesIO(source_int.tobytes()), frame_rate=sr, sample_width=sample_width, channels=channel)
    # audio_segment.export(file_path_str, format=format, bitrate="192k") #########
    # audio_segment.export(file_path_str, format='wav', bitrate="192k") #########
    adjusted_audio = normalize(audio_segment + db_change)

    # print("adjusted_audio.frame_rate",adjusted_audio.frame_rate)

    adjusted_audio.export(file_path_str, format=format, bitrate="192k")


def set_midi_track_name(midi_file,new_name): 
    # 找到并修改指定轨道的名称
    for track in midi_file.tracks:
        for i, message in enumerate(track):
            if message.type == 'track_name':
                # 替换现有的 track_name 消息
                track[i] = MetaMessage('track_name', name=new_name, time=0)
                print(f"change track_name is {new_name}")
                break
        else:
            # 如果轨道没有 track_name 消息，则添加一个
            print(f"new track_name is {new_name}")
            track.insert(0, MetaMessage('track_name', name=new_name, time=0))
    
    return midi_file

def change_instrument_auto_by_name(midi_file, track_name):
    new_program = None
    new_channel = None
    if(track_name == 'bass'):
        new_program = 32
    elif(track_name == 'guitar'):
        new_program = 25
    elif(track_name == 'vocal'):
        new_program = 41
    elif(track_name == 'drums'):
        new_program = 0
        new_channel = 10
    elif(track_name == 'piano'):
        new_program = 0
        
    return change_instrument_by_name(midi_file, track_name, new_program,new_channel)

def midi_drum_process(midi_file):
    for message in midi_file.tracks[0]:
        message_str = str(message)

        if 'channel' in message_str:
            message.channel = 9
            # message.channel = 9
            pass
        if 'program' in message_str:
            message.program = 0
            pass
    
    for message in midi_file.tracks[1]:
        message_str = str(message)
        if 'note' in message_str:
            if message.note == 0:
                message.note = 36
            if message.note == 1:
                message.note = 35
            if message.note == 2:
                message.note = 36
            if message.note == 3:
                message.note = 35
            if message.note == 4:
                message.note = 36
            if message.note == 5:
                message.note = 35  
            if message.note == 6:
                message.note = 36 
            if message.note == 7:
                message.note = 35 
            if message.note == 8:
                message.note = 36 
            if message.note == 9:
                message.note = 35 
            if message.note == 10:
                message.note = 36 
            if message.note == 11:
                message.note = 35 
            if message.note == 12:
                message.note = 35 
            if message.note == 13:
                message.note = 36 
            if message.note == 14:
                message.note = 36 
            if message.note == 15:
                message.note = 36 
            if message.note == 16:
                message.note = 36 
            if message.note == 97:
                message.note = 38  
            if message.note == 98:
                message.note = 40 
            if message.note == 99:
                message.note = 38 
            if message.note == 100:
                message.note = 40 
            if message.note == 101:
                message.note = 40 
            if message.note == 102:
                message.note = 38 
            if message.note == 103:
                message.note = 40 
            if message.note == 104:
                message.note = 38 
            if message.note == 105:
                message.note = 38 
            if message.note == 106:
                message.note = 40 
            if message.note == 107:
                message.note = 38 
            if message.note == 108:
                message.note = 40 
            if message.note == 109:
                message.note = 38 
            if message.note == 110:
                message.note = 40 
            if message.note == 111:
                message.note = 38 
            if message.note == 112:
                message.note = 38 
            if message.note == 113:
                message.note = 40 
            if message.note == 114:
                message.note = 38 
            if message.note == 115:
                message.note = 40 
            if message.note == 116:
                message.note = 38 
            if message.note == 117:
                message.note = 38 
            if message.note == 118:
                message.note = 38 
            if message.note == 119:
                message.note = 38 
            if message.note == 120:
                message.note = 40 
            if message.note == 121:
                message.note = 38 
            if message.note == 122:
                message.note = 40 
            if message.note == 123:
                message.note = 38 
            if message.note == 124:
                message.note = 38 
            if message.note == 125:
                message.note = 38 
            if message.note == 126:
                message.note = 38 
            if message.note == 127:
                message.note = 40 
                         
        # #     # if message.note > 57:
        # #     #     message.note = 57
        # #     # elif message.note < 35:
        # #     #     message.note = 35
        #     message.note = 35

            
        if 'channel' in message_str:
            # message.channel = 9
            message.channel = 9
            pass
        if 'program' in message_str:
            message.program = 0
            pass
        # if 'velocity' in message_str:
        #     if message.velocity != 0:
        #         message.velocity = 120
        #     # else:
            #     message.time = 6
            # pass
        # if 'note' in message_str:
        #     message.note = 38
        # if 'control_change' in message_str:
        #     midi_file.tracks[1].remove(message)
        #     pass
        
    return midi_file


def midi_tempo_process(midi_file):
    # return midi_file 
    # 打印每个轨道的速度事件
    tempo_old = 0
    tempo_new = 0
    for i, track in enumerate(midi_file.tracks):
        print(f"Track {i}:")
        for msg in track:
            if msg.type == 'set_tempo':
                tempo_old = msg.tempo
    if tempo_old == 626304:
        tempo_new = 500000
    elif tempo_old == 500000:
        tempo_new = 626304

    # if tempo_old == 626304:
    #     tempo_new = 499584
    # elif tempo_old == 499584:
    #     tempo_new = 626304

    for track in midi_file.tracks:
        track.append(MetaMessage('set_tempo', tempo=tempo_new, time=0)) 
    return midi_file 

def midi_tempo_process_new(midi_file):
    # 打印每个轨道的速度事件
    tempo_old = 0
    tempo_new = 0
    for i, track in enumerate(midi_file.tracks):
        print(f"Track {i}:")
        for msg in track:
            if msg.type == 'set_tempo':
                tempo_old = msg.tempo
    if tempo_old == 626304:
        tempo_new = 500000
    elif tempo_old == 500000:
        tempo_new = 626304

    # if tempo_old == 626304:
    #     tempo_new = 499584
    # elif tempo_old == 499584:
    #     tempo_new = 626304

    for track in midi_file.tracks:
        track.append(MetaMessage('set_tempo', tempo=tempo_new, time=0)) 
    return midi_file 

def change_instrument_by_name(midi_file, track_name, new_program, new_channel=None):
    # 加载 MIDI 文件
    modified = False
    
    for track in midi_file.tracks:
        track_name_found = False
        for msg in track:
            if msg.type == 'track_name' and msg.name == track_name:
                track_name_found = True
                break

        if track_name_found:
            for msg in track:
                if 'channel' in str(msg):
                    # message.channel = 10
                    if new_channel is not None:
                        msg.channel = new_channel

                if msg.type == 'program_change':
                    msg.program = new_program
                    modified = True
                    break

            if not modified:
                # 如果轨道中没有 program_change 消息，就添加一个新的消息
                if new_channel is not None:  
                    track.insert(0, Message('program_change', program=new_program, channel=new_channel, time=0))
                else:
                    track.insert(0, Message('program_change', program=new_program, time=0))
                    
                
            break
    
    return midi_file

def create_one_min_empty_midi():
    # Parameters
    ticks_per_beat = 480
    beats_per_second = 2
    microseconds_per_beat = 626304

    # Create a new MIDI file with the specified ticks per beat
    midi_file = MidiFile()
    midi_file.ticks_per_beat = ticks_per_beat

    # Track 0: Meta information
    track0 = MidiTrack()
    midi_file.tracks.append(track0)
    track0.append(MetaMessage('set_tempo', tempo=microseconds_per_beat, time=0))
    track0.append(MetaMessage('time_signature', numerator=4, denominator=4, time=0))

    # Calculate the total number of ticks for one minute
    ticks_per_minute = ticks_per_beat * beats_per_second 

    # Add a long enough pause to make the track last one minute
    # We do this by adding an 'end_of_track' event after one minute's worth of ticks
    track0.append(MetaMessage('end_of_track', time=ticks_per_minute))

    return midi_file

def calculate_midi_length(mid):
    total_length = 0

    for track in mid.tracks:
        track_length = 0
        elapsed_time = 0

        for msg in track:
            elapsed_time += msg.time
            if msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                track_length = max(track_length, elapsed_time)

        total_length = max(total_length, track_length)

    return total_length

def combine_midi_bytime(midi_files):
    
    # 创建一个新的MIDI文件
    combined_midi = MidiFile()

    # 合并文件
    for mid in midi_files:
        # mid = MidiFile(file)
        for i, track in enumerate(mid.tracks):
            if len(combined_midi.tracks) <= i:
                combined_midi.tracks.append(MidiTrack())
            for msg in track:
                combined_midi.tracks[i].append(msg.copy(time=msg.time))
    return combined_midi









# from mido import MidiFile, MidiTrack, Message

def calculate_midi_length(midi_file):
    max_time = 0
    for track in midi_file.tracks:
        current_time = 0
        for msg in track:
            current_time += msg.time
        if current_time > max_time:
            max_time = current_time
    return max_time

def combine_midi_bytime_overlap(midi_files, process_overlap_time=5):
    print("len(midi_files)",len(midi_files))
    if len(midi_files) == 0:
        return None
    
    if len(midi_files) == 1:
        return midi_files[0]

    # 创建一个新的MIDI文件
    combined_midi = MidiFile(ticks_per_beat=midi_files[0].ticks_per_beat)

    # 处理 Track 0，合并全局信息
    combined_track_0 = MidiTrack()
    combined_midi.tracks.append(combined_track_0)
    for msg in midi_files[0].tracks[0]:
        if msg.type in ['set_tempo', 'time_signature', 'key_signature']:
            combined_track_0.append(msg.copy(time=msg.time))
    combined_track_0.append(MetaMessage('end_of_track'))

    # 计算需要排除的ticks数
    ticks_per_beat = midi_files[0].ticks_per_beat
    print("ticks_per_beat",ticks_per_beat)
    tempo_msgs = [msg for track in midi_files[0].tracks for msg in track if msg.type == 'set_tempo']
    if not tempo_msgs:
        print("No tempo message found in the MIDI file. Using default tempo of 120 BPM.")
        tempo = 500000  # 默认tempo为120 BPM
    else:
        print("tempo_msgs[0].tempo",tempo_msgs[0].tempo)
        tempo = tempo_msgs[0].tempo
    tempo = 500000
    ticks_per_second = ticks_per_beat / (tempo / 1000000)
    overlap_in_ticks = int(process_overlap_time * ticks_per_second)  # overlap_time秒
    print("ticks_per_second",ticks_per_second)
    print("overlap_in_ticks",overlap_in_ticks)

    # total_ticks = 0  # 记录当前总的ticks，用于调整下一个文件的起始时间

    # 合并文件
    for index in range(len(midi_files)):
        current_file = midi_files[index]
        current_file_length = calculate_midi_length(current_file)
        print("current_file_length",current_file_length)

        next_file_length = 0
        if index < len(midi_files) - 1:
            next_file = midi_files[index + 1]
            next_file_length = calculate_midi_length(next_file)
        else:
            next_file = None
            next_file_length = 0
            break

        part1_tracks = []
        part2_tracks = []

        for track in current_file.tracks:
            abs_time = 0
            part1_track = []
            for msg in track:
                abs_time += msg.time
                if abs_time < current_file_length - overlap_in_ticks:
                    part1_track.append(msg.copy(time=msg.time))
            part1_tracks.append(part1_track)
        
        if next_file:
            for track in next_file.tracks:
                abs_time = 0
                part2_track = []
                for msg in track:
                    abs_time += msg.time
                    if (len(midi_files) - 2 == index):
                        if abs_time >= overlap_in_ticks:
                            part2_track.append(msg.copy(time=msg.time))
                    else:
                        if abs_time >= overlap_in_ticks and abs_time < next_file_length - overlap_in_ticks:
                            part2_track.append(msg.copy(time=msg.time)) 
                part2_tracks.append(part2_track)

        if (index == 0):
            for i in range(max(len(part1_tracks), len(part2_tracks))):
                if len(combined_midi.tracks) <= i:
                    combined_midi.tracks.append(MidiTrack())

                if i != 0 and i < len(part1_tracks):
                    for j, msg in enumerate(part1_tracks[i]):
                        combined_midi.tracks[i].append(msg.copy(time=msg.time))


                if next_file and  i != 0 and i < len(part2_tracks):
                    for j, msg in enumerate(part2_tracks[i]):
                        combined_midi.tracks[i].append(msg.copy(time=msg.time))
                  
        else:
            # combine_midi_length = calculate_midi_length(combined_midi)
            # for track in combined_midi.tracks[1:]:
            #     abs_time = 0
            #     messages_to_remove = []
            #     for msg in track:
            #         abs_time += msg.time
            #         if abs_time > combine_midi_length - overlap_in_ticks:
            #             messages_to_remove.append(msg)
            #     for msg in messages_to_remove:
            #         track.remove(msg)

            for i in range(len(part2_tracks)):
                if next_file and i != 0 and i < len(part2_tracks):
                    for j, msg in enumerate(part2_tracks[i]):
                        combined_midi.tracks[i].append(msg.copy(time=msg.time))
                        # current_time += delta_time
    
    all_time = calculate_midi_length(combined_midi)
    print("all_time",all_time)
    # combined_midi = midi_tempo_process_new(combined_midi)

    # 遍历文件中的每一个轨道
    # for i, track in enumerate(combined_midi.tracks):
    #     print(f'Track {i}: {track.name}')
    #     for message in track:
    #         print(message)

    return combined_midi






def combine_midi_bytracks(midi_files):
    # 创建一个新的MIDI文件
    combined_midi = MidiFile()

    # 合并文件
    for mid in midi_files:
        # mid = MidiFile(file)
        for track in mid.tracks:
            new_track = MidiTrack()
            combined_midi.tracks.append(new_track)
            for msg in track:
                new_track.append(msg.copy(time=msg.time))
    return combined_midi


def copy_file(source, destination):
    """
    复制文件从source到destination目录。
    如果destination目录不存在，将会被创建。
    
    参数:
    source (str): 源文件路径。
    destination (str): 目标文件路径。
    """
    # 确保目标目录存在，如果不存在，则创建
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # 复制文件
    shutil.copy2(source, destination)  # copy2保留元数据



def is_safe_path(base_path, target, follow_symlinks=True):
    """
    检查目标路径是否在基本路径下，防止目录遍历。
    """
    # 使用realpath来解析任何符号链接
    if follow_symlinks:
        real_target = os.path.realpath(target)
    else:
        real_target = os.path.abspath(target)

    return real_target.startswith(base_path)
    

def safe_join(base_path, file_path):
    if file_path.startswith('/'):
        file_path = file_path[1:]

    file_path = file_path.strip()  # 去除空白字符
    full_file_path = os.path.normpath(os.path.join(base_path, file_path))

    return full_file_path

def multichannel_audio_process(audio):
    if audio.shape[1] == 2:
        # If the audio is already interleaved, ensure it's in the correct order
        # Check if the array is Fortran contiguous (column-major)
        if audio.flags["F_CONTIGUOUS"]:
            # Convert to C contiguous (row-major)
            audio = numpy.ascontiguousarray(audio)
        # Otherwise, perform interleaving
        else:
            stereo_interleaved = numpy.empty((2 * audio.shape[0],), dtype=numpy.int16)
            # Left channel
            stereo_interleaved[0::2] = audio[:, 0]
            # Right channel
            stereo_interleaved[1::2] = audio[:, 1]
            audio = stereo_interleaved
    return audio






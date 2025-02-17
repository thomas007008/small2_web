import numpy as np
import os
import pathlib
import time
import soundfile
from pathlib import Path
import librosa
from .public_func import split_audio,multichannel_audio_process
import soundfile as sf

import torch
import io
import mido
import json
from .algo.python_audio_separator_main.audio_separator.separator import Separator


# model = EnsembleDemucsMDXMusicSeparationModel(options)

class AudioSeparatorMain:
    def __init__(self):
        self.init()

    def init(self):
        print("AudioSeparatorMain init")



        self.separator = Separator()
        self.separator.load_model(model_filename='model_bs_roformer_ep_317_sdr_12.9755.ckpt')

        print("AudioSeparatorMain finish")

    def process_algo(self, audio,sr=44100,source_type_set=[]):
        print("AudioSeparatorMain")
        # input_dict = {'waveform': audio}
        # import pdb; pdb.set_trace()
        result = self.separator.separate_ram(audio)

        secondary_source = result['secondary_source'] 

        primary_source = result['primary_source']

        result['instument'] = secondary_source = multichannel_audio_process(secondary_source)

        result['vocals'] = primary_source = multichannel_audio_process(primary_source)

        print("AudioSeparatorMain_result",result)
        soundfile.write('secondary_source.wav', secondary_source, sr, subtype='FLOAT')
        soundfile.write('primary_source.wav', primary_source, sr, subtype='FLOAT')
        return result
    


def process_folder(input_folder, output_folder, sr=44100):
    audio_separator_main = AudioSeparatorMain()

    input_folder_path = Path(input_folder)
    output_folder_path = Path(output_folder)
    output_folder_path.mkdir(parents=True, exist_ok=True)

    audio_extensions = ["*.wav", "*.mp3", "*.flac"]

    for extension in audio_extensions:
        for audio_file in input_folder_path.glob(extension):
            print(f"Processing file: {audio_file}")
            
            # 加载音频文件
            try:
                audio, _ = librosa.load(audio_file, mono=False, sr=sr)
            except Exception as e:
                print(f"Error loading {audio_file}: {e}")
                continue

            # 转换为双声道
            if len(audio.shape) == 1:
                audio = np.stack([audio, audio], axis=0)

            # 处理音频，进行人声和背景音乐的分离
            try:
                result = audio_separator_main.process_algo(audio, sr)
            except Exception as e:
                print(f"Error processing {audio_file}: {e}")
                continue

            # 查看返回的结果
            print(f"Result keys: {list(result.keys())}")

            # 假设分离的结果中包含 'vocals' 和 'background'（具体内容取决于分离算法）
            for source, separated_audio in result.items():

                print(f"Processing source: {source}")
                print(f"Type of separated_audio: {type(separated_audio)}")
                print(f"Dtype of separated_audio: {separated_audio.dtype}")
                print(f"Shape of separated_audio: {separated_audio.shape}")
                print(f"Min value: {separated_audio.min()}, Max value: {separated_audio.max()}")

                if separated_audio.size == 0:
                    print(f"Error: Separated audio for source '{source}' is empty.")
                    continue

                # 检查和修正分离后的音频数据
                if not isinstance(separated_audio, np.ndarray):
                    separated_audio = np.array(separated_audio, dtype=np.float32)

                if len(separated_audio.shape) == 1:
                    separated_audio = np.stack([separated_audio, separated_audio], axis=0)

                separated_audio = np.clip(separated_audio, -1.0, 1.0)

                # 确保文件名安全
                safe_stem = "".join(c for c in audio_file.stem if c.isalnum() or c in "-_")
                output_file = output_folder_path / f"{safe_stem}_{source}.wav"

                # 写入文件
                try:
                    sf.write(output_file, separated_audio, sr, subtype='FLOAT')
                    print(f"Saved separated file: {output_file}")
                except Exception as e:
                    print(f"Error saving {output_file}: {e}")
                    continue

    print("All files processed!")



def main():
    # sr=44100
    # test_audio = np.random.uniform(-1.0, 1.0, (2, sr * 1))  # 1秒的立体声音频
    # sf.write('music_mdx23_output/test_output.wav', test_audio.T, sr, format='WAV', subtype='FLOAT')
    # print("Test audio file written successfully.")

    # return

    input_folder = "music_mdx23_input"
    output_folder = "music_mdx23_output"
    process_folder(input_folder, output_folder)



def main1():
    r"""An example of using bytesep in your programme. After installing bytesep, 
    users could copy and execute this file in any directory.
    """

    print("begin AudioSeparatorMain")

    # Build separator.
    audio_separator_main = AudioSeparatorMain()
    print("init=============>audio_separator_main")
    # exit()


    file_name = "yequ.mp3"
    audio, sr = librosa.load(file_name, mono=False, sr=44100)
    # Separate.
    separate_time = time.time()
    
    
    if len(audio.shape) == 1:
        audio = np.stack([audio, audio], axis=0)
    print("Input audio: {} Sample rate: {}".format(audio.shape, sr))
   
    audio_separator_main.process_algo(audio,sr)

    print(f"{file_name}:Done! {time.time() - separate_time:.3f} s")

if __name__ == '__main__':
    main()
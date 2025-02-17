import numpy as np
import os
import pathlib
import time
import soundfile
from pathlib import Path
import librosa
from .public_func import split_audio
import soundfile as sf

import torch
import io
import mido
import json
from .algo.MVSEP_MDX23.inference import EnsembleDemucsMDXMusicSeparationModelLowGPU


# model = EnsembleDemucsMDXMusicSeparationModel(options)

class MusicSeparationMdx23:
    def __init__(self):
        self.init()

    def init(self):
        print("MusicSeparationMdx23 init")

        options = {
            'cpu': False,  # 根据需要设定True或False
            'single_onnx': False,  # 根据需要设定True或False
            'use_kim_model_1': False,  # 根据需要设定True或False
            'overlap_large':0.25,
            'overlap_small':0.25,
            'chunk_size':100000,
            'large_gpu':False,
            'single_onnx':False
        }

        self.mdx23_model = EnsembleDemucsMDXMusicSeparationModelLowGPU(options)
        print("MusicSeparationMdx23 finish")

    def process_algo(self, audio,sr=44100,source_type_set=[]):
        print("MusicSeparationMdx23")
        # input_dict = {'waveform': audio}
        # import pdb; pdb.set_trace()
        result, sample_rates = self.mdx23_model.separate_music_file(audio.T,sr)
        inst = audio.T - result['vocals']
        result['instument'] = inst

        result['dis_piano'] = audio.T - result['piano']
        result['dis_guitar'] = audio.T - result['guitar']
        result['dis_bass'] = audio.T - result['bass']
        result['dis_drums'] = audio.T - result['drums']
        result['dis_vocals'] = result['instument']
        # instrumental part 1
        # inst2 = result['bass'] + result['drums'] + result['other']
        
        # soundfile.write('./inst2.wav', inst2, sr, subtype='FLOAT')
        # sf.write('yddqz_testtttt.wav', inst, sr, subtype='FLOAT')
        return result
    
def process_folder(input_folder, output_folder, sr=44100):
    music_separation_mdx = MusicSeparationMdx23()

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

            try:
                result = music_separation_mdx.process_algo(audio, sr)
            except Exception as e:
                print(f"Error processing {audio_file}: {e}")
                continue

            print(f"Result keys: {list(result.keys())}")

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

    print("begin MusicSeparationMdx23")

    # Build separator.
    music_separation_mdx = MusicSeparationMdx23()
    print("init=============>music_separation_mdx")
    # exit()
    # dummy audio
    input_dict = {'waveform': np.zeros((2, 44100 * 60))}

    file_name = "/home//workspace/music_site/music_mdx23_input/BOBO3.wav"
    audio, sr = librosa.load(file_name, mono=False, sr=44100)
    # Separate.
    separate_time = time.time()
    
    
    if len(audio.shape) == 1:
        audio = np.stack([audio, audio], axis=0)
    print("Input audio: {} Sample rate: {}".format(audio.shape, sr))
   
    music_separation_mdx.process_algo(audio,sr)

    print(f"{file_name}:Done! {time.time() - separate_time:.3f} s")

if __name__ == '__main__':
    main()
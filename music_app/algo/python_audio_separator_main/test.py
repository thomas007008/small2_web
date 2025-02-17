import time
from heapq import merge
from typing import Tuple
import librosa
import os
import tempfile
import shutil
from audio_separator.separator import Separator


separators = {
        "BS-RoFormer": Separator(output_dir=tempfile.gettempdir(), output_format="mp3"),
        "Mel-RoFormer": Separator(output_dir=tempfile.gettempdir(), output_format="mp3"),
        "HTDemucs-FT": Separator(output_dir=tempfile.gettempdir(), output_format="mp3"),
    }


def load():
    separators["BS-RoFormer"].load_model("model_bs_roformer_ep_317_sdr_12.9755.ckpt")
    separators["Mel-RoFormer"].load_model(
        "model_mel_band_roformer_ep_3005_sdr_11.4360.ckpt"
    )
    separators["HTDemucs-FT"].load_model("htdemucs_ft.yaml")


# def measure_duration(audio: str, model: str) -> int:
#     y, sr = librosa.load(audio, sr=44100)
#     return int(librosa.get_duration(y=y, sr=sr) / 3.0)


# @dynGPU(duration=measure_duration)
def separate(audio: str, model: str) -> Tuple[str, str]:
    # # audio, sr = librosa.load(audio, sr=44100)
    # separator = separators[model]
    # outs = separator.separate(audio)
    # outs = [os.path.join(tempfile.gettempdir(), out) for out in outs]
    # print(outs)
    # # roformers
    # if len(outs) == 2:
    #     return outs[1], outs[0]
    # # demucs
    # if len(outs) == 4:
    #     bgm = merge(outs[:3])
    #     return outs[3], bgm
    

    input = audio
    # output = "/content/output"#@param {type:"string"}

    separator = Separator(output_dir="./",output_format="mp3")

    # Vocals and Instrumental
    # vocals = os.path.join(output, 'Vocals.mp3')
    # instrumental = os.path.join(output, 'Instrumental.mp3')

    # Splitting a track into Vocal and Instrumental
    separator.load_model(model_filename='model_bs_roformer_ep_317_sdr_12.9755.ckpt')
    voc_inst = separator.separate(input)
    print(voc_inst)
    # os.rename(os.path.join(output, voc_inst[0]), instrumental) # Rename file to “Instrumental.wav”
    # os.rename(os.path.join(output, voc_inst[1]), vocals) # Rename file to “Vocals.wav”




def separate_mem(audio: str, model: str):
    print("begin separate_mem")

    separator = Separator()
    separator.load_model(model_filename='model_bs_roformer_ep_317_sdr_12.9755.ckpt')


    print("init=============>separate_mem")


    audio, sr = librosa.load(audio, mono=False, sr=44100)
    # Separate.
    separate_time = time.time()
    
    output_audio = separator.separate_ram(audio)


    print(f"{audio}:Done! {time.time() - separate_time:.3f} s")



if __name__ == "__main__":
    
    # load()

    # separate("/home//workspace/music_site/quanshijie.mp3", "BS-RoFormer")

    separate_mem("/home//workspace/music_site/yequ.mp3", "BS-RoFormer")
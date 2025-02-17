# from .algo.piano_transcription.pytorch.inference import PianoTranscription, load_audio
from .algo.new_convert_midi.pytorch.new_interface import NewConvertMidi, load_audio
import algo.new_convert_midi.utils.config as config
import torch
from pathlib import Path
import torch
import numpy as np
from .public_func import set_midi_track_name,create_one_min_empty_midi,change_instrument_by_name,change_instrument_auto_by_name,midi_tempo_process,midi_drum_process

import librosa
import time


# # Load audio
# (audio, _) = load_audio('/home//workspace/music_site/music_app/algo/piano_transcription/resources/cut_bach.mp3', sr=16000, mono=True)

# # Transcriptor

# # __init__(self, model_type, checkpoint_path=None, 
# #         segment_samples=16000*10, device=torch.device('cuda'), 
# #         post_processor_type='regression'):
# transcriptor = PianoTranscription(model_type='Note_pedal',checkpoint_path='./models/piano_transcripiton/CRNN_note_F1=0.9677_pedal_F1=0.9186.pth',device=torch.device('cpu'))    # 'cuda' | 'cpu'

# # Transcribe and write out to MIDI file
# transcribed_dict, midi_file = transcriptor.transcribe(audio, 'cut_liszt.mid',type=1)
# # print("done: ",transcribed_dict)








class NewConvertMidiPiano:
    def __init__(self,algo_type=''):
        self.init(algo_type)

    def init(self,algo_type):
        # 获取脚本文件所在的目录
        base_dir = Path(__file__).resolve().parent

        # 创建相对于脚本文件所在目录的路径
        new_convert_midi_piano_models_path = ''

        if(algo_type == 'bass'):
            new_convert_midi_piano_models_path = base_dir / "models" / "new_convert_midi" / "bass-gitar-singitout_fp16.engine"
        if(algo_type == 'guitar'):
            new_convert_midi_piano_models_path = base_dir / "models" / "new_convert_midi" / "bass-gitar-singitout_fp16.engine"
        if(algo_type == 'vocal'):
            new_convert_midi_piano_models_path = base_dir / "models" / "new_convert_midi" / "bass-gitar-singitout_fp16.engine"
        elif(algo_type == 'drums'):
            new_convert_midi_piano_models_path = base_dir / "models" / "new_convert_midi" / "drums_fp16.engine"

        self.algo_type = algo_type
        # NewConvertMidi(model_type, device=device, 
        # checkpoint_path=checkpoint_path, segment_samples=segment_samples, 
        # post_processor_type=post_processor_type, fp16 = fp16)

        sample_rate = config.sample_rate
        segment_samples = sample_rate * config.segment_seconds
        print("new_convert_midi_piano_models_path",new_convert_midi_piano_models_path)
        self.new_convert_midi_piano = NewConvertMidi(model_type='Note_pedal',device='cuda',
                                                     checkpoint_path=new_convert_midi_piano_models_path,
                                                     segment_samples=segment_samples,post_processor_type='regression', fp16 = True)    # 'cuda' | 'cpu'
        print("NewConvertMidiPiano finish")

    def process_algo(self, audio,sr=44100,source_type_set=[]):
        print("NewConvertMidiPiano")
        midi_file = None
        try:
            print("shape.......",audio.shape)
       
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)

            print("audio_resampled shape.......",audio.shape)

            transcribed_dict, midi_file = self.new_convert_midi_piano.transcribe(audio, 'yddqz_piano.mid',type=1)
            midi_file = set_midi_track_name(midi_file,self.algo_type)

            midi_file = change_instrument_auto_by_name(midi_file, self.algo_type)

            midi_file = midi_tempo_process(midi_file)

            if(self.algo_type == 'drums'):
                midi_file = midi_drum_process(midi_file)

        except IndexError as e:
            # 捕获并处理异常
            print("NewConvertMidiPiano:", e)
            midi_file = create_one_min_empty_midi()
            midi_file = set_midi_track_name(midi_file,self.algo_type)
        return midi_file
    

def main():
    r"""An example of using bytesep in your programme. After installing bytesep, 
    users could copy and execute this file in any directory.
    """

    print("begin MusicSeparationMdx23")

    # Build separator.
    convert_midi_piano = NewConvertMidiPiano(algo_type='vocal')

    # dummy audio
    input_dict = {'waveform': np.zeros((2, 44100 * 60))}

    # Separate.
    separate_time = time.time()
    
    audio, sr = librosa.load("lshs.mp3", mono=False, sr=44100)
    # if len(audio.shape) == 1:
    #     audio = np.stack([audio, audio], axis=0)
    print("Input audio: {} Sample rate: {}".format(audio.shape, sr))
   
    convert_midi_piano.process_algo(audio,sr)

    print("Done! {:.3f} s".format(time.time() - separate_time))

if __name__ == '__main__':
    main()

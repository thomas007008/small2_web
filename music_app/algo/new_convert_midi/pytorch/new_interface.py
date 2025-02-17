# -*- coding: utf-8 -*-
"""
Created on Fri Sep 22 11:45:12 2023

@author: Gezhi103
"""

import pycuda.autoinit
import numpy as np
import pycuda.driver as cuda
import tensorrt as trt
import torch
import os
import time
import cv2
import torchvision
import pdb
import common
import glob
import tqdm

TRT_LOGGER = trt.Logger()

def get_engine(onnx_file_path, engine_file_path="",fp16_mode=False):
    """Attempts to load a serialized engine if available, otherwise builds a new TensorRT engine and saves it."""
    # def build_engine():
    #     """Takes an ONNX file and creates a TensorRT engine to run inference with"""
    #     with trt.Builder(TRT_LOGGER) as builder, builder.create_network(common.EXPLICIT_BATCH) as network, builder.create_builder_config() as config, trt.OnnxParser(network, TRT_LOGGER) as parser, trt.Runtime(TRT_LOGGER) as runtime:
    #         config.max_workspace_size = 1 << 28 # 256MiB
    #         builder.max_batch_size = 1
    #         if pf16_mode is True:
    #             config.set_flag(trt.BuilderFlag.FP16)#这里的半精度和tensorrt7不同
    #             #config.flags = 1 <<int(trt.BuilderFlag.FP16)
    #         # Parse model file
    #         if not os.path.exists(onnx_file_path):
    #             print('ONNX file {} not found, please run yolov3_to_onnx.py first to generate it.'.format(onnx_file_path))
    #             exit(0)
    #         print('Loading ONNX file from path {}...'.format(onnx_file_path))
    #         with open(onnx_file_path, 'rb') as model:
    #             print('Beginning ONNX file parsing')
    #             if not parser.parse(model.read()):
    #                 print ('ERROR: Failed to parse the ONNX file.')
    #                 for error in range(parser.num_errors):
    #                     print (parser.get_error(error))
    #                 return None
    #         # The actual yolov3.onnx is generated with batch size 64. Reshape input to batch size 1
    #         network.get_input(0).shape = [1, 3, 512, 512]
    #         print('Completed parsing of ONNX file')
    #         print('Building an engine from file {}; this may take a while...'.format(onnx_file_path))
    #         plan = builder.build_serialized_network(network, config)
    #         engine = runtime.deserialize_cuda_engine(plan)
    #         print("Completed creating Engine")
    #         with open(engine_file_path, "wb") as f:
    #             f.write(plan)
    #         return engine
    
    if os.path.exists(engine_file_path):
        # If a serialized engine exists, use it instead of building an engine.
        trt.init_libnvinfer_plugins(TRT_LOGGER,'')#插件初始化
        print("Reading engine from file {}".format(engine_file_path))
        with open(engine_file_path, "rb") as f, trt.Runtime(TRT_LOGGER) as runtime:
            return runtime.deserialize_cuda_engine(f.read())
    else:
        return build_engine()
    
    return build_engine()
def append_to_dict(dict, key, value):
    
    if key in dict.keys():
        dict[key].append(value)
    else:
        dict[key] = [value]
def preprocess(img_path):
    img = cv2.imread(img_path) # .imdecode(np.fromfile(img_path, dtype=np.uint8), 1)
    img = cv2.resize(img, (512, 512))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # 把图片BGR变成RGB
    
    img = np.transpose(img,(2,0,1))
    img = np.expand_dims(img, 0)
    img = img.astype(np.float32)/255.
    img = img*2-1
    img = np.ascontiguousarray(img)
    return img

def postprocess(new_img,img_path):
    new_img = np.transpose(new_img, (1,2,0))
    new_img = ((new_img+1)/2*255.0).round()
    #return new_img
    new_img = cv2.cvtColor(new_img, cv2.COLOR_RGB2BGR)  
    cv2.imwrite(img_path.replace('cropped_faces','cropped_faces_result_tensorrt'), new_img)

def interface(x, engine,context,batch_size=1):
    """Create a TensorRT engine for ONNX-based YOLOv3-608 and run inference."""

    # Download a dog image and save it to the following file path:
    # input_image_path = inputpath
    # # Two-dimensional tuple with the target network's (spatial) input resolution in HW ordered
    # image = preprocess(input_image_path)

    # # Do inference with TensorRT
    # trt_outputs = []
    output_dict = {}
    # device = next(model.parameters()).device
    
    pointer = 0
    while True:
        if pointer >= len(x):
            break
        
        # batch_waveform = move_data_to_device(x[pointer : pointer + batch_size], device)
        batch_waveform = torch.Tensor(x[pointer : pointer + batch_size])
        batch_waveform = spectrogram_extractor(batch_waveform)
        batch_waveform = logmel_extractor(batch_waveform)    # (batch_size, 1, time_steps, mel_bins)
        batch_waveform = batch_waveform.transpose(1, 3)
        # batch_waveform = move_data_to_device(batch_waveform,device)
        batch_waveform = np.array(batch_waveform)
        # batch_waveform = batch_waveform.astype(np.float16)  
        pointer += batch_size 
        inputs, outputs, bindings, stream = common.allocate_buffers(engine)
        # Do inference
        # print('Running inference on image {}...'.format(input_image_path))
        # Set host input to the image. The common.do_inference function will copy the input to the GPU before executing.
        inputs[0].host = batch_waveform
        trt_outputs = common.do_inference(context, bindings=bindings, inputs=inputs, outputs=outputs, stream=stream)
        batch_output_dict = {
            'reg_onset_output': trt_outputs[1].reshape(1,1001,128), 
            'reg_offset_output': trt_outputs[2].reshape(1,1001,128),
            'frame_output': trt_outputs[0].reshape(1,1001,128),
            # 'wheel_onset_output':wheel_model_output,
            'velocity_output':trt_outputs[3].reshape(1,1001,128)
            }
        for key in batch_output_dict.keys():
            # if '_list' not in key:
            append_to_dict(output_dict, key, batch_output_dict[key])
        # for key in batch_output_dict.keys():
        #     # if '_list' not in key:
        #     append_to_dict(output_dict, key, batch_output_dict[key].data.cpu().numpy())
        # Before doing post-processing, we need to reshape the outputs as the common.do_inference will give us flat arrays.
        # output = trt_outputs[2].reshape(3,512,512)
    for key in output_dict.keys():
        output_dict[key] = np.concatenate(output_dict[key], axis=0)

    return output_dict
    # output = postprocess(output,inputpath)
    #return trt_outputs
import os
from pickle import TRUE
import sys
sys.path.insert(1, '/home//workspace/music_site/music_app/algo/new_convert_midi/')
sys.path.append( '/home//workspace/music_site/music_app/algo/new_convert_midi/')
import numpy as np
import argparse
import h5py
import math
import time
import librosa
import logging
import matplotlib.pyplot as plt
from torchlibrosa.stft import Spectrogram, LogmelFilterBank
import torch
 
from utils.utilities import (create_folder, get_filename, RegressionPostProcessor, 
    OnsetsFramesPostProcessor, write_events_to_midi, load_audio)
# from models import Note_pedal
from pytorch_utils import move_data_to_device, forward
import utils.config as config
import torch_tensorrt

# sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

sample_rate = 16000
window_size = 2048
hop_size = sample_rate // 100
mel_bins = 229
fmin = 30
fmax = sample_rate // 2

window = 'hann'
center = True
pad_mode = 'reflect'
ref = 1.0
amin = 1e-10
top_db = None

midfeat = 1024
# midfeat = 1792
momentum = 0.01
spectrogram_extractor = Spectrogram(n_fft=window_size,
                                            hop_length=hop_size, win_length=window_size, window=window,
                                            center=center, pad_mode=pad_mode, freeze_parameters=True)

# Logmel feature extractor
logmel_extractor = LogmelFilterBank(sr=sample_rate,
                                            n_fft=window_size, n_mels=mel_bins, fmin=fmin, fmax=fmax, ref=ref,
                                            amin=amin, top_db=top_db, freeze_parameters=True)

class NewConvertMidi(object):
    def __init__(self, model_type, checkpoint_path=None, 
        segment_samples=16000*10, device=torch.device('cuda'), 
        post_processor_type='regression', fp16 = True):
        """Class for transcribing piano solo recording.

        Args:
          model_type: str
          checkpoint_path: str
          segment_samples: int
          device: 'cuda' | 'cpu'
        """

        if 'cuda' in str(device) and torch.cuda.is_available():
            self.device = 'cuda'
        else:
            self.device = 'cpu'

        self.segment_samples = segment_samples
        self.post_processor_type = post_processor_type
        self.frames_per_second = config.frames_per_second
        self.classes_num = config.classes_num
        self.onset_threshold =0.1
        self.offset_threshod = 0.1
        self.frame_threshold = 0.1
        self.pedal_offset_threshold = 0.1
        self.wheel_onset_threshold = 0.0001
        self.fp16 = fp16
        # Build model
        self.onnx_file_path = 'codeformer.onnx'
        # engine_file_path = "/root/yyz/code/piano_transcription/piano.engine"
        # self.engine_file_path = "/root/yyz/code/piano_transcription/piano_fp16.engine"
        self.engine_file_path = checkpoint_path
        self.engine = get_engine(self.onnx_file_path, self.engine_file_path, fp16_mode=fp16)
        print("self.engine",self.engine)
        self.context = self.engine.create_execution_context()
        print("self.context",self.context)
        self.inputs, self.outputs, self.bindings, self.stream = common.allocate_buffers(self.engine)
        # self.outputs_tmp = self.outputs

        pass
    def append_to_dict(self,dict, key, value):
    
        if key in dict.keys():
            dict[key].append(value)
        else:
            dict[key] = [value]
    def interface(self,x,batch_size=1):
        """Create a TensorRT engine for ONNX-based YOLOv3-608 and run inference."""

        # Download a dog image and save it to the following file path:
        # input_image_path = inputpath
        # # Two-dimensional tuple with the target network's (spatial) input resolution in HW ordered
        # image = preprocess(input_image_path)

        # # Do inference with TensorRT
        # trt_outputs = []
        output_dict = {}
        # device = next(model.parameters()).device
        
        pointer = 0
        while True:
            if pointer >= len(x):
                break
            
            # batch_waveform = move_data_to_device(x[pointer : pointer + batch_size], device)
            batch_waveform = torch.Tensor(x[pointer : pointer + batch_size])
            batch_waveform = spectrogram_extractor(batch_waveform)
            batch_waveform = logmel_extractor(batch_waveform)    # (batch_size, 1, time_steps, mel_bins)
            batch_waveform = batch_waveform.transpose(1, 3)
            # batch_waveform = move_data_to_device(batch_waveform,device)
            batch_waveform = np.array(batch_waveform)
            # if self.fp16:
                # batch_waveform = batch_waveform.astype(np.float16)  
            pointer += batch_size 

            # Do inference
            # print('Running inference on image {}...'.format(input_image_path))
            # Set host input to the image. The common.do_inference function will copy the input to the GPU before executing.
            self.inputs[0].host = batch_waveform.copy()
            trt_outputs = common.do_inference(self.context, bindings=self.bindings, inputs=self.inputs, outputs=self.outputs, stream=self.stream)
            # self.outputs = self.outputs_tmp
            # for tt,trt_output in enumerate(trt_outputs):
            #     if np.any(np.isnan(trt_output)):
            #         trt_outputs[tt] = np.zeros_like(trt_output)
            self.batch_output_dict = {
                'reg_onset_output': trt_outputs[1].reshape(1,1001,128), 
                'reg_offset_output': trt_outputs[2].reshape(1,1001,128),
                'frame_output': trt_outputs[0].reshape(1,1001,128),
                # 'wheel_onset_output':wheel_model_output,
                'velocity_output':trt_outputs[3].reshape(1,1001,128)
                }
            
            for key in self.batch_output_dict.keys():
                # if '_list' not in key:
                # output_dict
                self.append_to_dict(output_dict, key, self.batch_output_dict[key].copy())
            # for key in batch_output_dict.keys():
            #     # if '_list' not in key:
            #     append_to_dict(output_dict, key, batch_output_dict[key].data.cpu().numpy())
            # Before doing post-processing, we need to reshape the outputs as the common.do_inference will give us flat arrays.
            # output = trt_outputs[2].reshape(3,512,512)
        for key in output_dict.keys():
            output_dict[key] = np.concatenate(output_dict[key], axis=0)

        return output_dict
    def transcribe(self, audio, midi_path,type=0):
        """Transcribe an audio recording.

        Args:
          audio: (audio_samples,)
          midi_path: str, path to write out the transcribed MIDI.

        Returns:
          transcribed_dict, dict: {'output_dict':, ..., 'est_note_events': ..., 
            'est_pedal_events': ...}
        """

        audio = audio[None, :]  # (1, audio_samples)

        # Pad audio to be evenly divided by segment_samples
        audio_len = audio.shape[1]
        pad_len = int(np.ceil(audio_len / self.segment_samples)) \
            * self.segment_samples - audio_len

        audio = np.concatenate((audio, np.zeros((1, int(pad_len)))), axis=1)

        # Enframe to segments
        segments = self.enframe(audio, self.segment_samples)
        """(N, segment_samples)"""

        # Forward
        output_dict = self.interface(segments,1)
        # output_dict = forward(self.model, segments, batch_size=1)
        """{'reg_onset_output': (N, segment_frames, classes_num), ...}"""

        # Deframe to original length
        for key in output_dict.keys():
            output_dict[key] = self.deframe(output_dict[key])[0 : audio_len]
        """output_dict: {
          'reg_onset_output': (segment_frames, classes_num), 
          'reg_offset_output': (segment_frames, classes_num), 
          'frame_output': (segment_frames, classes_num), 
          'velocity_output': (segment_frames, classes_num), 
          'reg_pedal_onset_output': (segment_frames, 1), 
          'reg_pedal_offset_output': (segment_frames, 1), 
          'pedal_frame_output': (segment_frames, 1)}"""

        # Post processor
        if self.post_processor_type == 'regression':
            """Proposed high-resolution regression post processing algorithm."""
            post_processor = RegressionPostProcessor(self.frames_per_second, 
                classes_num=self.classes_num, onset_threshold=self.onset_threshold, 
                offset_threshold=self.offset_threshod, 
                frame_threshold=self.frame_threshold, 
                pedal_offset_threshold=self.pedal_offset_threshold)

        elif self.post_processor_type == 'onsets_frames':
            """Google's onsets and frames post processing algorithm. Only used 
            for comparison."""
            post_processor = OnsetsFramesPostProcessor(self.frames_per_second, 
                self.classes_num)

        # Post process output_dict to MIDI events
        (est_note_events, est_pedal_events) = \
            post_processor.output_dict_to_midi_events(output_dict)
        
        midi_file = None
        transcribed_dict = None
        print("ttttttttype",type)
        if(1 == type):

            ################################
            if midi_path:
                write_events_to_midi(start_time=0, note_events=est_note_events, 
                    pedal_events=est_pedal_events, midi_path=midi_path)
                print('Write out to {}'.format(midi_path))
            #################################3
            midi_file = write_events_to_midi(start_time=0, note_events=est_note_events, 
                pedal_events=est_pedal_events, midi_path=midi_path,type=1)
        else:
            print("0000000000000000")
            # Write MIDI events to file
            if midi_path:
                write_events_to_midi(start_time=0, note_events=est_note_events, 
                    pedal_events=est_pedal_events, midi_path=midi_path)
                print('Write out to {}'.format(midi_path))

            transcribed_dict = {
                'output_dict': output_dict, 
                'est_note_events': est_note_events,
                'est_pedal_events': est_pedal_events}
            
        return transcribed_dict,midi_file

        # Write MIDI events to file
        # if midi_path:
        #     write_events_to_midi(start_time=0, note_events=est_note_events, 
        #         pedal_events=est_pedal_events, midi_path=midi_path)
        #     print('Write out to {}'.format(midi_path))

        # transcribed_dict = {
        #     'output_dict': output_dict, 
        #     'est_note_events': est_note_events,
        #     'est_pedal_events': est_pedal_events}

        # return transcribed_dict

    def enframe(self, x, segment_samples):
        """Enframe long sequence to short segments.

        Args:
          x: (1, audio_samples)
          segment_samples: int

        Returns:
          batch: (N, segment_samples)
        """
        assert x.shape[1] % segment_samples == 0
        batch = []

        pointer = 0
        while pointer + segment_samples <= x.shape[1]:
            batch.append(x[:, int(pointer) : int(pointer) + int(segment_samples)])
            pointer += segment_samples // 2

        batch = np.concatenate(batch, axis=0)
        return batch

    def deframe(self, x):
        """Deframe predicted segments to original sequence.

        Args:
          x: (N, segment_frames, classes_num)

        Returns:
          y: (audio_frames, classes_num)
        """
        if x.shape[0] == 1:
            return x[0]

        else:
            x = x[:, 0 : -1, :]
            """Remove an extra frame in the end of each segment caused by the
            'center=True' argument when calculating spectrogram."""
            (N, segment_samples, classes_num) = x.shape
            assert segment_samples % 4 == 0

            y = []
            y.append(x[0, 0 : int(segment_samples * 0.75)])
            for i in range(1, N - 1):
                y.append(x[i, int(segment_samples * 0.25) : int(segment_samples * 0.75)])
            y.append(x[-1, int(segment_samples * 0.25) :])
            y = np.concatenate(y, axis=0)
            return y


def inference(args):
    """Inference template.

    Args:
      model_type: str
      checkpoint_path: str
      post_processor_type: 'regression' | 'onsets_frames'. High-resolution 
        system should use 'regression'. 'onsets_frames' is only used to compare
        with Googl's onsets and frames system.
      audio_path: str
      cuda: bool
    """

    # Arugments & parameters
    model_type = args.model_type
    checkpoint_path = args.checkpoint_path
    post_processor_type = args.post_processor_type
    device = 'cuda' if args.cuda and torch.cuda.is_available() else 'cpu'
    audio_path = args.audio_path
    fp16 = args.fp16
    sample_rate = config.sample_rate
    segment_samples = sample_rate * config.segment_seconds
    """Split audio to multiple 10-second segments for inference"""

    # Paths
    midi_path = 'results/{}.mid'.format(get_filename(audio_path))
    create_folder(os.path.dirname(midi_path))

    # Load audio
    (audio, _) = load_audio(audio_path, sr=sample_rate, mono=True)

    # parser = argparse.ArgumentParser(description='')
    # parser.add_argument('--model_type', type=str, default="Note_pedal")
    # # parser.add_argument('--checkpoint_path', type=str,  default="/home/ubuntu/data/code/piano_transcription/combile_5_11.pth")
    # parser.add_argument('--checkpoint_path', type=str,  default="/home//workspace/music_site/music_app/algo/new_convert_midi/piano_fp16.engine")
    # # parser.add_argument('--checkpoint_path', type=str,  default="/root/yyz/code/piano_transcription/piano.engine")
    # parser.add_argument('--post_processor_type', type=str, default='regression', choices=['onsets_frames', 'regression'])
    # parser.add_argument('--audio_path',  default="/home//workspace/music_site/music_app/lshs.mp3", type=str)
    # # parser.add_argument('--audio_path',  default="/root/yyz/YYZ/data/data_g/2022/BOBO183_A06_E.G_R.wav", type=str)
    # parser.add_argument('--cuda', type= bool, default=True)
    # parser.add_argument('--fp16', type= bool, default=True)

    # Transcriptor
    transcriptor = NewConvertMidi(model_type, device=device, 
        checkpoint_path=checkpoint_path, segment_samples=segment_samples, 
        post_processor_type=post_processor_type, fp16 = fp16)

    # Transcribe and write out to MIDI file
    transcribe_time = time.time()
    transcribed_dict = transcriptor.transcribe(audio, midi_path)
    print('Transcribe time: {:.3f} s'.format(time.time() - transcribe_time))

    # Visualize for debug
    # plot = True
    # if plot:
    #     output_dict = transcribed_dict['output_dict']
    #     fig, axs = plt.subplots(5, 1, figsize=(15, 8), sharex=True)
    #     mel = librosa.feature.melspectrogram(audio, sr=16000, n_fft=2048, hop_length=160, n_mels=229, fmin=30, fmax=8000)
    #     axs[0].matshow(np.log(mel), origin='lower', aspect='auto', cmap='jet')
    #     axs[1].matshow(output_dict['frame_output'].T, origin='lower', aspect='auto', cmap='jet')
    #     axs[2].matshow(output_dict['reg_onset_output'].T, origin='lower', aspect='auto', cmap='jet')
    #     axs[3].matshow(output_dict['reg_offset_output'].T, origin='lower', aspect='auto', cmap='jet')
    #     # axs[4].plot(output_dict['pedal_frame_output'])
    #     axs[0].set_xlim(0, len(output_dict['frame_output']))
    #     axs[4].set_xlabel('Frames')
    #     axs[0].set_title('Log mel spectrogram')
    #     axs[1].set_title('frame_output')
    #     axs[2].set_title('reg_onset_output')
    #     axs[3].set_title('reg_offset_output')
    #     # axs[4].set_title('pedal_frame_output')
    #     plt.tight_layout(0, .05, 0)
    #     fig_path = '_zz.pdf'.format(get_filename(audio_path))
    #     plt.savefig(fig_path)
    #     print('Plot to {}'.format(fig_path))
    


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('--model_type', type=str, default="Note_pedal")
    # parser.add_argument('--checkpoint_path', type=str,  default="/home/ubuntu/data/code/piano_transcription/combile_5_11.pth")
    parser.add_argument('--checkpoint_path', type=str,  default="/home//workspace/music_site/music_app/algo/new_convert_midi/piano_fp16.engine")
    # parser.add_argument('--checkpoint_path', type=str,  default="/root/yyz/code/piano_transcription/piano.engine")
    parser.add_argument('--post_processor_type', type=str, default='regression', choices=['onsets_frames', 'regression'])
    parser.add_argument('--audio_path',  default="/home//workspace/music_site/music_app/yddqz_piano.mp3", type=str)
    # parser.add_argument('--audio_path',  default="/root/yyz/YYZ/data/data_g/2022/BOBO183_A06_E.G_R.wav", type=str)
    parser.add_argument('--cuda', type= bool, default=True)
    parser.add_argument('--fp16', type= bool, default=True)
    args = parser.parse_args()
    inference(args)
    # files = sorted(glob.glob(os.path.join('./inputs/cropped_faces/', '*')))
    # onnx_file_path = 'codeformer.onnx'
    # # engine_file_path = "/root/yyz/code/piano_transcription/piano.engine"
    # engine_file_path = "/root/yyz/code/piano_transcription/piano_fp16.engine"
    # engine = get_engine(onnx_file_path, engine_file_path, fp16_mode=True)
    # context = engine.create_execution_context()
    # input_data = np.random.rand(1, 229, 1001, 1)
    # input_data = np.zeros_like(input_data)
    # input_data = input_data.astype(np.float16)   
    # interface(input_data,engine,context)
    # start=time.time()
    # for file in files:
    #     interface(file,engine,context)
    # end=time.time()
    # print((end-start)/len(files))
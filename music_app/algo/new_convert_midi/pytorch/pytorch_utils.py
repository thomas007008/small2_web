import os
import sys
sys.path.insert(1, os.path.join(sys.path[0], '../utils'))
import numpy as np
import time
import librosa
import torch
import torch.nn as nn

from utilities import pad_truncate_sequence
from torchlibrosa.stft import Spectrogram, LogmelFilterBank
import torch_tensorrt
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

def move_data_to_device(x, device):
    if 'float' in str(x.dtype):
        x = torch.Tensor(x)
    elif 'int' in str(x.dtype):
        x = torch.LongTensor(x)
    else:
        return x

    return x.to(device)
def move_data(x, device):
    if 'float' in str(x.dtype):
        x = torch.Tensor(x)
    elif 'int' in str(x.dtype):
        x = torch.LongTensor(x)
    else:
        return x

    return x

def append_to_dict(dict, key, value):
    
    if key in dict.keys():
        dict[key].append(value)
    else:
        dict[key] = [value]

 
def forward_dataloader(model, dataloader, batch_size, return_target=True):
    """Forward data generated from dataloader to model.

    Args:
      model: object
      dataloader: object, used to generate mini-batches for evaluation.
      batch_size: int
      return_target: bool

    Returns:
      output_dict: dict, e.g. {
        'frame_output': (segments_num, frames_num, classes_num),
        'onset_output': (segments_num, frames_num, classes_num),
        'frame_roll': (segments_num, frames_num, classes_num),
        'onset_roll': (segments_num, frames_num, classes_num),
        ...}
    """

    output_dict = {}
    device = next(model.parameters()).device

    for n, batch_data_dict in enumerate(dataloader):
        
        batch_waveform = move_data_to_device(batch_data_dict['waveform'], device)

        with torch.no_grad():
            model.eval()
            batch_output_dict = model(batch_waveform)

        for key in batch_output_dict.keys():
            if '_list' not in key:
                append_to_dict(output_dict, key, 
                    batch_output_dict[key].data.cpu().numpy())

        if return_target:
            for target_type in batch_data_dict.keys():
                if 'roll' in target_type or 'reg_distance' in target_type or \
                    'reg_tail' in target_type:
                    append_to_dict(output_dict, target_type, 
                        batch_data_dict[target_type])

    for key in output_dict.keys():
        output_dict[key] = np.concatenate(output_dict[key], axis=0)
    
    return output_dict


def forward(model, x, batch_size):
    """Forward data to model in mini-batch. 
    
    Args: 
      model: object
      x: (N, segment_samples)
      batch_size: int

    Returns:
      output_dict: dict, e.g. {
        'frame_output': (segments_num, frames_num, classes_num),
        'onset_output': (segments_num, frames_num, classes_num),
        ...}
    """
    
    output_dict = {}
    device = next(model.parameters()).device
    
    pointer = 0
    while True:
        if pointer >= len(x):
            break
        
        # batch_waveform = move_data_to_device(x[pointer : pointer + batch_size], device)
        batch_waveform = torch.Tensor(x[pointer : pointer + batch_size])
        batch_waveform = spectrogram_extractor(batch_waveform)
        batch_waveform = logmel_extractor(batch_waveform)    # (batch_size, 1, time_steps, mel_bins)
        batch_waveform = batch_waveform.transpose(1, 3)
        batch_waveform = move_data_to_device(batch_waveform,device)
        pointer += batch_size
        # print("=====================>", batch_waveform.shape)
        # exit()

        with torch.no_grad():
            model.eval()
            # trt_ts_module = torch_tensorrt.compile(model, 
            #     inputs= [torch_tensorrt.Input((1, 229, 1001, 1))],
            #     enabled_precisions= {torch.float} # Run with FP16
            # )
            # enabled_precisions = {torch.float, torch.float}  # Run with fp16
            # trt_ts_module = torch_tensorrt.compile(
            #     self.model, inputs=inputs, enabled_precisions=enabled_precisions
            # )
            # batch_waveform.
            # batch_output_dict = model(batch_waveform)
            # batch_waveform = batch_waveform.half()
            # trt_ts_module = torch.jit.load("trt_ts_module.ts")

            # trt_ts_module = trt_ts_module.to(device)

            # torch.jit.save(trt_ts_module, "trt_ts_module.ts")
            # result = trt_ts_module(batch_waveform)
            # exit()
            # input = ["input"]
            # output = ["output0","output1","output2","output3"]

            # torch.onnx.export(model, batch_waveform, "./piano.onnx", input_names=input, output_names=output, opset_version=12, verbose = True)
            # exit()
            # input_data = np.random.rand(1, 229, 1001, 1)
            # input_data = np.zeros_like(input_data)
            # input_data = input_data.astype(np.float32)
            # # input_data = torch.from_numpy(input_data).cuda() 
            # input_data = torch.Tensor(input_data).to(device)        
            batch_output_dict = model(batch_waveform)
            # print()
        for key in batch_output_dict.keys():
            # if '_list' not in key:
            append_to_dict(output_dict, key, batch_output_dict[key].data.cpu().numpy())

    for key in output_dict.keys():
        output_dict[key] = np.concatenate(output_dict[key], axis=0)

    return output_dict

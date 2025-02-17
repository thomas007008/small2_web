import torch
from torch.autograd import Variable
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.gpuarray as gpuarray
import pycuda.autoinit
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import time
import numpy as np


batch_size = 1    # 这里的batch_size要与转换时的一致


trt_model_name = "/root/yyz/code/piano_transcription/piano.engine"     


# 操作缓存，进行运算， 这个函数是通用的
def infer(context, input_img, output_size, batch_size):
    # Convert input data to Float32,这个类型要转换，不严会有好多报错
    input_img = input_img.astype(np.float32)
    # Create output array to receive data
    output = np.empty(output_size, dtype=np.float32)

    # Allocate device memory
    d_input = cuda.mem_alloc(batch_size * input_img.nbytes)
    d_output = cuda.mem_alloc(batch_size * output.nbytes)

    bindings = [int(d_input), int(d_output)]

    stream = cuda.Stream()

    # Transfer input data to device
    cuda.memcpy_htod_async(d_input, input_img, stream)
    # Execute model
    context.execute_async_v2(batch_size, bindings, stream.handle, None)
    # Transfer predictions back
    cuda.memcpy_dtoh_async(output, d_output, stream)

    stream.synchronize()

    # Return predictions
    return output


# 执行测试函数
def do_test(context):
    input_data = np.random.rand(1, 229, 1001, 1)
    input_data = input_data.astype(np.float32)
    output_data = infer(context, input_data, (4, 1001, 128),1)
    print()
def trt_infer():
    # 读取.trt文件
    def loadEngine2TensorRT(filepath):
        G_LOGGER = trt.Logger(trt.Logger.WARNING)
        # 反序列化引擎
        with open(filepath, "rb") as f, trt.Runtime(G_LOGGER) as runtime:
            engine = runtime.deserialize_cuda_engine(f.read())
            return engine
    
    engine = loadEngine2TensorRT(trt_model_name)
    # 创建上下文
    context = engine.create_execution_context()

    print("Start TensorRT Test...")
    do_test(context)
    # print('INT8 acc: {}, need time: {}'.format(acc, times))


if __name__ == '__main__':

    trt_infer()

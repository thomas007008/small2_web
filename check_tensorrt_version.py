import tensorrt as trt

def check_tensorrt_version():
    print("TensorRT Version:", trt.__version__)

if __name__ == "__main__":
    check_tensorrt_version()

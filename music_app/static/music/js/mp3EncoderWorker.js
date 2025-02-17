// 辅助函数：将 Float32Array 转换为 Int16Array

self.importScripts('https://cdn.bootcdn.net/ajax/libs/lamejs/1.2.1/lame.all.min.js'); // 确保导入 LAME JS 库

function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF; // 将 -1.0 - 1.0 转换为 -32768 - 32767
    }
    return buf;
}

self.onmessage = function(e) {
    const data = e.data;

    // 确保接收到了正确的数据格式
    if (!data || !data.sampleRate || !data.channels || !Array.isArray(data.channels)) {
        console.error('Invalid audio data received.');
        return;
    }

    const mp3Encoder = new lamejs.Mp3Encoder(data.numberOfChannels, data.sampleRate, 128);
    // const buffers = data.channels.map(channel => convertFloat32ToInt16(channel));
    // const mp3Data = [];

    // buffers.forEach(buffer => {
    //     const mp3Buffer = mp3Encoder.encodeBuffer(buffer);
    //     if (mp3Buffer && mp3Buffer.length > 0) {
    //         mp3Data.push(new Int8Array(mp3Buffer));
    //     }
    // });

    const buffers = [];
    
    for (let i = 0; i < data.channels.length; i++) {
        buffers.push(convertFloat32ToInt16(data.channels[i]));
    }

    const mp3Data = [];
    const mp3Buffer = mp3Encoder.encodeBuffer(...buffers);
    if (mp3Buffer.length > 0) {
        mp3Data.push(new Int8Array(mp3Buffer));
    }


    const finalBuffer = mp3Encoder.flush();
    if (finalBuffer && finalBuffer.length > 0) {
        mp3Data.push(new Int8Array(finalBuffer));
    }

    const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
    self.postMessage(mp3Blob);
};


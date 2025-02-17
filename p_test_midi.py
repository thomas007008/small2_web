import mido  # 导入mido库

# 打开MIDI文件
mid = mido.MidiFile('yddqz.mid')

# 遍历MIDI文件中的所有轨道
for i, track in enumerate(mid.tracks):
    print('Track {}: {}'.format(i, track.name))
    for msg in track:
        print(msg)
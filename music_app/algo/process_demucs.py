from algo.demucs.demucs import api 
from pathlib import Path


# Initialize with default parameters:
#separator = demucs.api.Separator()

import sys
print(sys.path)

# sys.path.append("./algo/demucs/demucs")
sys.path.append("/home//workspace/music_site/music_app/algo/demucs")

print(sys.path)

# Use another model and segment:
separator = api.Separator(model="htdemucs_6s",
        repo=Path("./models"),
        device="cpu")

# You can also use other parameters defined

# Separating an audio file
origin, separated = separator.separate_audio_file("test.mp3")

# Separating a loaded audio
# origin, separated = separator.separate_tensor(audio)

# If you encounter an error like CUDA out of memory, you can use this to change parameters like `segment`:
# separator.update_parameter(segment=smaller_segment)


for item in separated:
    print(item)


# Remember to create the destination folder before calling `save_audio`
# Or you are likely to recieve `FileNotFoundError`
# for file, sources in separated:
#     for stem, source in sources.items():
#         api.save_audio(source, f"{stem}_{file}", samplerate=separator.samplerate)




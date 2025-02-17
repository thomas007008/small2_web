import os
import sys
from pathlib import Path
import torch
import numpy as np
from audio_separator.separator.common_separator import CommonSeparator
from audio_separator.separator.uvr_lib_v5.demucs.apply import apply_model, demucs_segments
from audio_separator.separator.uvr_lib_v5.demucs.hdemucs import HDemucs
from audio_separator.separator.uvr_lib_v5.demucs.pretrained import get_model as get_demucs_model
from audio_separator.separator.uvr_lib_v5 import spec_utils

DEMUCS_4_SOURCE = ["drums", "bass", "other", "vocals"]

DEMUCS_2_SOURCE_MAPPER = {CommonSeparator.INST_STEM: 0, CommonSeparator.VOCAL_STEM: 1}
DEMUCS_4_SOURCE_MAPPER = {CommonSeparator.BASS_STEM: 0, CommonSeparator.DRUM_STEM: 1, CommonSeparator.OTHER_STEM: 2, CommonSeparator.VOCAL_STEM: 3}
DEMUCS_6_SOURCE_MAPPER = {
    CommonSeparator.BASS_STEM: 0,
    CommonSeparator.DRUM_STEM: 1,
    CommonSeparator.OTHER_STEM: 2,
    CommonSeparator.VOCAL_STEM: 3,
    CommonSeparator.GUITAR_STEM: 4,
    CommonSeparator.PIANO_STEM: 5,
}


class DemucsSeparator(CommonSeparator):
    """
    DemucsSeparator is responsible for separating audio sources using Demucs models.
    It initializes with configuration parameters and prepares the model for separation tasks.
    """

    def __init__(self, common_config, arch_config):
        # Any configuration values which can be shared between architectures should be set already in CommonSeparator,
        # e.g. user-specified functionality choices (self.output_single_stem) or common model parameters (self.primary_stem_name)
        super().__init__(config=common_config)

        # Initializing user-configurable parameters, passed through with an mdx_from the CLI or Separator instance

        # Adjust segments to manage RAM or V-RAM usage:
        # - Smaller sizes consume less resources.
        # - Bigger sizes consume more resources, but may provide better results.
        # - "Default" picks the optimal size.
        # DEMUCS_SEGMENTS = (DEF_OPT, '1', '5', '10', '15', '20',
        #           '25', '30', '35', '40', '45', '50',
        #           '55', '60', '65', '70', '75', '80',
        #           '85', '90', '95', '100')
        self.segment_size = arch_config.get("segment_size", "Default")

        # Performs multiple predictions with random shifts of the input and averages them.
        # The higher number of shifts, the longer the prediction will take.
        # Not recommended unless you have a GPU.
        # DEMUCS_SHIFTS = (0, 1, 2, 3, 4, 5,
        #                 6, 7, 8, 9, 10, 11,
        #                 12, 13, 14, 15, 16, 17,
        #                 18, 19, 20)
        self.shifts = arch_config.get("shifts", 2)

        # This option controls the amount of overlap between prediction windows.
        #  - Higher values can provide better results, but will lead to longer processing times.
        #  - You can choose between 0.001-0.999
        # DEMUCS_OVERLAP = (0.25, 0.50, 0.75, 0.99)
        self.overlap = arch_config.get("overlap", 0.25)

        # Enables "Segments". Deselecting this option is only recommended for those with powerful PCs.
        self.segments_enabled = arch_config.get("segments_enabled", True)

        self.logger.debug(f"Demucs arch params: segment_size={self.segment_size}, segments_enabled={self.segments_enabled}")
        self.logger.debug(f"Demucs arch params: shifts={self.shifts}, overlap={self.overlap}")

        self.demucs_source_map = DEMUCS_4_SOURCE_MAPPER

        self.audio_file_path = None
        self.audio_file_base = None
        self.demucs_model_instance = None

        # Add uvr_lib_v5 folder to system path so pytorch serialization can find the demucs module
        current_dir = os.path.dirname(__file__)
        uvr_lib_v5_path = os.path.join(current_dir, "..", "uvr_lib_v5")
        sys.path.insert(0, uvr_lib_v5_path)

        self.logger.info("Demucs Separator initialisation complete")

    def separate(self, audio_file_path, primary_output_name=None, secondary_output_name=None):
        """
        Separates the audio file into its component stems using the Demucs model.
        """
        self.logger.debug("Starting separation process...")
        source = None
        stem_source = None
        inst_source = {}

        self.audio_file_path = audio_file_path
        self.audio_file_base = os.path.splitext(os.path.basename(audio_file_path))[0]

        # Prepare the mix for processing
        self.logger.debug("Preparing mix...")
        mix = self.prepare_mix(self.audio_file_path)

        self.logger.debug(f"Mix prepared for demixing. Shape: {mix.shape}")

        self.logger.debug("Loading model for demixing...")

        self.demucs_model_instance = HDemucs(sources=DEMUCS_4_SOURCE)
        self.demucs_model_instance = get_demucs_model(name=os.path.splitext(os.path.basename(self.model_path))[0], repo=Path(os.path.dirname(self.model_path)))
        self.demucs_model_instance = demucs_segments(self.segment_size, self.demucs_model_instance)
        self.demucs_model_instance.to(self.torch_device)
        self.demucs_model_instance.eval()

        self.logger.debug("Model loaded and set to evaluation mode.")

        source = self.demix_demucs(mix)

        del self.demucs_model_instance
        self.clear_gpu_cache()
        self.logger.debug("Model and GPU cache cleared after demixing.")

        output_files = []
        self.logger.debug("Processing output files...")

        if isinstance(inst_source, np.ndarray):
            self.logger.debug("Processing instance source...")
            source_reshape = spec_utils.reshape_sources(inst_source[self.demucs_source_map[CommonSeparator.VOCAL_STEM]], source[self.demucs_source_map[CommonSeparator.VOCAL_STEM]])
            inst_source[self.demucs_source_map[CommonSeparator.VOCAL_STEM]] = source_reshape
            source = inst_source

        if isinstance(source, np.ndarray):
            source_length = len(source)
            self.logger.debug(f"Processing source array, source length is {source_length}")
            match source_length:
                case 2:
                    self.logger.debug("Setting source map to 2-stem...")
                    self.demucs_source_map = DEMUCS_2_SOURCE_MAPPER
                case 6:
                    self.logger.debug("Setting source map to 6-stem...")
                    self.demucs_source_map = DEMUCS_6_SOURCE_MAPPER
                case _:
                    self.logger.debug("Setting source map to 4-stem...")
                    self.demucs_source_map = DEMUCS_4_SOURCE_MAPPER

        self.logger.debug("Processing for all stems...")
        for stem_name, stem_value in self.demucs_source_map.items():
            if self.output_single_stem is not None:
                if stem_name.lower() != self.output_single_stem.lower():
                    self.logger.debug(f"Skipping writing stem {stem_name} as output_single_stem is set to {self.output_single_stem}...")
                    continue

            stem_path = os.path.join(f"{self.audio_file_base}_({stem_name})_{self.model_name}.{self.output_format.lower()}")
            stem_source = source[stem_value].T

            self.final_process(stem_path, stem_source, stem_name)
            output_files.append(stem_path)

        return output_files

    def demix_demucs(self, mix):
        """
        Demixes the input mix using the demucs model.
        """
        self.logger.debug("Starting demixing process in demix_demucs...")

        processed = {}
        mix = torch.tensor(mix, dtype=torch.float32)
        ref = mix.mean(0)
        mix = (mix - ref.mean()) / ref.std()
        mix_infer = mix

        with torch.no_grad():
            self.logger.debug("Running model inference...")
            sources = apply_model(
                model=self.demucs_model_instance,
                mix=mix_infer[None],
                shifts=self.shifts,
                split=self.segments_enabled,
                overlap=self.overlap,
                static_shifts=1 if self.shifts == 0 else self.shifts,
                set_progress_bar=None,
                device=self.torch_device,
                progress=True,
            )[0]

        sources = (sources * ref.std() + ref.mean()).cpu().numpy()
        sources[[0, 1]] = sources[[1, 0]]
        processed[mix] = sources[:, :, 0:None].copy()
        sources = list(processed.values())
        sources = [s[:, :, 0:None] for s in sources]
        sources = np.concatenate(sources, axis=-1)

        return sources

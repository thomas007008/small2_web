import sys
from django.apps import AppConfig
# from .process_demucs import DemucsProcessor
# from .process_music_source_separation import MusicSourceSeparationVocals,MusicSourceSeparationAccompaniment
# from .process_piano_transcription import MyPianoTranscription
# from .process_singing_transcription import SingingTranscription
from .algo_process import process_manage,init_worker

ready_already_run = False

class MusicAppConfig(AppConfig):
    # default_auto_field = 'music_app.apps.MusicAppConfig'
    # name = 'music_app'
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'music_app'
    default_app_config = 'music_app.apps.MusicAppConfig'

    def ready(self):
        # 检查是否是在Celery worker进程中
        print("ready(self)")
        if 'celery' in sys.argv[0]:
            print("Running in Celery worker, skipping some code...")
            return
        if 'daphne' in sys.argv[0]:
            print("Daphne or runserver command detected. Skipping certain code.")
            return
        if 'makemigrations' in sys.argv:
            print("makemigrations command detected. Skipping certain code.")
            return
        if 'migrate' in sys.argv:
            print("migrate command detected. Skipping certain code.")
            return

        # global ready_already_run
        # if not ready_already_run:
        #     # your initialization code here
        #     ready_already_run = True

        self.process_manage = process_manage()
        

from django.db import models
from django.contrib.auth.models import AbstractUser,Group, Permission
from django.utils import timezone
import os
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

# Create your models here.





class UserTmpMusic(models.Model):
    MUSIC_TYPE_CHOICES = [
        ('NO_PROCESSED', 'No-processed'),
        ('ALGO_REMOVE_PROCESSED', 'Algo-remove-processed'),
        ('RECORDED', 'Recorded'),
        ('TEXT_BASED', 'Text-based'),
        ('RELEASE_BASED', 'Release-based'),
        ('ALGO_SPLITTER_PIANO', 'Algo_splitter_piano'),
        ('ALGO_SPLITTER_GUITAR', 'Algo_splitter_guitar'),
        ('ALGO_SPLITTER_BASS', 'Algo_splitter_bass'),
        ('ALGO_SPLITTER_DRUM', 'Algo_splitter_drum'),
        ('ALGO_SPLITTER_VOCAL', 'Algo_splitter_vocal'),
    ]

    # 使用 ContentType 实现通用关系
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    user = GenericForeignKey('content_type', 'object_id')

    music_type = models.CharField(
        max_length=25,
        choices=MUSIC_TYPE_CHOICES,
        default='NO_PROCESSED',
    )
    title = models.CharField(max_length=100, null=False)
    path = models.CharField(max_length=255, null=False)
    music_long = models.IntegerField(default=0)
    gain_num = models.IntegerField(default=0)
    uploaded_time = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('content_type', 'object_id', 'music_type')  # 确保每个用户只能拥有一个每种音乐类型的实例

    def save(self, *args, **kwargs):
        # 如果已经存在相同用户的音乐临时文件，删除老文件
        try:
            obj = UserTmpMusic.objects.get(
                content_type=self.content_type,
                object_id=self.object_id,
                music_type=self.music_type
            )
            if obj.path and os.path.isfile(obj.path):
                os.remove(obj.path)
            obj.delete()
        except UserTmpMusic.DoesNotExist:
            pass

        super(UserTmpMusic, self).save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # 删除关联的文件（如果存在）
        if self.path and os.path.isfile(self.path):
            os.remove(self.path)
        
        super(UserTmpMusic, self).delete(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # 如果path字段包含有效的文件路径，则删除文件
        if self.path and os.path.isfile(self.path):
            os.remove(self.path)
        
        # 调用父类的delete方法删除数据库记录
        super(UserTmpMusic, self).delete(*args, **kwargs)

    @property
    def is_temp_user(self):
        """检查是否是临时用户"""
        return self.content_type == ContentType.objects.get_for_model(TempUser)
    
    @property
    def is_custom_user(self):
        """检查是否是注册用户"""
        return self.content_type == ContentType.objects.get_for_model(CustomUser)




class TmpFile(models.Model):
    title = models.CharField(max_length=100, null=False)
    generate_title = models.CharField(max_length=100, null=False)
    user_name = models.CharField(max_length=100)
    music_long = models.IntegerField(default=0)
    music_size = models.IntegerField(default=0)
    generate_music_size = models.IntegerField(default=0)
    music_source = models.CharField(max_length=100,default=0)
    music_editing_scheme = models.CharField(max_length=100,default="")
    music_file_path = models.CharField(max_length=100,default="")
    generate_music_file_path = models.CharField(max_length=100,default="")
    music_file_url = models.CharField(max_length=100,default="")
    generate_music_file_url = models.CharField(max_length=100,default="")
    midi_file_path = models.CharField(max_length=100,default="")
    generate_midi_file_path = models.CharField(max_length=100,default="")
    midi_file_url = models.CharField(max_length=100,default="")
    generate_midi_file_url = models.CharField(max_length=100,default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    # def delete(self, *args, **kwargs):
    #     # 如果文件存在，则删除它
    #     if os.path.isfile(self.file_path):
    #         os.remove(self.file_path)
            
    #     # 调用父类的 delete 方法来删除数据库记录
    #     super(TmpFile, self).delete(*args, **kwargs)



class SessionFile(models.Model):
    session_key = models.CharField(max_length=255, unique=True)
    #{
        # "algo_select_audio_task":{
        #     "music_file_path":"",
        #     "music_file_url":"",
        #     "midi_file_path":"",
        #     "midi_file_url":"",
        #     "status":"finish"
        # },....
    
    #}
    #
    #
    #
    #
    file_info = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

class TempUser(models.Model):
    session_key = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    # 与 Music 模型建立多对多关系，允许临时用户关联多个音乐
    # music_collection = models.ManyToManyField('Music', related_name='temp_users', blank=True)

    class Meta:
        # 设置过期时间，比如7天后自动删除
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['last_activity']),
        ]

    def __str__(self):
        return f"TempUser_{self.session_key}"


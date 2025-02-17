import json
import redis
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs


@database_sync_to_async
def get_token(token_key):
    from rest_framework.authtoken.models import Token
    try:
        return Token.objects.get(key=token_key)
    except Token.DoesNotExist:
        return None
    
user_id_to_channel_name = {}

    
@database_sync_to_async
def get_active(token):
    return token.user.is_active

class MusicProcessingConsumer(AsyncWebsocketConsumer):
    # r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB,health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.redis_host = settings.REDIS_HOST  # Redis服务器的主机名或IP地址
        self.redis_port = settings.REDIS_PORT         # Redis服务器的端口号
        self.redis_db = settings.REDIS_DB             # Redis数据库编号（默认是0）

        # 创建Redis连接
        self.redis_client = redis.StrictRedis(
            host=self.redis_host, port=self.redis_port, db=self.redis_db
        )

    async def connect(self): 
        from rest_framework.exceptions import AuthenticationFailed
        # 解析查询参数
        query_string = parse_qs(self.scope['query_string'].decode())
        # token_key = query_string.get('token')[0]
        user_uuid = query_string.get('userUuid')[0]

        print(f"user_uuid {user_uuid}")

        # 使用 DRF 的 Token Authentication 进行验证
        # 然后在您的异步函数中
        # token = await get_token(token_key)
      
        # is_active = await get_active(token)
        # if is_active:
        self.user_id = user_uuid
        result = self.redis_client.set(self.user_id,self.channel_name)
        if result == True:
            print("SET命令成功执行")
        else:
            print(f"SET命令执行失败{result}")
        # 接受连接
        await self.accept()
        print(f"connect {self.user_id},channel_name {self.channel_name}")
        await self.channel_layer.group_add("music_processing", self.channel_name)
        # else:
        #     # 拒绝连接
        #     await self.close()


        # await self.accept()
        # Add this connection to the "music_processing" channel group
        

    async def disconnect(self, close_code):
        # Remove this connection from the channel group when the WebSocket is closed
        print(f"disconnect {self.user_id},channel_name {self.channel_name}")
        self.redis_client.delete(self.user_id)
        await self.channel_layer.group_discard("music_processing", self.channel_name)

    async def receive(self, text_data):
        # This is where you can handle messages sent from the client. 
        # For this example, we assume this won't be used.
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        if message == "ping":
            await self.send(text_data=json.dumps({
                'message': 'pong'
            }))
        pass

    # You can add a method to send updates to the client
    async def send_record_convert_midi_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_describe_update(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_audio_source_separation_midi_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_convert_to_midi_task_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_audio_source_separation_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_select_audio_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

    async def send_collect_audio_finish(self, event):
        await self.send(text_data=json.dumps(event['text']))

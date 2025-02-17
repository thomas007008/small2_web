import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MusicProcessingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 建立 WebSocket 连接
        await self.accept()

    async def disconnect(self, close_code):
        # 断开 WebSocket 连接
        pass

    async def receive(self, text_data):
        # 处理接收到的 WebSocket 消息
        data = json.loads(text_data)
        message = data['message']

        # 发送响应消息
        await self.send(text_data=json.dumps({
            'message': 'You said: ' + message
        }))

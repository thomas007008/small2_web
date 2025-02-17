#打印所有接收到的请求的中间件   
from django.utils.deprecation import MiddlewareMixin

class LogRequestsMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # print(f"Received request at {request.path} from {request.META['REMOTE_ADDR']}")
        # print(f"Method: {request.method}")
        # print(f"Headers: {request.headers}")
        # print(f"GET: {request.GET}")
        # print(f"POST: {request.POST}")
        return None

from django.contrib.sessions.models import Session
from .models import TempUser

def current_user(request):
    if request.user.is_authenticated:
        current_user = request.user
        # 如果 current_user 是 CustomUser 对象，我们需要提取用户名字符串
        if hasattr(current_user, 'username'):
            str_current_user = current_user.username
            str_current_user = str_current_user.split('@')[0]
            current_user.processed_all_username  = str_current_user
            str_current_user = current_user.processed_all_username[:10]
            current_user.processed_username  = str_current_user
            str_modile_current_user = current_user.processed_all_username[:20]
            current_user.processed_mobile_username = str_modile_current_user
            # print("11111 {}".format(current_user.processed_mobile_username))
        if hasattr(current_user, 'email'):
            str_current_email = current_user.email
            str_current_email = str_current_email.split('@')[0]
            current_user.processed_all_email  = str_current_email
            str_current_email = current_user.processed_all_email[:10]
            current_user.processed_email  = str_current_email
            str_modile_current_email = current_user.processed_all_email[:20]
            current_user.processed_mobile_email = str_modile_current_email
    else:
        # 使用会话 ID 作为临时标识
        if not request.session.session_key:
            request.session.create()
        
        # 获取或创建临时用户
        temp_user, created = TempUser.objects.get_or_create(
            session_key=request.session.session_key
        )
        
        current_user = {
            'id': temp_user.id,  # 使用临时用户的数据库ID
            'is_temp': True,
            'session_key': request.session.session_key
        }

    return {'current_user': current_user}
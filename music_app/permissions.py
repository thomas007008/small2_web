from rest_framework import permissions

class IsModerateUser(permissions.BasePermission):
    def has_permission(self, request, view):
        # 检查用户是否已经认证或者是管理员
        return request.user.is_authenticated or request.user.is_staff

    def has_object_permission(self, request, view, obj):
        # 如果是管理员，允许执行删除操作
        if request.user.is_staff:
            return True
        # 如果是中等权限用户，只允许对自己进行操作，不允许删除其他中等权限用户
        return obj == request.user
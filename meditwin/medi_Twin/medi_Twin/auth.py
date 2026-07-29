from rest_framework_simplejwt.authentication import JWTAuthentication
from bson import ObjectId


class MongoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        from rest_framework_simplejwt.settings import api_settings
        from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
        from django.utils.translation import gettext_lazy as _
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))
        try:
            user_id = ObjectId(user_id)
        except Exception:
            pass
        try:
            return self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed(_("User not found"), code="user_not_found")


class QueryParamJWTAuthentication(MongoJWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            return result
        raw_token = request.query_params.get("token")
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return (self.get_user(validated_token), validated_token)

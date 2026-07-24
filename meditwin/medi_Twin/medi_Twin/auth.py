from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.utils.translation import gettext_lazy as _
import logging

logger = logging.getLogger(__name__)

class MongoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Overrides default to handle MongoDB ObjectId casting.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))

        logger.warning(f"[MongoJWT] user_id from token: {user_id!r} (type={type(user_id).__name__})")

        # Try to cast to ObjectId
        try:
            from bson import ObjectId
            user_id_obj = ObjectId(user_id)
            logger.warning(f"[MongoJWT] Converted to ObjectId: {user_id_obj!r}")
        except Exception as e:
            logger.warning(f"[MongoJWT] ObjectId conversion failed: {e}, using raw value")
            user_id_obj = user_id

        # Try ObjectId first, then raw string as fallback
        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id_obj})
            logger.warning(f"[MongoJWT] Found user with ObjectId: {user.username}")
            return user
        except self.user_model.DoesNotExist:
            logger.warning(f"[MongoJWT] ObjectId lookup failed, trying string...")

        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
            logger.warning(f"[MongoJWT] Found user with string: {user.username}")
            return user
        except self.user_model.DoesNotExist:
            logger.warning(f"[MongoJWT] String lookup also failed!")

        # Last resort: list all users for debugging
        all_users = list(self.user_model.objects.values_list('id', 'username'))
        logger.warning(f"[MongoJWT] All users in DB: {all_users}")

        raise AuthenticationFailed(_("User not found"), code="user_not_found")

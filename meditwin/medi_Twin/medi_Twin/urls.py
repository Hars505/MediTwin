"""
URL configuration for medi_Twin project.
Central URL routing — all API endpoints are namespaced under /api/.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # === MediTwin API Routes ===
    path('api/auth/', include('accounts.urls')),
    path('api/patient/', include('patients.urls')),
    path('api/ml/', include('ml_engine.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/reports/', include('reports.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = f"{settings.SITE_NAME} — управління стипендіями"
admin.site.site_title = f"Стипендії {settings.SITE_NAME}"
admin.site.index_title = "Панель адміністратора"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("scholarships.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

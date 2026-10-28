from django.conf import settings

from .models import ApplicationChoice


def site(request):
    user = getattr(request, "user", None)
    role, pending = "", 0
    if user is not None and user.is_authenticated:
        if user.is_superuser:
            role = "Адміністратор"
        elif user.is_staff:
            role = "Модератор"
        else:
            role = "Учень"
        if user.is_staff:
            pending = ApplicationChoice.objects.filter(status=ApplicationChoice.Status.PENDING).count()
    return {
        "SITE_NAME": settings.SITE_NAME,
        "SITE_FULL_NAME": settings.SITE_FULL_NAME,
        "CAFE_NAME": settings.CAFE_NAME,
        "ROLE_LABEL": role,
        "PENDING_COUNT": pending,
    }

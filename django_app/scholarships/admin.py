from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from .models import (Application, ApplicationChoice, ApplicationPeriod,
                     PortfolioItem, Program, Scholarship, StudentProfile)


class PortfolioInline(admin.TabularInline):
    model = PortfolioItem
    extra = 0


class ChoiceInline(admin.TabularInline):
    model = ApplicationChoice
    extra = 0


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "period", "programs_text", "submitted_at")
    list_filter = ("period",)
    search_fields = ("student__username", "student__last_name", "student__first_name")
    inlines = [ChoiceInline, PortfolioInline]


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ("student", "program", "academic_year", "sponsor", "amount", "issued_at")
    list_filter = ("academic_year", "program", "sponsor")
    search_fields = ("student__username", "student__last_name", "student__first_name")


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("photo_preview", "user", "patronymic", "group", "course", "phone")
    list_display_links = ("photo_preview", "user")
    list_filter = ("course", "group")
    search_fields = ("user__last_name", "user__first_name", "patronymic", "group")
    readonly_fields = ("photo_preview",)

    @admin.display(description="Фото")
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="height:48px;width:48px;object-fit:cover;border-radius:50%">', obj.photo.url)
        return "—"


class ProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    fields = ("group", "course", "patronymic", "phone", "photo")


admin.site.unregister(User)


@admin.register(User)
class SiteUserAdmin(UserAdmin):
    inlines = [ProfileInline]
    list_display = ("username", "last_name", "first_name", "is_staff")


@admin.register(ApplicationPeriod)
class ApplicationPeriodAdmin(admin.ModelAdmin):
    list_display = ("title", "academic_year", "start_date", "end_date", "results_date", "results_published")


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "amount", "amount_note")


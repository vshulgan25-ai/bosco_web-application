import csv
from functools import wraps
from decimal import Decimal

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import login
from django.contrib.auth.views import redirect_to_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView, LogoutView
from django.db import transaction as db_transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.decorators import method_decorator

from .forms import (ApplicationForm, PortfolioFormSet, ProfileForm,
                    RegisterForm)
from .models import (Application, ApplicationChoice, ApplicationPeriod,
                     Program, Scholarship)


from django.views.generic import DetailView

from . import data

def staff_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect_to_login(request.get_full_path(), login_url=reverse("login"))
        if not request.user.is_staff:
            messages.error(request, "Цей розділ доступний лише модераторам.")
            return redirect("dashboard")
        return view(request, *args, **kwargs)
    return wrapper


def superuser_required(view):
    @login_required
    def wrapper(request, *args, **kwargs):
        if not request.user.is_superuser:
            messages.error(request, "Ця дія доступна лише адміністратору.")
            return redirect("panel_home")
        return view(request, *args, **kwargs)
    wrapper.__name__ = view.__name__
    return wrapper


def _current_period():
    today = timezone.localdate()
    return ApplicationPeriod.objects.filter(start_date__lte=today, end_date__gte=today).first()


def _visible_scholarships(user):
    """Стипендії, які учень уже може бачити (після публікації результатів)."""
    return (Scholarship.objects.filter(student=user)
            .filter(Q(choice__isnull=True) | Q(choice__application__period__results_published=True))
            .select_related("program"))


def _scholar_rows(year, q="", kind=""):
    """Публічний перелік стипендіатів навчального року: один рядок на учня."""
    qs = (Scholarship.objects.filter(academic_year=year, student__is_staff=False)
          .filter(Q(choice__isnull=True) | Q(choice__application__period__results_published=True))
          .select_related("student__profile", "program")
          .order_by("student__last_name", "student__first_name", "program_id"))
    if kind:
        qs = qs.filter(student__in=Scholarship.objects.filter(academic_year=year, program__kind=kind).values("student"))
    if q:
        qs = qs.filter(Q(student__last_name__icontains=q) | Q(student__first_name__icontains=q)
                       | Q(student__profile__patronymic__icontains=q) | Q(student__profile__group__icontains=q))
    rows = {}
    for s in qs:
        row = rows.setdefault(s.student_id, {"student": s.student, "programs": []})
        row["programs"].append(s.program)
    return list(rows.values())


# ---------- Загальні сторінки ----------

def home(request):
    open_period = _current_period()
    period = open_period or ApplicationPeriod.objects.first()
    return render(request, "scholarships/home.html", {
        "programs": Program.objects.all(),
        "period": period,
        "period_open": bool(open_period),
        "scholars": _scholar_rows(data.ACADEMIC_YEAR),
        "scholars_year": data.ACADEMIC_YEAR,
    })


def scholars(request):
    years = list(Scholarship.objects.order_by("-academic_year").values_list("academic_year", flat=True).distinct())
    year = request.GET.get("year") or (years[0] if years else data.ACADEMIC_YEAR)
    q = request.GET.get("q", "").strip()
    kind = request.GET.get("kind", "")
    return render(request, "scholarships/scholars.html", {
        "scholars": _scholar_rows(year, q, kind), "year": year, "years": years,
        "q": q, "kind": kind, "kinds": Program.Kind.choices,
    })


def register(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, "Акаунт створено. Ласкаво просимо!")
        return redirect("dashboard")
    return render(request, "scholarships/register.html", {"form": form})


class SiteLoginView(LoginView):
    template_name = "scholarships/login.html"
    redirect_authenticated_user = True

    def get_success_url(self):
        url = self.get_redirect_url()
        if url:
            return url
        return reverse("panel_home") if self.request.user.is_staff else reverse("dashboard")


class SiteLogoutView(LogoutView):
    pass


# ---------- Кабінет учня ----------

@login_required
def apply(request):
    period = _current_period()
    if period is None:
        return render(request, "scholarships/apply.html", {"period": None})

    if Application.objects.filter(student=request.user, period=period).exists():
        messages.info(request, "Ви вже подали заявку в цьому наборі. Її статус можна переглянути тут.")
        return redirect("my_applications")

    form = ApplicationForm(request.POST or None)
    formset = PortfolioFormSet(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid() and formset.is_valid():
        with db_transaction.atomic():
            application = form.save(commit=False)
            application.student = request.user
            application.period = period
            application.save()
            for program in form.cleaned_data["programs"]:
                ApplicationChoice.objects.create(application=application, program=program)
            formset.instance = application
            formset.save()
        messages.success(request, "Заявку подано! Вона перебуває на розгляді.")
        return redirect("my_applications")
    return render(request, "scholarships/apply.html", {"form": form, "formset": formset, "period": period})


@login_required
def profile(request):
    profile_obj = request.user.profile
    form = ProfileForm(request.POST or None, request.FILES or None, instance=profile_obj)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Профіль оновлено.")
        return redirect("profile")
    return render(request, "scholarships/profile.html", {"form": form, "profile": profile_obj})


@login_required
def my_applications(request):
    applications = (Application.objects.filter(student=request.user)
                    .select_related("period").prefetch_related("choices__program", "portfolio"))
    return render(request, "scholarships/my_applications.html", {"applications": applications})


@login_required
def dashboard(request):
    scholarships = _visible_scholarships(request.user)
    choices = (ApplicationChoice.objects.filter(application__student=request.user)
               .select_related("program", "application__period"))
    pending = [c for c in choices if c.public_status == ApplicationChoice.Status.PENDING]
    return render(request, "scholarships/dashboard.html", {
        "scholarships": scholarships,
        "pending": pending,
    })


# ---------- Панель адміністратора ----------

@staff_required
def panel_home(request):
    if request.method == "POST":
        if not request.user.is_superuser:
            messages.error(request, "Публікувати результати може лише адміністратор.")
            return redirect("panel_home")
        period = get_object_or_404(ApplicationPeriod, pk=request.POST.get("period_id"))
        period.results_published = request.POST.get("action") == "publish"
        period.save(update_fields=["results_published"])
        messages.success(request, "Результати опубліковано для учнів." if period.results_published
                         else "Публікацію результатів знято.")
        return redirect("panel_home")

    S = ApplicationChoice.Status
    stats = {
        "applications": Application.objects.count(),
        "pending": ApplicationChoice.objects.filter(status=S.PENDING).count(),
        "approved": ApplicationChoice.objects.filter(status=S.APPROVED).count(),
        "rejected": ApplicationChoice.objects.filter(status=S.REJECTED).count(),
        "students": User.objects.filter(is_staff=False).count(),
        "scholarships": Scholarship.objects.count(),
    }
    latest = (Application.objects.filter(choices__status=S.PENDING).distinct()
              .select_related("student__profile", "period").prefetch_related("choices__program")[:8])
    return render(request, "scholarships/panel_home.html", {
        "stats": stats,
        "latest": latest,
        "periods": ApplicationPeriod.objects.all(),
    })


def _filtered_applications(request):
    qs = (Application.objects.select_related("student__profile", "period")
          .prefetch_related("choices__program"))
    status = request.GET.get("status", "")
    program = request.GET.get("program", "")
    q = request.GET.get("q", "").strip()
    if status:
        qs = qs.filter(choices__status=status)
    if program.isdigit():
        qs = qs.filter(choices__program_id=program)
    if q:
        qs = qs.filter(Q(student__last_name__icontains=q) | Q(student__first_name__icontains=q)
                       | Q(student__username__icontains=q) | Q(student__profile__group__icontains=q))
    return qs.distinct(), status, program, q


@staff_required
def panel_applications(request):
    qs, status, program, q = _filtered_applications(request)
    return render(request, "scholarships/panel_applications.html", {
        "applications": qs, "status": status, "program": program, "q": q,
        "programs": Program.objects.all(), "statuses": ApplicationChoice.Status.choices,
    })

@method_decorator(staff_required, name="dispatch")
class PanelApplicationDetailView(DetailView):
    model = Application
    context_object_name = "application"
    template_name = "scholarships/panel_application_detail.html"

    def get_queryset(self):
        return (super().get_queryset()
                .select_related("student__profile", "period")
                .prefetch_related("choices__program", "portfolio"))

    def post(self, request, *args, **kwargs):
        application = self.get_object()
        choice = get_object_or_404(application.choices, pk=request.POST.get("choice_id"))
        comment = request.POST.get("comment", "").strip()
        if request.POST.get("action") == "approve":
            choice.approve(comment)
            messages.success(request, f"Схвалено: {choice.program.name}. Стипендію створено.")
        elif request.POST.get("action") == "reject":
            choice.reject(comment)
            messages.warning(request, f"Відхилено: {choice.program.name}.")
        return redirect("panel_application_detail", pk=application.pk)


@staff_required
def panel_export(request):
    qs, *_ = _filtered_applications(request)
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="applications.csv"'
    response.write("\ufeff")  # щоб Excel правильно відкрив кирилицю
    writer = csv.writer(response, delimiter=";")
    writer.writerow(["Учень", "Група", "Набір", "Подано", "Стипендія", "Статус", "Коментар"])
    for app in qs:
        for c in app.choices.all():
            writer.writerow([
                app.student.get_full_name() or app.student.username,
                app.student.profile.group, app.period.title,
                timezone.localtime(app.submitted_at).strftime("%d.%m.%Y %H:%M"),
                c.program.name, c.get_status_display(), c.comment,
            ])
    return response

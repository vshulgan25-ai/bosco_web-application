from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    group = models.CharField("Група", max_length=20, blank=True)
    course = models.PositiveSmallIntegerField("Курс", null=True, blank=True, choices=[(1, "1 курс"), (2, "2 курс")])
    patronymic = models.CharField("По батькові", max_length=100, blank=True)
    phone = models.CharField("Телефон", max_length=20, blank=True)
    photo = models.ImageField("Фото", upload_to="students/", blank=True)

    class Meta:
        verbose_name = "Профіль учня"
        verbose_name_plural = "Профілі учнів"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.group})"

    @property
    def full_name(self):
        parts = [self.user.last_name, self.user.first_name, self.patronymic]
        return " ".join(p for p in parts if p) or self.user.username

    @property
    def initials(self):
        u = self.user
        return ((u.last_name[:1] + u.first_name[:1]) or u.username[:2]).upper()


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        StudentProfile.objects.get_or_create(user=instance)


class Program(models.Model):
    class Kind(models.TextChoices):
        TUITION = "tuition", "Навчання в закладі"
        COLLEGIUM = "collegium", "Колегіум"
        CAFE = "cafe", "Харчування в кафе «Мама Маргарита»"

    name = models.CharField("Назва програми", max_length=150)
    kind = models.CharField("Напрям", max_length=20, choices=Kind.choices)
    description = models.TextField("Опис", blank=True)
    amount = models.DecimalField("Розмір стипендії (грн)", max_digits=10, decimal_places=2)
    amount_note = models.CharField("Примітка до суми (за модуль, щодня…)", max_length=50, blank=True)

    class Meta:
        verbose_name = "Стипендіальна програма"
        verbose_name_plural = "Стипендіальні програми"
        ordering = ["id"]

    def __str__(self):
        return self.name


class ApplicationPeriod(models.Model):
    title = models.CharField("Назва набору", max_length=150)
    academic_year = models.CharField("Навчальний рік", max_length=9, default="2025/2026", help_text="Наприклад: 2025/2026")
    start_date = models.DateField("Початок прийому заявок")
    end_date = models.DateField("Кінець прийому заявок")
    results_date = models.DateField("Дата оголошення результатів")
    results_published = models.BooleanField("Результати опубліковано для учнів", default=False)

    class Meta:
        verbose_name = "Період подання заявок"
        verbose_name_plural = "Періоди подання заявок"
        ordering = ["-start_date"]

    def __str__(self):
        return self.title

    @property
    def is_open(self):
        return self.start_date <= timezone.localdate() <= self.end_date


class Application(models.Model):
    """Одна заявка учня за набір; містить вибір однієї або кількох стипендій."""

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications", verbose_name="Учень")
    period = models.ForeignKey(ApplicationPeriod, on_delete=models.CASCADE, related_name="applications", verbose_name="Набір")
    motivation = models.TextField("Мотиваційний лист")
    submitted_at = models.DateTimeField("Подано", auto_now_add=True)

    class Meta:
        verbose_name = "Заявка"
        verbose_name_plural = "Заявки"
        ordering = ["-submitted_at"]
        unique_together = ("student", "period")

    def __str__(self):
        return f"{self.student} — {self.period}"

    @property
    def programs_text(self):
        return ", ".join(c.program.name for c in self.choices.all())


class ApplicationChoice(models.Model):
    """Рішення комісії щодо конкретного виду стипендії в заявці."""

    class Status(models.TextChoices):
        PENDING = "pending", "На розгляді"
        APPROVED = "approved", "Схвалено"
        REJECTED = "rejected", "Відхилено"

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="choices", verbose_name="Заявка")
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="choices", verbose_name="Стипендія")
    status = models.CharField("Статус", max_length=10, choices=Status.choices, default=Status.PENDING)
    comment = models.TextField("Коментар комісії", blank=True)
    decided_at = models.DateTimeField("Дата рішення", null=True, blank=True)

    class Meta:
        verbose_name = "Вибір стипендії в заявці"
        verbose_name_plural = "Вибрані стипендії в заявках"
        unique_together = ("application", "program")
        ordering = ["program_id"]

    def __str__(self):
        return f"{self.application.student} → {self.program} ({self.get_status_display()})"

    @property
    def public_status(self):
        """Учень бачить рішення лише після публікації результатів."""
        if self.application.period.results_published:
            return self.status
        return self.Status.PENDING

    @property
    def public_status_display(self):
        return self.Status(self.public_status).label

    def approve(self, comment=""):
        self.status = self.Status.APPROVED
        self.comment = comment
        self.decided_at = timezone.now()
        self.save()
        Scholarship.objects.get_or_create(
            choice=self,
            defaults={
                "student": self.application.student,
                "program": self.program,
                "amount": self.program.amount,
                "academic_year": self.application.period.academic_year,
            },
        )

    def reject(self, comment=""):
        self.status = self.Status.REJECTED
        self.comment = comment
        self.decided_at = timezone.now()
        self.save()
        Scholarship.objects.filter(choice=self).delete()


class PortfolioItem(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="portfolio", verbose_name="Заявка")
    title = models.CharField("Назва (грамота, сертифікат, проєкт…)", max_length=150)
    file = models.FileField("Файл", upload_to="portfolio/%Y/%m/")

    class Meta:
        verbose_name = "Документ портфоліо"
        verbose_name_plural = "Портфоліо"

    def __str__(self):
        return self.title


class Scholarship(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="scholarships", verbose_name="Учень")
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="scholarships", verbose_name="Програма")
    choice = models.OneToOneField(ApplicationChoice, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Рішення по заявці")
    amount = models.DecimalField("Призначена сума (грн)", max_digits=10, decimal_places=2)
    academic_year = models.CharField("Навчальний рік", max_length=9, default="2025/2026", db_index=True)
    sponsor = models.CharField("Засновник стипендії", max_length=200, blank=True)
    issued_at = models.DateField("Дата призначення", default=timezone.localdate)

    class Meta:
        verbose_name = "Стипендія"
        verbose_name_plural = "Стипендії"
        ordering = ["-issued_at", "-id"]

    def __str__(self):
        return f"{self.student} — {self.program} ({self.amount} грн)"

from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from scholarships import data
from scholarships.models import (Application, ApplicationChoice,
                                 ApplicationPeriod, Program,
                                 Scholarship)


class Command(BaseCommand):
    help = "Заповнює БД початковими даними: програми, набори, меню, акаунти та стипендіати 2025–2026"

    def add_arguments(self, parser):
        parser.add_argument("--password", default=data.DEFAULT_PASSWORD,
                            help="Пароль для новостворених акаунтів стипендіатів")

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin12345",
                                          first_name="Адміністратор", last_name="Системи")
        if not User.objects.filter(username="moderator").exists():
            User.objects.create_user("moderator", password="moderator12345", is_staff=True,
                                     first_name="Модератор", last_name="Стипендіальної комісії")

        programs = {}
        for kind, p in data.PROGRAMS.items():
            programs[kind], _ = Program.objects.update_or_create(
                kind=kind,
                defaults={
                    "name": p["name"], "amount": Decimal(p["amount"]), "amount_note": p["amount_note"],
                    "description": p["description"],
                },
            )

        past, _ = ApplicationPeriod.objects.update_or_create(
            title="Набір на стипендії 2025/2026",
            defaults={"academic_year": "2025/2026", "start_date": date(2025, 9, 1), "end_date": date(2025, 12, 24),
                      "results_date": date(2026, 1, 31), "results_published": True})
        ApplicationPeriod.objects.get_or_create(
            title="Набір на стипендії 2026/2027",
            defaults={"academic_year": "2026/2027", "start_date": date(2026, 9, 1), "end_date": date(2026, 12, 24),
                      "results_date": date(2027, 1, 31), "results_published": False})

        created_users = []
        for s in data.SCHOLARS:
            user, created = User.objects.get_or_create(
                username=s["username"],
                defaults={"first_name": s["first_name"], "last_name": s["last_name"]})
            if created:
                user.set_password(password)  # PBKDF2 + сіль
                user.save()
                created_users.append(user.username)
            profile = user.profile
            profile.group = s["group"]
            profile.course = s["course"]
            profile.save()

            app, _ = Application.objects.get_or_create(
                student=user, period=past,
                defaults={"motivation": "Заявка стипендіата 2025/2026 навчального року."})
            for kind in s["programs"]:
                choice, _ = ApplicationChoice.objects.get_or_create(application=app, program=programs[kind])
                if choice.status != ApplicationChoice.Status.APPROVED:
                    choice.approve("Вітаємо зі стипендією!")
                Scholarship.objects.filter(choice=choice).update(
                    issued_at=past.results_date, academic_year=data.ACADEMIC_YEAR)

        self.stdout.write(self.style.SUCCESS("Початкові дані створено."))
        self.stdout.write("  admin / admin12345 (адміністратор)")
        self.stdout.write("  moderator / moderator12345 (модератор)")
        for s in data.SCHOLARS:
            note = f"пароль: {password}" if s["username"] in created_users else "акаунт уже існував"
            self.stdout.write(f"  {s['username']} — {s['last_name']} {s['first_name']} ({note})")

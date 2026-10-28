import csv
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.crypto import get_random_string

from scholarships import data
from scholarships.importers import Report, merge, read_list, read_tuition
from scholarships.models import (Application, ApplicationChoice,
                                 ApplicationPeriod, Program, Scholarship)
from scholarships.utils import optimize_photo, promote_group, translit

PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
SEEDED = {(s["last_name"], s["first_name"]): s for s in data.SCHOLARS}


class Command(BaseCommand):
    help = "Імпортує стипендіатів і їхні фото з двох Excel-файлів (навчання; колегіум та харчування)"

    def add_arguments(self, parser):
        base = Path(settings.BASE_DIR) / "data"
        parser.add_argument("--tuition", default=str(base / "scholarship_tuition.xlsx"))
        parser.add_argument("--list", default=str(base / "students_list.xlsx"))
        parser.add_argument("--year", default=data.ACADEMIC_YEAR)
        parser.add_argument("--credentials", default=str(base / "import_credentials.csv"),
                            help="CSV з логінами та паролями нових акаунтів")
        parser.add_argument("--overwrite-photos", action="store_true", help="Замінити вже наявні фото")
        parser.add_argument("--no-photos", action="store_true")
        parser.add_argument("--dry-run", action="store_true", help="Лише показати, що буде зроблено")

    def _username(self, last, first):
        base = f"{translit(last)}.{translit(first)}".strip(".") or "student"
        username, n = base, 2
        while User.objects.filter(username=username).exists():
            username, n = f"{base}{n}", n + 1
        return username

    def handle(self, *args, **o):
        for key in ("tuition", "list"):
            if not Path(o[key]).exists():
                raise CommandError(f"Файл не знайдено: {o[key]}")

        report = Report()
        people = merge(read_tuition(o["tuition"], report), read_list(o["list"], report))
        self.stdout.write(f"Знайдено учнів: {len(people)}")
        if report.conflicts:
            self.stdout.write(self.style.WARNING(f"Рядки з двома фото (використано перше): {sorted(set(report.conflicts))}"))

        programs = {}
        for kind, p in data.PROGRAMS.items():
            programs[kind], _ = Program.objects.get_or_create(kind=kind, defaults={
                "name": p["name"], "amount": p["amount"], "amount_note": p["amount_note"],
                "description": p["description"]})

        stats = {"created": 0, "existing": 0, "scholarships": 0, "photos": 0}
        credentials, no_photo = [], []

        with transaction.atomic():
            from datetime import date
            period, _ = ApplicationPeriod.objects.get_or_create(
                title=f"Набір на стипендії {o['year']}",
                defaults={"academic_year": o["year"], "start_date": date(2025, 9, 1), "end_date": date(2025, 12, 24),
                          "results_date": date(2026, 1, 31), "results_published": True})

            for p in people.values():
                parts = p["name"].split()
                last, first, patronymic = parts[0], (parts[1] if len(parts) > 1 else ""), " ".join(parts[2:])

                user = User.objects.filter(last_name=last, first_name=first, is_staff=False).first()
                if user is None:
                    user = User(username=self._username(last, first), first_name=first, last_name=last)
                    password = get_random_string(10, PASSWORD_CHARS)
                    user.set_password(password)  # PBKDF2 + сіль
                    user.save()
                    credentials.append((p["name"], user.username, password, p["group"]))
                    stats["created"] += 1
                else:
                    stats["existing"] += 1

                profile = user.profile
                override = SEEDED.get((last, first))  # групу з seed_demo не перезаписуємо
                if not (override and profile.group):
                    profile.group = promote_group(p["group"]) or profile.group
                profile.course = data.COURSE
                profile.patronymic = patronymic or profile.patronymic
                profile.save()

                if not o["no_photos"] and not o["dry_run"]:
                    if p["photo"] and (o["overwrite_photos"] or not profile.photo):
                        profile.photo.save(f"{user.username}.jpg", ContentFile(optimize_photo(p["photo"])), save=True)
                        stats["photos"] += 1
                    elif not p["photo"] and not profile.photo:
                        no_photo.append(p["name"])

                app, _ = Application.objects.get_or_create(
                    student=user, period=period,
                    defaults={"motivation": f"Заявка стипендіата {o['year']} навчального року."})
                for kind in sorted(p["kinds"]):
                    choice, _ = ApplicationChoice.objects.get_or_create(application=app, program=programs[kind])
                    if choice.status != ApplicationChoice.Status.APPROVED:
                        choice.approve("Вітаємо зі стипендією!")
                    sponsor = p["sponsor"] if kind in p["sponsor_kinds"] else ""
                    fields = {"issued_at": period.results_date, "academic_year": o["year"]}
                    if sponsor:
                        fields["sponsor"] = sponsor
                    Scholarship.objects.filter(choice=choice).update(**fields)
                    stats["scholarships"] += 1

            if o["dry_run"]:
                transaction.set_rollback(True)

        if credentials and not o["dry_run"]:
            path = Path(o["credentials"])
            new_file = not path.exists()
            with path.open("a", encoding="utf-8-sig", newline="") as f:
                w = csv.writer(f, delimiter=";")
                if new_file:
                    w.writerow(["ПІП", "Логін", "Пароль", "Група"])
                w.writerows(credentials)
            self.stdout.write(f"Логіни й паролі нових акаунтів: {path}")

        self.stdout.write(self.style.SUCCESS(
            f"Готово{' (пробний запуск, нічого не збережено)' if o['dry_run'] else ''}: "
            f"нових учнів {stats['created']}, уже були {stats['existing']}, "
            f"стипендій оброблено {stats['scholarships']}, фото додано {stats['photos']}."))
        if no_photo:
            self.stdout.write(self.style.WARNING("Без фото: " + "; ".join(no_photo)))

import os
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.utils import timezone
from playwright.sync_api import expect, sync_playwright

from scholarships.models import (Application, ApplicationChoice,
                                 ApplicationPeriod, Program, Scholarship)

os.environ.setdefault("DJANGO_ALLOW_ASYNC_UNSAFE", "true")

PASSWORD = "Bosco_Test_2026!"


class BaseUiTest(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            headless=os.environ.get("HEADLESS", "1") == "1",
            slow_mo=int(os.environ.get("SLOW_MO", "0")),
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        super().tearDownClass()

    def setUp(self):
        today = timezone.localdate()
        self.period = ApplicationPeriod.objects.create(
            title="Тестовий набір",
            academic_year="2026/2027",
            start_date=today - timedelta(days=1),
            end_date=today + timedelta(days=30),
            results_date=today + timedelta(days=60),
        )
        self.program = Program.objects.create(
            name="Стипендія на навчання",
            kind=Program.Kind.TUITION,
            amount=Decimal("10000"),
            amount_note="за модуль",
        )
        self.page = self.browser.new_page()
        self.page.set_default_timeout(8000)

    def tearDown(self):
        self.page.close()

    def url(self, path):
        return f"{self.live_server_url}{path}"

    def create_student(self, username="test.student"):
        user = User.objects.create_user(
            username, password=PASSWORD, first_name="Олена", last_name="Тестова"
        )
        user.profile.group = "ІТ-22"
        user.profile.save()
        return user

    def login(self, username):
        self.page.goto(self.url("/login/"))
        self.page.fill("#id_username", username)
        self.page.fill("#id_password", PASSWORD)
        self.page.get_by_role("button", name="Увійти").click()


class StudentScenariosTest(BaseUiTest):
    def test_student_registration(self):
        page = self.page
        page.goto(self.url("/"))
        page.locator("header.top nav").get_by_role("link", name="Реєстрація").click()
        expect(page.get_by_role("heading", name="Реєстрація учня")).to_be_visible()

        page.fill("#id_username", "new.student")
        page.fill("#id_first_name", "Марія")
        page.fill("#id_last_name", "Коваль")
        page.fill("#id_group", "ІТ-22")
        page.fill("#id_password1", PASSWORD)
        page.fill("#id_password2", PASSWORD)
        page.get_by_role("button", name="Зареєструватися").click()

        expect(page).to_have_url(self.url("/cabinet/"))
        expect(page.locator(".msg.success")).to_contain_text("Акаунт створено")
        expect(page.locator("header.top nav button")).to_contain_text("new.student")

        user = User.objects.get(username="new.student")
        self.assertEqual(user.profile.group, "ІТ-22")
        self.assertFalse(user.is_staff)

    def test_student_submits_application(self):
        student = self.create_student()
        page = self.page
        self.login("test.student")
        expect(page).to_have_url(self.url("/cabinet/"))

        page.locator("header.top nav").get_by_role("link", name="Подати заявку").click()
        expect(page.get_by_role("heading", name="Заявка на стипендію")).to_be_visible()

        page.get_by_label("Стипендія на навчання").check()
        page.fill("#id_motivation", "Навчаюся на відмінно та беру участь у проєктах Центру.")
        page.get_by_role("button", name="Надіслати заявку").click()

        expect(page).to_have_url(self.url("/applications/"))
        expect(page.locator(".msg.success")).to_contain_text("Заявку подано")

        application = Application.objects.get(student=student, period=self.period)
        choice = application.choices.get()
        self.assertEqual(choice.program, self.program)
        self.assertEqual(choice.status, ApplicationChoice.Status.PENDING)

    def test_login_with_wrong_password(self):
        self.create_student()
        page = self.page
        page.goto(self.url("/login/"))
        page.fill("#id_username", "test.student")
        page.fill("#id_password", "неправильний_пароль")
        page.get_by_role("button", name="Увійти").click()

        expect(page.locator(".errorlist")).to_be_visible()
        expect(page).to_have_url(self.url("/login/"))


class ModeratorScenariosTest(BaseUiTest):
    def test_moderator_approves_application(self):
        student = self.create_student()
        application = Application.objects.create(
            student=student, period=self.period, motivation="Прошу розглянути заявку."
        )
        choice = ApplicationChoice.objects.create(application=application, program=self.program)
        User.objects.create_user("moder", password=PASSWORD, is_staff=True)

        page = self.page
        self.login("moder")
        expect(page).to_have_url(self.url("/panel/"))

        page.goto(self.url(f"/panel/applications/{application.pk}/"))
        page.fill("textarea[name=comment]", "Відповідає критеріям.")
        page.get_by_role("button", name="Схвалити").click()

        expect(page.locator(".msg.success")).to_contain_text("Схвалено")

        choice.refresh_from_db()
        self.assertEqual(choice.status, ApplicationChoice.Status.APPROVED)
        self.assertTrue(Scholarship.objects.filter(choice=choice, student=student).exists())

    def test_student_cannot_open_panel(self):
        self.create_student()
        self.login("test.student")
        self.page.goto(self.url("/panel/"))
        expect(self.page).to_have_url(self.url("/cabinet/"))
        expect(self.page.locator(".msg.error")).to_contain_text("лише модераторам")

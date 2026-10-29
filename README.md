# Bosco Scholarships — Система управління стипендіями

> Навчальний проєкт, розроблений як практична робота з веб-розробки для Центру професійної освіти «Боско».

## Що робить?

Система автоматизує процес управління стипендіями в Центрі «Боско». Студент може подати заявку на стипендію, переглядати статус — адміністраторський кабінет дозволяє розглядати заявки, публікувати результати та відстежувати стипендіатів.

### Функціонал

- **Учень:** Вхід / реєстрація, особистий кабінет, перегляд активних заявок з автоматичним відображенням стипендій, реєстрація та перегляд профілю
- **Адміністратор:** Керування, перегляд і обробка заявок, схвалення / відхилення з коментарями, публікація результатів, експорт у CSV
- **Публічна стінка:** Перелік стипендіатів із фільтром за навчальним роком та стипендіальними програмами

### Стипендіальні програми

| Програма | Тип |
|--------|------|
| Стипендія на навчання | Оплата навчання за модуль |
| Колегіум | Стипендія на проживання в колегіумі |
| Кафе «Мама Маргарита» | Щоденне харчування |

---

## Технічний стек

| Компонент | Технологія |
|-----------|-----------|
| Backend   | Python 3.10 + Django 5.2 |
| База даних | MySQL 8.0 |;
| Frontend  | Django Templates + HTML/CSS |
| Медіафайли | Pillow (обробка фотографій) |
| Імпорт даних | openpyxl (Excel) |
| Prod-сервер | Gunicorn |

---

## Швидкий старт (локально)

### 1. Клонування репозиторію

```bash
git clone https://github.com/vshulgan25-ai/bosco_web-application.git
cd bosco_web-application/django_app
```

### 2. Створення та активація віртуального середовища

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate
```

### 3. Встановлення залежностей

```bash
pip install -r requirements.txt
```

### 4. Створення файлу `.env`

```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

> Перед міграціями створіть базу: виконайте скрипт sql/01_create_database.sql у MySQL.

### 5. Застосування міграцій

```bash
python manage.py migrate
```

### 6. Завантаження тестових даних (75 стипендіатів)

```bash
python manage.py seed_demo
```

Після виконання у системі з'являться:

| Логін | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin12345` | Адміністратор |
| `moderator` | `moderator12345` | Модератор (staff) |
| `shulhan.veronika` | `BoscoStudent2025!` | Учень-стипендіат |
| `fedash.tereza` | `BoscoStudent2025!` | Учень-стипендіат |
| *(+73 стипендіатів)* | `BoscoStudent2025!` | Учні-стипендіати |

> Всі 75 стипендіатів 2025/2026 навчального року автоматично з'являються на публічній сторінці `/scholars/`.

### 7. Запуск сервера

```bash
python manage.py runserver
```

Відкрийте [http://127.0.0.1:8000](http://127.0.0.1:8000) у браузері.

---

## Налаштування середовища (`.env`)

| Змінна | Значення за замовчуванням | Опис |
|--------|--------------------------|------|
| `DJANGO_SECRET_KEY` | *(dev-ключ)* | Секретний ключ Django |
| `DJANGO_DEBUG` | `True` | Режим відладки |
| `DJANGO_ALLOWED_HOSTS` | `127.0.0.1,localhost` | Дозволені хости |
| `DB_NAME` | `bosco_scholarships` | Ім'я бази даних (тільки для MySQL) |
| `DB_USER` | `bosco` | Користувач БД (тільки для MySQL) |
| `DB_PASSWORD` | — | Пароль БД (тільки для MySQL) |
| `DB_HOST` | `127.0.0.1` | Хост БД (тільки для MySQL) |
| `DB_PORT` | `3306` | Порт БД (тільки для MySQL) |
| `BOSCO_DEFAULT_PASSWORD` | `BoscoStudent2025!` | Пароль для нових учнів (seed_demo) |

---

## Структура проєкту

```
django_app/
├── bosco/                  # Конфігурація Django (settings, urls, wsgi)
│   ├── settings.py         # Налаштування (з .env автоматично)
│   ├── urls.py
│   └── wsgi.py
├── scholarships/           # Основний функціонал
│   ├── models.py           # Моделі: StudentProfile, Program, Application, Scholarship
│   ├── views.py            # Views: публічні сторінки, кабінет адміністратора
│   ├── forms.py            # Форми реєстрації, заявки, профілю
│   ├── urls.py             # URL-маршрути
│   ├── data.py             # Статичні дані (75 стипендіатів 2025/2026)
│   ├── templates/          # HTML-шаблони
│   ├── static/             # CSS, зображення
│   ├── migrations/         # Міграції БД
│   └── management/
│       └── commands/
│           ├── seed_demo.py        # Заповнення демо-даними
│           └── import_students.py  # Імпорт із Excel
├── sql/                    # SQL-скрипти для MySQL
├── manage.py
├── requirements.txt
├── .env.example            # Зразок налаштувань
└── .env                    # Локальна конфігурація (не в git)
```

---

## Зв'язки між моделями

```
StudentProfile  ──── User (Django built-in)
Program         (tuition / collegium / cafe)
ApplicationPeriod
Application     ──── User + ApplicationPeriod
ApplicationChoice ── Application + Program  [pending / approved / rejected]
PortfolioItem   ──── Application
Scholarship     ──── User + Program + ApplicationChoice
```
---
## розділ про тести:
python manage.py test scholarships.tests -v 2

---

## Автор

**Вероніка Шульган** — студентка, навчальна практика 2025/2026  
Центр професійної освіти «Боско»

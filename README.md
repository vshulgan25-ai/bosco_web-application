# Bosco Scholarships — Веб-застосунок управління стипендіями

> Навчальний проєкт, розроблений під час виробничої практики у Центрі професійної освіти «Боско».

## Опис проєкту

Веб-застосунок для автоматизації процесу подання та розгляду стипендіальних заявок учнів Центру «Боско». Система дозволяє учням подавати заявки на стипендії, а адміністраторам — розглядати їх, схвалювати або відхиляти та публікувати результати.

### Функціонал

- **Учень:** реєстрація / вхід, особистий кабінет, подання заявки з мотиваційним листом і портфоліо, перегляд статусу заявки та нарахованих стипендій
- **Адміністратор:** панель керування, перегляд і фільтрація заявок, схвалення / відхилення з коментарями, публікація результатів, експорт у CSV
- **Публічна частина:** перелік стипендіатів за навчальний рік, опис стипендіальних програм

### Стипендіальні програми

| Напрям | Опис |
|--------|------|
| Навчання в закладі | Стипендія за навчальні досягнення |
| Колегіум | Стипендія для проживання в колегіумі |
| Кафе «Мама Маргарита» | Безкоштовне харчування |

---

## Технічний стек

| Компонент | Технологія |
|-----------|-----------|
| Backend   | Python 3.10 · Django 5.2 |
| База даних | SQLite (розробка) / MySQL (продакшн) |
| Frontend  | Django Templates · HTML/CSS |
| Медіафайли | Pillow (обробка зображень) |
| Імпорт даних | openpyxl (Excel) |
| Prod-сервер | Gunicorn |

---

## Швидкий старт (локально)

### 1. Клонувати репозиторій

```bash
git clone https://github.com/vshulgan25-ai/bosco_web-application.git
cd bosco_web-application/django_app
```

### 2. Створити та активувати віртуальне середовище

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate
```

### 3. Встановити залежності

```bash
pip install -r requirements.txt
```

### 4. Створити файл `.env`

```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

> **Важливо:** `.env.example` вже містить `DB_ENGINE=sqlite` — додаткових налаштувань **не потрібно**. Файл `.env` буде автоматично прочитаний при запуску.

### 5. Застосувати міграції

```bash
python manage.py migrate
```

### 6. Завантажити демо-дані (необов'язково)

```bash
python manage.py seed_demo
```

Після цього в системі будуть створені:

| Логін | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin12345` | Адміністратор |
| `moderator` | `moderator12345` | Модератор (staff) |
| `shulhan.veronika` | `BoscoStudent2025!` | Учень-стипендіат |
| `fedash.tereza` | `BoscoStudent2025!` | Учень-стипендіат |

### 7. Запустити сервер

```bash
python manage.py runserver
```

Відкрийте [http://127.0.0.1:8000](http://127.0.0.1:8000) у браузері.

---

## Змінні середовища (`.env`)

| Змінна | Значення за замовчуванням | Опис |
|--------|--------------------------|------|
| `DJANGO_SECRET_KEY` | *(dev-ключ)* | Секретний ключ Django |
| `DJANGO_DEBUG` | `True` | Режим відладки |
| `DJANGO_ALLOWED_HOSTS` | `127.0.0.1,localhost` | Дозволені хости |
| `DB_ENGINE` | `sqlite` | `sqlite` або `mysql` |
| `DB_NAME` | `bosco_scholarships` | Назва бази даних (тільки для MySQL) |
| `DB_USER` | `bosco` | Користувач БД (тільки для MySQL) |
| `DB_PASSWORD` | — | Пароль БД (тільки для MySQL) |
| `DB_HOST` | `127.0.0.1` | Хост БД (тільки для MySQL) |
| `DB_PORT` | `3306` | Порт БД (тільки для MySQL) |

---

## Структура проєкту

```
django_app/
├── bosco/                  # Налаштування Django (settings, urls, wsgi)
│   ├── settings.py         # Конфігурація (читає .env автоматично)
│   ├── urls.py
│   └── wsgi.py
├── scholarships/           # Основний застосунок
│   ├── models.py           # Моделі: StudentProfile, Program, Application, Scholarship
│   ├── views.py            # Views: кабінет учня, панель адміністратора
│   ├── forms.py            # Форми реєстрації, заявки, профілю
│   ├── urls.py             # URL-маршрути
│   ├── data.py             # Константи і демо-дані
│   ├── templates/          # HTML-шаблони
│   ├── static/             # CSS, зображення
│   ├── migrations/         # Міграції БД
│   └── management/
│       └── commands/
│           ├── seed_demo.py        # Заповнення демо-даними
│           └── import_students.py  # Імпорт з Excel
├── sql/                    # SQL-скрипти для MySQL
├── manage.py
├── requirements.txt
├── .env.example            # Зразок конфігурації
└── .env                    # Локальна конфігурація (не в git)
```

---

## Моделі бази даних

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

## Автор

**Вероніка Шулган** — студентка, виробнича практика 2025/2026  
Центр професійної освіти «Боско»

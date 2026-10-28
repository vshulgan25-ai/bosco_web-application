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
| Колегіум | Стипендія для вступу до коледжу |
| Кафе «Мама Маргарита» | Безкоштовне харчування |

---

## Технічний стек

| Компонент | Технологія |
|-----------|-----------|
| Backend   | Python 3.10 · Django 5.2 |
| База даних | MySQL (за замовчуванням) або SQLite (для розробки) |
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

### 4. Налаштувати змінні середовища

Скопіюйте `.env.example` у `.env` і відредагуйте за потребою:

```bash
copy .env.example .env   # Windows
# або
cp .env.example .env     # Linux/macOS
```

Для **швидкого локального запуску без MySQL** достатньо додати у `.env`:

```
DB_ENGINE=sqlite
DJANGO_DEBUG=True
```

### 5. Застосувати міграції та запустити

```bash
python manage.py migrate
python manage.py createsuperuser   # створити адміністратора
python manage.py runserver
```

Відкрийте [http://127.0.0.1:8000](http://127.0.0.1:8000) у браузері.

---

## Змінні середовища (`.env`)

| Змінна | За замовчуванням | Опис |
|--------|-----------------|------|
| `DJANGO_SECRET_KEY` | *(вбудований)* | Секретний ключ Django — **замінити у production** |
| `DJANGO_DEBUG` | `True` | Режим відладки |
| `DJANGO_ALLOWED_HOSTS` | `127.0.0.1,localhost` | Дозволені хости |
| `DB_ENGINE` | `mysql` | `mysql` або `sqlite` |
| `DB_NAME` | `bosco_scholarships` | Назва бази даних |
| `DB_USER` | `bosco` | Користувач БД |
| `DB_PASSWORD` | `bosco_password` | Пароль БД |
| `DB_HOST` | `127.0.0.1` | Хост БД |
| `DB_PORT` | `3306` | Порт БД |

---

## Структура проєкту

```
django_app/
├── bosco/                  # Налаштування Django (settings, urls, wsgi)
├── scholarships/           # Основний застосунок
│   ├── models.py           # Моделі: StudentProfile, Program, Application, Scholarship
│   ├── views.py            # Views: кабінет учня, панель адміністратора
│   ├── forms.py            # Форми реєстрації, заявки, профілю
│   ├── urls.py             # URL-маршрути
│   ├── templates/          # HTML-шаблони
│   ├── static/             # CSS, зображення
│   └── migrations/         # Міграції БД
├── manage.py
├── requirements.txt
└── .env.example
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

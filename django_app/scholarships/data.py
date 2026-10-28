"""Єдине джерело реальних даних про стипендіатів (використовується seed_demo та інтерфейсами)."""

import os

ACADEMIC_YEAR = "2025/2026"
COURSE = 2  # усі учні зараз на 2 курсі

# Пароль за замовчуванням для seed-команди (можна перевизначити через змінну середовища)
DEFAULT_PASSWORD = os.environ.get("BOSCO_DEFAULT_PASSWORD", "BoscoStudent2025!")

PROGRAMS = {
    "tuition": {
        "name": "Стипендія на навчання",
        "amount": "10000",
        "amount_note": "за модуль",
        "description": "Часткова оплата навчання в Центрі професійної освіти Боско за модуль.",
    },
    "collegium": {
        "name": "Стипендія на колегіум",
        "amount": "4000",
        "amount_note": "",
        "description": "Покриття проживання в колегіумі.",
    },
    "cafe": {
        "name": "Харчування в кафе «Мама Маргарита»",
        "amount": "200",
        "amount_note": "щодня",
        "description": "Харчування в кафе «Мама Маргарита».",
    },
}

SCHOLARS = [
    {
        "username": "shulhan.veronika",
        "first_name": "Вероніка",
        "last_name": "Шульган",
        "group": "ІТ-22",
        "course": 2,
        "programs": ["collegium", "tuition", "cafe"],
    },
    {
        "username": "fedash.tereza",
        "first_name": "Тереза",
        "last_name": "Федаш",
        "group": "ІТ-21",
        "course": 2,
        "programs": ["tuition", "cafe"],
    },
]

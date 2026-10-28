from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import inlineformset_factory

from .models import Application, PortfolioItem, Program, StudentProfile


class RegisterForm(UserCreationForm):
    first_name = forms.CharField(label="Ім'я", max_length=150)
    last_name = forms.CharField(label="Прізвище", max_length=150)
    email = forms.EmailField(label="Email", required=False)
    group = forms.CharField(label="Група (наприклад, ІТ-21)", max_length=20)
    course = forms.TypedChoiceField(
        label="Курс", required=False, coerce=int, empty_value=None,
        choices=[("", "— не вказано —")] + [(1, "1 курс"), (2, "2 курс")],
    )
    phone = forms.CharField(label="Телефон", max_length=20, required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "first_name", "last_name", "email")

    def save(self, commit=True):
        user = super().save(commit=True)
        profile = user.profile
        profile.group = self.cleaned_data["group"]
        profile.course = self.cleaned_data["course"]
        profile.phone = self.cleaned_data["phone"]
        profile.save()
        return user


ALLOWED_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx")


class ProgramChoiceField(forms.ModelMultipleChoiceField):
    def label_from_instance(self, obj):
        note = f" {obj.amount_note}" if obj.amount_note else ""
        return f"{obj.name} — {obj.amount:.0f} грн{note}"


class ApplicationForm(forms.ModelForm):
    programs = ProgramChoiceField(
        queryset=Program.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        label="Оберіть стипендії (можна одну, дві або всі)",
        error_messages={"required": "Оберіть хоча б один вид стипендії."},
    )

    class Meta:
        model = Application
        fields = ("motivation",)
        widgets = {"motivation": forms.Textarea(attrs={"rows": 6, "placeholder": "Розкажіть, чому саме ви заслуговуєте на стипендію…"})}


class PortfolioItemForm(forms.ModelForm):
    class Meta:
        model = PortfolioItem
        fields = ("title", "file")

    def clean_file(self):
        f = self.cleaned_data.get("file")
        if f:
            if not f.name.lower().endswith(ALLOWED_EXTENSIONS):
                raise forms.ValidationError("Дозволені формати: PDF, JPG, PNG, DOC, DOCX.")
            if f.size > 5 * 1024 * 1024:
                raise forms.ValidationError("Розмір файлу не повинен перевищувати 5 МБ.")
        return f


PortfolioFormSet = inlineformset_factory(
    Application, PortfolioItem, form=PortfolioItemForm, fields=("title", "file"), extra=3, can_delete=False
)


class ProfileForm(forms.ModelForm):
    class Meta:
        model = StudentProfile
        fields = ("photo", "phone")
        labels = {"photo": "Фото", "phone": "Телефон"}

    def clean_photo(self):
        f = self.cleaned_data.get("photo")
        if f and hasattr(f, "size") and f.size > 8 * 1024 * 1024:
            raise forms.ValidationError("Розмір фото не повинен перевищувати 8 МБ.")
        return f

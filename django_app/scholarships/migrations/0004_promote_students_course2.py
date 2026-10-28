import re

from django.db import migrations

_RE = re.compile(r"^(?P<prefix>[^\d\-]+?)\s*-?\s*1(?P<digit>\d)$")


def promote(group):
    g = " ".join((group or "").split())
    m = _RE.match(g)
    return f"{m.group('prefix')}-2{m.group('digit')}" if m else g


def to_second_course(apps, schema_editor):
    """Усі учні -> 2 курс; групи ІТ-11 -> ІТ-21, К-11 -> К-21, А-12 -> А-22 тощо. Нічого не видаляється."""
    Profile = apps.get_model("scholarships", "StudentProfile")
    for p in Profile.objects.filter(user__is_staff=False):
        new_group = promote(p.group)
        if p.course != 2 or new_group != p.group:
            p.course = 2
            p.group = new_group
            p.save(update_fields=["course", "group"])


class Migration(migrations.Migration):
    dependencies = [("scholarships", "0003_remove_accounting_two_courses")]
    operations = [migrations.RunPython(to_second_course, migrations.RunPython.noop)]

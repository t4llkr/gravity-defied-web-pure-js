#!/usr/bin/env python3
"""Массовое переименование паков: из имени файла оставить только id.

  "1173_GD 1473 Track Fix by Dev.mrg"  ->  "1173.mrg"
  "5_Belarussian Drift.mrg"            ->  "5.mrg"

Скрипт кладётся ПРЯМО В папку с паками (она и есть цель). По умолчанию
показывает план (сухой прогон) — для реального переименования добавь --apply.
Иначе: впиши путь в TARGET_DIR ниже.

Запуск:
    python3 rename_packs.py            # посмотреть, что будет сделано
    python3 rename_packs.py --apply    # переименовать
"""
import argparse
import re
from pathlib import Path

# Цель: папка, куда положен скрипт. Можно заменить на прямой путь, напр.:
# TARGET_DIR = Path(r"D:\gd\data\packs_gdmod")
TARGET_DIR = Path(__file__).resolve().parent

NAME_RE = re.compile(r"^(\d+)_")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="выполнить переименование (иначе только план)")
    args = ap.parse_args()

    files = [f for f in TARGET_DIR.iterdir() if f.is_file() and f.name != Path(__file__).name]
    plan, already, skipped, collisions = [], [], [], []
    taken = {}  # новое имя -> исходное имя (для обнаружения коллизий внутри папки)

    for f in sorted(files, key=lambda x: x.name):
        m = NAME_RE.match(f.name)
        if not m:
            skipped.append(f.name)
            continue
        new_name = m.group(1) + f.suffix
        if new_name == f.name:
            already.append(f.name)
            continue
        conflict = (TARGET_DIR / new_name).exists() and (TARGET_DIR / new_name) != f
        if new_name in taken:
            collisions.append(f"{f.name}  ->  {new_name}  (уже занято файлом '{taken[new_name]}')")
            continue
        if conflict:
            collisions.append(f"{f.name}  ->  {new_name}  (файл с таким именем уже существует)")
            continue
        taken[new_name] = f.name
        plan.append((f, TARGET_DIR / new_name))

    for src, dst in plan:
        print(f"  {src.name}  ->  {dst.name}")
    for c in collisions:
        print(f"  ! коллизия: {c}")
    for name in already:
        print(f"  = уже в целевом виде: {name}")
    for name in skipped:
        print(f"  ? пропущен (нет префикса '<id>_'): {name}")
    print(f"\nитого: переименовать {len(plan)}, коллизий {len(collisions)}, "
          f"уже ок {len(already)}, пропущено {len(skipped)} (из {len(files)} файлов в {TARGET_DIR})")

    if not args.apply:
        print("\nсухой прогон — для реального переименования добавь --apply")
        return
    for src, dst in plan:
        src.rename(dst)
    print("готово.")


if __name__ == "__main__":
    main()

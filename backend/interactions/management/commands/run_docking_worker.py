from __future__ import annotations

import contextlib
import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from interactions.services.docking_worker import POLL_INTERVAL_SECONDS, process_next_job


class Command(BaseCommand):
    help = "Run the single persistent database-backed docking worker."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Process at most one queued job.")

    @contextlib.contextmanager
    def _lock(self):
        lock_path = Path(settings.BASE_DIR) / "docking_data" / "docking_worker.lock"
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        handle = lock_path.open("a+")
        try:
            if os.name == "nt":
                import msvcrt
                handle.seek(0)
                try:
                    msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                except OSError as exc:
                    raise RuntimeError("Another docking worker is already running.") from exc
            else:
                import fcntl
                try:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                except OSError as exc:
                    raise RuntimeError("Another docking worker is already running.") from exc
            yield
        finally:
            try:
                if os.name == "nt":
                    handle.seek(0)
                    msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
            except (OSError, UnboundLocalError):
                pass
            handle.close()

    def handle(self, *args, **options):
        try:
            with self._lock():
                if options["once"]:
                    result = process_next_job()
                    if result is None:
                        self.stdout.write("No queued docking job.")
                    else:
                        self.stdout.write(f"Processed docking job {result.pk}: {result.status}")
                    return
                self.stdout.write("Docking worker started.")
                while True:
                    result = process_next_job()
                    if result is not None:
                        self.stdout.write(f"Processed docking job {result.pk}: {result.status}")
                    else:
                        import time
                        time.sleep(POLL_INTERVAL_SECONDS)
        except RuntimeError as exc:
            self.stderr.write(str(exc))

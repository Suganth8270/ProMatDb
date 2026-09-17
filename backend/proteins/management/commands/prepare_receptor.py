"""
manage.py prepare_receptor <PDB_ID>

Step 6B proof-of-concept command: runs the receptor preparation pipeline
(RCSB download -> clean -> Meeko PDBQT conversion) for a single, real PDB
ID and prints a verification report.

This command does NOT touch the database, does NOT run docking, and does
NOT modify any existing model, serializer, view, or URL. It exists purely
to manually verify proteins/services/docking_prep.py against a real
structure before any of this is wired into the API.

Usage:
    python manage.py prepare_receptor 1A8O
    python manage.py prepare_receptor 1A8O --output-dir /tmp/receptor_test
"""

from django.core.management.base import BaseCommand, CommandError

from proteins.services.docking_prep import (
    ReceptorPreparationError,
    prepare_receptor,
)


class Command(BaseCommand):
    help = (
        "Download a real PDB structure from RCSB and prepare it as a "
        "docking-ready PDBQT receptor using Meeko. Receptor preparation "
        "only -- no docking is performed."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "pdb_id",
            type=str,
            help="4-character PDB ID to prepare (e.g. 1A8O).",
        )
        parser.add_argument(
            "--output-dir",
            type=str,
            default=None,
            help=(
                "Directory to write the downloaded/cleaned/prepared files "
                "to. Defaults to <BASE_DIR>/docking_data/receptors/."
            ),
        )

    def handle(self, *args, **options):
        pdb_id = options["pdb_id"]
        output_dir = options["output_dir"]

        self.stdout.write(f"Preparing receptor for PDB ID: {pdb_id}")

        try:
            result = prepare_receptor(pdb_id, output_dir=output_dir)
        except ReceptorPreparationError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS("Receptor preparation succeeded."))
        self.stdout.write("")
        self.stdout.write(f"  PDB ID:                  {result.pdb_id}")
        self.stdout.write(f"  Downloaded PDB:          {result.source_pdb_path}")
        self.stdout.write(f"  Cleaned PDB:             {result.cleaned_pdb_path}")
        self.stdout.write(f"  Heteroatom lines removed:{result.heteroatom_records_removed}")
        self.stdout.write(f"  Receptor PDBQT:          {result.pdbqt_path}")
        self.stdout.write(f"  Atom count in PDBQT:     {result.atom_count}")

        if result.warnings:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Warnings:"))
            for warning in result.warnings:
                self.stdout.write(f"  - {warning}")
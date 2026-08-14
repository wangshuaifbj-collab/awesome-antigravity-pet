# -*- coding: utf-8 -*-
import unittest
import sys
from pathlib import Path

# Ensure package is discoverable
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from PyQt6.QtWidgets import QApplication

# Headless QApplication instance for Qt tests
app = QApplication.instance() or QApplication(sys.argv)

from antigravity_pet.engine.catalog import PetCatalog
from antigravity_pet.engine.spritesheet import SpriteSheet, SpritePlayer
from antigravity_pet.engine.fsm import PetAction


class TestAntigravityPetEngine(unittest.TestCase):

    def test_catalog_scanner(self):
        catalog = PetCatalog()
        pets = catalog.list_all()
        self.assertGreater(len(pets), 100, f"Expected >100 pets, found {len(pets)}")

        # Verify key characters
        firefly = catalog.get("firefly--lingxiaotian")
        self.assertIsNotNone(firefly)
        self.assertEqual(firefly.display_name, "流萤")
        self.assertTrue(firefly.spritesheet_path.exists())

        acheron = catalog.get("acheron--lingxiaotian")
        self.assertIsNotNone(acheron)
        self.assertEqual(acheron.display_name, "黄泉")

    def test_spritesheet_slicing(self):
        catalog = PetCatalog()
        firefly = catalog.get("firefly--lingxiaotian")
        sheet = SpriteSheet(firefly.spritesheet_path)

        # Check idle frames
        self.assertEqual(sheet.get_frame_count(PetAction.IDLE), 6)
        # Check waving frames
        self.assertEqual(sheet.get_frame_count(PetAction.WAVING), 4)
        # Check jumping frames
        self.assertEqual(sheet.get_frame_count(PetAction.JUMPING), 5)

        # Ensure pixmap is valid
        pixmap = sheet.get_frame(PetAction.IDLE, 0)
        self.assertIsNotNone(pixmap)
        self.assertFalse(pixmap.isNull())
        self.assertEqual(pixmap.width(), 192)
        self.assertEqual(pixmap.height(), 208)

    def test_sprite_player(self):
        catalog = PetCatalog()
        firefly = catalog.get("firefly--lingxiaotian")
        sheet = SpriteSheet(firefly.spritesheet_path)
        player = SpritePlayer(sheet)
        player.is_static_mode = False

        self.assertEqual(player.current_action, PetAction.IDLE)
        self.assertEqual(player.current_frame_index, 0)

        # Advance 300 ms (idle frame 0 is 280ms)
        changed = player.update(300)
        self.assertTrue(changed)
        self.assertEqual(player.current_frame_index, 1)


if __name__ == "__main__":
    unittest.main()

import os
import sys
import unittest


CURRENT_DIR = os.path.dirname(__file__)
SRC_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from main import health, list_cars, list_faq  # noqa: E402


class ProductServiceTests(unittest.TestCase):
    def test_health(self):
        response = health()
        self.assertEqual(response["status"], "ok")
        self.assertEqual(response["service"], "product-service")

    def test_list_cars(self):
        response = list_cars()
        self.assertIn("items", response)
        self.assertGreaterEqual(len(response["items"]), 8)
        self.assertIn("airport", response["items"][0])

    def test_list_faq(self):
        response = list_faq()
        self.assertIn("items", response)
        self.assertEqual(len(response["items"]), 10)
        self.assertIn("question", response["items"][0])


if __name__ == "__main__":
    unittest.main()

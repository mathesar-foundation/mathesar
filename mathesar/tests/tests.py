from django.test import TestCase

class SimpleTests(TestCase):
    def test_home_page(self):
        response = self.client.get('/')  # make a GET request to home page
        self.assertEqual(response.status_code, 200)  # check status is 200 OK
        self.assertContains(response, "Hello World!")  # check content

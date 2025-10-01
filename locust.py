from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 2)

    @task
    def slow_exp(self):
        response = self.client.get("/slow/")
        if response.status_code == 200:
            print(f"Request success: {response.json()}")

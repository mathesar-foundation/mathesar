import secrets


def generate_secretkey():
    secret_key = secrets.token_urlsafe()
    # TODO Add documentation link
    documentation_link = "<Add documentation link>"
    print(f"Please follow the instructions in {documentation_link} to add the below secret key to the application")
    print(f"Secret Key: {secret_key}")


if __name__ == "__main__":
    generate_secretkey()

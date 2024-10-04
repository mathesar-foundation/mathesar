from db.types.custom import email


def test_create_email_when_exists(engine):
    # This just checks that the function doesn't error if the type email
    # already exists when it's run.
    email.install(engine)
    email.install(engine)

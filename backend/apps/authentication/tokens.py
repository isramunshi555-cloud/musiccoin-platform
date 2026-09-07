from django.contrib.auth.tokens import PasswordResetTokenGenerator


class PasswordResetTokenGenerator(PasswordResetTokenGenerator):
    pass


password_reset_token = PasswordResetTokenGenerator()
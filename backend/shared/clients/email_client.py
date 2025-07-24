from django.core.mail import send_mail
from django.conf import settings

def send_basic_email(subject, message, recipient_list, from_email=None, html_message=None):
    """
    Send a basic email using Django's send_mail utility.
    :param subject: Email subject
    :param message: Plain text message
    :param recipient_list: List of recipient email addresses
    :param from_email: Sender email (optional, defaults to settings.DEFAULT_FROM_EMAIL)
    :param html_message: HTML message (optional)
    """
    send_mail(
        subject,
        message,
        from_email or settings.DEFAULT_FROM_EMAIL,
        recipient_list,
        fail_silently=False,
        html_message=html_message
    ) 
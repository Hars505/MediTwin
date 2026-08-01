import threading
from email.mime.base import MIMEBase
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

LOGO_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" width="120" height="64"><circle cx="40" cy="32" r="24" fill="none" stroke="#1E3A5F" stroke-width="6"/><circle cx="80" cy="32" r="24" fill="none" stroke="#3CB4A8" stroke-width="6"/><path d="M20 32 H30 L34 22 L40 44 L46 20 L52 40 L56 32 H68" fill="none" stroke="#1E3A5F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><g fill="#3CB4A8"><rect x="76" y="22" width="8" height="20" rx="1.5"/><rect x="70" y="28" width="20" height="8" rx="1.5"/></g></svg>'

def _send_email_thread(subject, body_plain, body_html, recipient_list):
    """Sends email in a background thread to avoid blocking the API response."""
    msg = EmailMultiAlternatives(
        subject=subject,
        body=body_plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
    )
    msg.attach_alternative(body_html, "text/html")
    
    # Attach SVG inline
    img = MIMEBase('image', 'svg+xml')
    img.set_payload(LOGO_SVG)
    img.add_header('Content-ID', '<logoImage>')
    img.add_header('Content-Disposition', 'inline')
    msg.attach(img)
    
    try:
        msg.send(fail_silently=True)
    except Exception as e:
        print(f"Error sending email: {e}")

def send_transactional_email(user, event_type, ip_address=None):
    """
    Constructs and dispatches an HTML email for login/registration events.
    """
    if not user.email:
        return
        
    if event_type == 'register':
        subject = "Welcome to Medi Twin!"
        title = "Welcome to Medi Twin!"
        message_html = f"Hi {user.username},<br><br>Thank you for signing up for Medi Twin! We are thrilled to have you here."
        message_plain = f"Hi {user.username},\n\nThank you for signing up for Medi Twin! We are thrilled to have you here."
    elif event_type == 'login':
        subject = "New Login to Medi Twin"
        title = "New Login Detected"
        ip_info = f" from IP address {ip_address}" if ip_address else ""
        message_html = f"Hi {user.username},<br><br>We detected a new login to your account{ip_info}. If this was you, you can safely ignore this email."
        message_plain = f"Hi {user.username},\n\nWe detected a new login to your account{ip_info}. If this was you, you can safely ignore this email."
    else:
        return

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }}
        .header {{ background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 1px solid #eeeeee; }}
        .header img {{ max-height: 64px; width: auto; }}
        .content {{ padding: 40px 30px; color: #333333; line-height: 1.6; }}
        .content h1 {{ color: #2c3e50; font-size: 24px; margin-top: 0; }}
        .footer {{ background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logoImage" alt="Medi Twin Logo" />
        </div>
        <div class="content">
          <h1>{title}</h1>
          <p>{message_html}</p>
          <p>At <strong>Medi Twin</strong>, we are committed to providing you with the best experience possible.</p>
          <p>Best regards,<br><strong>The Medi Twin Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Medi Twin. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    # Run in thread so the user doesn't wait for the SMTP connection to finish
    threading.Thread(target=_send_email_thread, args=(subject, message_plain, body_html, [user.email])).start()

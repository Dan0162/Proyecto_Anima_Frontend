import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from server.core.config import settings
import random
import string

def generate_verification_code() -> str:
    """Genera un código de 6 dígitos"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(recipient_email: str, code: str) -> bool:
    """
    Envía email con código de verificación
    
    Args:
        recipient_email: Email del destinatario
        code: Código de verificación de 6 dígitos
    
    Returns:
        True si se envió exitosamente, False en caso contrario
    """
    try:
        sender_email = settings.EMAIL_SENDER
        sender_password = settings.EMAIL_PASSWORD
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Recuperación de contraseña - Ánima'
        msg['From'] = f"Ánima <{sender_email}>"
        msg['To'] = recipient_email
        
        # HTML del email con la paleta de Ánima
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    background: linear-gradient(135deg, #C3C4FA 0%, #FFD0E7 100%);
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 48px;
                    margin-bottom: 10px;
                }}
                h1 {{
                    color: #1A1A1A;
                    font-size: 28px;
                    margin: 0 0 10px 0;
                }}
                .subtitle {{
                    color: #4a5568;
                    font-size: 16px;
                    margin: 0;
                }}
                .code-container {{
                    background: linear-gradient(135deg, rgba(195, 196, 250, 0.2) 0%, rgba(255, 208, 231, 0.2) 100%);
                    border: 2px solid rgba(195, 196, 250, 0.3);
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .code {{
                    font-size: 48px;
                    font-weight: 800;
                    color: #8B8CF5;
                    letter-spacing: 8px;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }}
                .info {{
                    color: #4a5568;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 20px 0;
                }}
                .warning {{
                    background: rgba(255, 208, 231, 0.2);
                    border-left: 4px solid #FF9EC7;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 6px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid rgba(195, 196, 250, 0.3);
                    color: #718096;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎵</div>
                    <h1>Recuperación de contraseña</h1>
                    <p class="subtitle">Ánima - Música que refleja cómo te sentís</p>
                </div>
                
                <p class="info">
                    Hola,<br><br>
                    Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de verificación:
                </p>
                
                <div class="code-container">
                    <div class="code">{code}</div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este código expira en 15 minutos y solo puede usarse una vez.
                </div>
                
                <p class="info">
                    Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                    Tu contraseña no cambiará a menos que ingreses el código de verificación.
                </p>
                
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas.</p>
                    <p>© 2025 Ánima - Todos los derechos reservados</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Versión texto plano como alternativa
        text = f"""
        Recuperación de contraseña - Ánima
        
        Hola,
        
        Recibimos una solicitud para restablecer tu contraseña.
        
        Tu código de verificación es: {code}
        
        Este código expira en 15 minutos y solo puede usarse una vez.
        
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        
        © 2025 Ánima
        """
        
        # Adjuntar ambas versiones
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Enviar email usando SMTP de Gmail
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        print(f"✅ Email enviado exitosamente a {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        return False
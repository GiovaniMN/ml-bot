import traceback
from src.logger import logger
from src.notificacao import notificar_vendedor

async def reportar_erro(erro: Exception, contexto: str = ""):
    mensagem = f"{contexto} — {type(erro).__name__}: {str(erro)}"
    logger.error(mensagem, extra={
        "contexto": contexto,
        "tipo_erro": type(erro).__name__,
        "detalhe": traceback.format_exc()
    })
    await alertar_erro_por_email(mensagem, traceback.format_exc())

async def alertar_erro_por_email(mensagem: str, detalhe: str):
    import aiosmtplib
    import os
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    remetente = os.getenv("EMAIL_REMETENTE")
    senha = os.getenv("EMAIL_SENHA")
    destinatario = os.getenv("EMAIL_VENDEDOR")

    if not all([remetente, senha, destinatario]):
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🚨 Jupiter_eletro Bot — Erro crítico detectado"
        msg["From"] = remetente
        msg["To"] = destinatario

        corpo_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e74c3c;">🚨 Erro crítico no Bot</h2>
            <p><b>Mensagem:</b> {mensagem}</p>
            <hr/>
            <pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;">{detalhe}</pre>
        </body>
        </html>
        """
        msg.attach(MIMEText(corpo_html, "html"))

        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=465,
            use_tls=True,
            username=remetente,
            password=senha,
        )
        print("🚨 Alerta de erro enviado por e-mail")
    except Exception as e:
        print(f"❌ Falha ao enviar alerta de erro: {e}")
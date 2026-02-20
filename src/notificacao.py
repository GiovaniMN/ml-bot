import aiosmtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

async def notificar_vendedor(buyer_id: str, conversa_id: str, texto_cliente: str):
    remetente = os.getenv("EMAIL_REMETENTE")
    senha = os.getenv("EMAIL_SENHA")
    destinatario = os.getenv("EMAIL_VENDEDOR")

    if not all([remetente, senha, destinatario]):
        print("⚠️ Configurações de e-mail não encontradas no .env")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔔 Jupiter_eletro — Cliente aguardando atendimento"
        msg["From"] = remetente
        msg["To"] = destinatario

        corpo_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #FFE600;">🤖 Jupiter_eletro Bot</h2>
            <p>Um cliente solicitou atendimento humano e está aguardando.</p>
            <hr/>
            <table>
                <tr><td><b>ID do comprador:</b></td><td>{buyer_id}</td></tr>
                <tr><td><b>ID da conversa:</b></td><td>{conversa_id}</td></tr>
                <tr><td><b>Última mensagem:</b></td><td>{texto_cliente}</td></tr>
            </table>
            <hr/>
            <p>Acesse o <a href="https://www.mercadolivre.com.br">Mercado Livre</a> para responder.</p>
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

        print(f"📧 Notificação enviada para {destinatario}")
        return True

    except Exception as e:
        print(f"❌ Erro ao enviar notificação: {e}")
        return False
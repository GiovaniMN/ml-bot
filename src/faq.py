FAQ = [
    {
        "perguntas": ["prazo", "entrega", "quando chega", "demora", "dias"],
        "resposta": "🚚 O prazo de entrega varia de 3 a 10 dias úteis dependendo da sua região. Você pode acompanhar pelo rastreamento no seu pedido."
    },
    {
        "perguntas": ["garantia", "defeito", "quebrou", "problema", "estragou"],
        "resposta": "🛡️ Todos os nossos produtos possuem garantia de fábrica. Em caso de defeito, entre em contato em até 90 dias para acionarmos a garantia."
    },
    {
        "perguntas": ["troca", "devolver", "devolução", "arrependimento"],
        "resposta": "🔄 Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor."
    },
    {
        "perguntas": ["nota fiscal", "nf", "nota", "fiscal"],
        "resposta": "🧾 A nota fiscal é enviada junto com o produto ou por e-mail em até 24h após a confirmação do pagamento."
    },
    {
        "perguntas": ["pagamento", "pagar", "boleto", "pix", "cartão"],
        "resposta": "💳 Aceitamos todas as formas de pagamento disponíveis no Mercado Livre: cartão de crédito, boleto, Pix e Mercado Pago."
    },
    {
        "perguntas": ["voltagem", "bivolt", "110", "220", "tensão"],
        "resposta": "⚡ A voltagem do produto está especificada no anúncio. A maioria dos nossos produtos é bivolt (110/220V)."
    },
]

def buscar_faq(mensagem: str):
    mensagem = mensagem.lower()
    for item in FAQ:
        if any(palavra in mensagem for palavra in item["perguntas"]):
            return item["resposta"]
    return None

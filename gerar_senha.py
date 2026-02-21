import bcrypt

senha = input("Digite a senha do painel: ")
hash_senha = bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()
print(f"\nColoque isso no .env:")
print(f"PAINEL_SENHA_HASH={hash_senha}")
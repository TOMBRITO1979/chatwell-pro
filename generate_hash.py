import bcrypt
import sys
import os

# Obter credenciais de argumentos ou variáveis de ambiente
username = sys.argv[1] if len(sys.argv) > 1 else os.getenv('SUPER_ADMIN_USERNAME', 'admin')
password = sys.argv[2] if len(sys.argv) > 2 else os.getenv('SUPER_ADMIN_PASSWORD')

if not password:
    print('❌ Erro: Senha não fornecida!')
    print('\nUso:')
    print('  python generate_hash.py [username] [password]')
    print('  Ou defina: export SUPER_ADMIN_PASSWORD="sua_senha"')
    sys.exit(1)

# Gerar hash
password_bytes = password.encode('utf-8')
salt = bcrypt.gensalt(rounds=10)
hash_bytes = bcrypt.hashpw(password_bytes, salt)
hash_str = hash_bytes.decode('utf-8')

print('\n==============================================')
print('HASH GERADO COM SUCESSO!')
print('==============================================')
print(f'Usuário: {username}')
print(f'Senha: {password}')
print(f'Hash: {hash_str}')
print('\n==============================================')
print('EXECUTE NO CONTAINER DO POSTGRESQL:')
print('==============================================\n')
print('psql -U chatwell -d chatwell\n')
print('-- Depois execute:\n')
print(f"UPDATE super_admins")
print(f"SET username = '{username}',")
print(f"    password_hash = '{hash_str}',")
print(f"    updated_at = NOW()")
print(f"WHERE username = 'admin';")
print('\n==============================================\n')

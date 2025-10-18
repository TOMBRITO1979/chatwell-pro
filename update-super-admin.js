const bcrypt = require('bcryptjs');

// Obter credenciais de argumentos ou variáveis de ambiente
const username = process.argv[2] || process.env.SUPER_ADMIN_USERNAME || 'admin';
const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD;

if (!password) {
  console.error('❌ Erro: Senha não fornecida!');
  console.log('\nUso:');
  console.log('  node update-super-admin.js [username] [password]');
  console.log('  Ou defina: export SUPER_ADMIN_PASSWORD="sua_senha"');
  process.exit(1);
}

console.log('\n==============================================');
console.log('GERANDO HASH PARA SUPER ADMIN');
console.log('==============================================');
console.log('Usuário:', username);
console.log('Senha:', password);
console.log('\nGerando hash...\n');

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  }

  console.log('==============================================');
  console.log('HASH GERADO COM SUCESSO!');
  console.log('==============================================');
  console.log('Hash:', hash);
  console.log('\n==============================================');
  console.log('EXECUTE ESTE SQL NO CONTAINER DO POSTGRESQL:');
  console.log('==============================================\n');
  console.log('psql -U chatwell -d chatwell\n');
  console.log('-- Depois execute:\n');
  console.log(`UPDATE super_admins`);
  console.log(`SET username = '${username}',`);
  console.log(`    password_hash = '${hash}',`);
  console.log(`    updated_at = NOW()`);
  console.log(`WHERE username = 'admin';`);
  console.log('\n==============================================');
  console.log('NOVA CREDENCIAL:');
  console.log('==============================================');
  console.log('Usuário:', username);
  console.log('Senha:', password);
  console.log('==============================================\n');

  process.exit(0);
});

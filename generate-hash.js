const bcrypt = require('bcryptjs');

// Obter senha de argumentos ou variável de ambiente
const password = process.argv[2] || process.env.SUPER_ADMIN_PASSWORD;

if (!password) {
  console.error('❌ Erro: Senha não fornecida!');
  console.log('\nUso:');
  console.log('  node generate-hash.js [senha]');
  console.log('  Ou defina: export SUPER_ADMIN_PASSWORD="sua_senha"');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro:', err);
    process.exit(1);
  }

  console.log('\n==============================================');
  console.log('HASH GERADO COM SUCESSO!');
  console.log('==============================================');
  console.log('Senha:', password);
  console.log('Hash:', hash);
  console.log('\nExecute este SQL no PostgreSQL:');
  console.log('==============================================\n');
  console.log(`UPDATE super_admins`);
  console.log(`SET password_hash = '${hash}'`);
  console.log(`WHERE username = 'admin';`);
  console.log('\n==============================================\n');

  process.exit(0);
});

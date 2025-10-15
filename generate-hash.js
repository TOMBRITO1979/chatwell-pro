const bcrypt = require('bcryptjs');

const password = 'Admin@2025';

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

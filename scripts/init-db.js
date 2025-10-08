const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Testa conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao banco de dados!');

    // Lê o schema SQL
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Executando schema do banco de dados...');
    
    // Executa o schema
    await pool.query(schema);
    
    console.log('✅ Schema do banco de dados criado com sucesso!');
    console.log('📊 Tabelas criadas:');
    console.log('   - users');
    console.log('   - clients');
    console.log('   - projects');
    console.log('   - tasks');
    console.log('   - accounts');
    console.log('   - expenses_business');
    console.log('   - expenses_personal');
    console.log('   - purchases');
    console.log('   - events');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };

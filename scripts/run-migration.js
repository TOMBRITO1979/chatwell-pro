const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatwell'
});

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Uso: node run-migration.js <arquivo-migration.sql>');
    process.exit(1);
  }

  try {
    console.log(`\n🔄 Executando migration: ${path.basename(migrationFile)}\n`);

    const sql = fs.readFileSync(migrationFile, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration executada com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

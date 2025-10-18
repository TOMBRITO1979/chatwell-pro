# Importar e Exportar Clientes (CSV)

## Exportar Clientes

A funcionalidade de exportação permite baixar todos os seus clientes em formato CSV.

### Como usar:

1. Acesse a página **Clientes**
2. Clique no botão **"Exportar CSV"** (ícone de download verde)
3. O arquivo será baixado automaticamente com o nome `clientes_YYYY-MM-DD.csv`

### Formato do arquivo exportado:

O arquivo CSV conterá as seguintes colunas:
- Nome
- Email
- Telefone
- WhatsApp
- CPF/CNPJ
- Endereço
- Cidade
- Estado
- CEP
- Observações
- Status (active/inactive)

---

## Importar Clientes

A funcionalidade de importação permite adicionar vários clientes de uma vez usando um arquivo CSV.

### Como usar:

1. Acesse a página **Clientes**
2. Clique no botão **"Importar CSV"** (ícone de upload azul)
3. Selecione o arquivo CSV no seu computador
4. Aguarde a importação ser processada
5. Uma mensagem mostrará quantos clientes foram importados e quantos erros ocorreram (se houver)

### Formato do arquivo para importação:

O arquivo CSV deve seguir **exatamente** este formato:

```csv
Nome,Email,Telefone,WhatsApp,CPF/CNPJ,Endereço,Cidade,Estado,CEP,Observações,Status
João Silva,joao@example.com,11987654321,11987654321,123.456.789-00,Rua das Flores 123,São Paulo,SP,01234-567,Cliente VIP,active
Maria Santos,maria@example.com,11976543210,11976543210,987.654.321-00,Av. Paulista 1000,São Paulo,SP,01310-100,Preferencial,active
```

### Regras importantes:

1. **Cabeçalho obrigatório**: A primeira linha DEVE conter os nomes das colunas
2. **Nome obrigatório**: O campo "Nome" é obrigatório para cada cliente
3. **Email válido**: Se informado, o email deve ter formato válido (exemplo@dominio.com)
4. **Status**: Use "active" para clientes ativos ou "inactive" para inativos (padrão: active)
5. **Campos vazios**: Campos opcionais podem ficar vazios
6. **Vírgulas e aspas**: Se um valor contiver vírgula ou aspas, deve ser envolvido em aspas duplas

### Exemplo de arquivo:

Um arquivo de exemplo está disponível em: `/exemplo-importacao-clientes.csv`

Você pode baixá-lo, editá-lo com seus dados e importá-lo.

### Tratamento de erros:

- Se uma linha tiver erro, ela será ignorada e as outras continuarão sendo importadas
- Ao final, você verá um resumo com:
  - Total de linhas processadas
  - Quantidade de clientes importados com sucesso
  - Quantidade de erros
- Erros comuns:
  - Nome vazio ou ausente
  - Email inválido
  - Formato CSV incorreto

### Dicas:

- Use Excel, Google Sheets ou LibreOffice Calc para editar os arquivos CSV
- Ao salvar, escolha o formato **CSV (separado por vírgulas)**
- Teste primeiro com poucos registros antes de importar muitos clientes
- Faça backup exportando seus clientes antes de fazer uma importação grande

---

## Exemplo Prático

### 1. Exportar clientes existentes:
- Clique em "Exportar CSV"
- Arquivo baixado: `clientes_2025-10-13.csv`

### 2. Editar o arquivo:
- Abra no Excel/Google Sheets
- Adicione novos clientes ou edite os existentes
- Salve como CSV

### 3. Importar de volta:
- Clique em "Importar CSV"
- Selecione o arquivo editado
- Aguarde confirmação

**Pronto!** Seus clientes foram importados.

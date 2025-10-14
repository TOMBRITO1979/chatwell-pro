# 📧 Configuração de Email para Recuperação de Senha

## Problema
Se você não está recebendo emails de recuperação de senha, é porque as configurações SMTP não estão configuradas no arquivo `.env`.

## Solução Rápida

### Opção 1: Gmail (Mais Fácil)

1. **Crie uma Senha de App do Gmail**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Faça login na sua conta Gmail
   - Clique em "Criar" e dê um nome (ex: "Chatwell Pro")
   - Copie a senha gerada (16 caracteres)

2. **Configure o arquivo `.env`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASS=senha-app-de-16-caracteres
   ```

3. **Reinicie a aplicação**:
   ```bash
   docker compose -f docker-compose.local.yml down
   docker compose -f docker-compose.local.yml up -d
   ```

### Opção 2: Outros Provedores SMTP

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

#### Mailtrap (Para Testes)
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=seu-usuario-mailtrap
EMAIL_PASS=sua-senha-mailtrap
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=sua-api-key-sendgrid
```

## Verificar se Está Funcionando

1. **Verifique os logs da aplicação**:
   ```bash
   docker logs chatwell_pro-chatwell-1 --tail 50
   ```

2. **Procure por**:
   - ✅ `Email enviado com sucesso` - Funcionando
   - ⚠️ `Configurações SMTP padrão não encontradas` - Não configurado
   - ❌ `Erro ao enviar email` - Configuração incorreta

3. **Teste a recuperação de senha**:
   - Acesse: http://localhost:3000/auth/reset-password
   - Digite um email cadastrado
   - Verifique sua caixa de entrada e spam

## Troubleshooting

### "Configurações SMTP não encontradas"
- Verifique se o arquivo `.env` existe
- Confirme que as variáveis EMAIL_* estão preenchidas
- Reinicie os containers após editar o .env

### "Erro ao autenticar no SMTP"
- **Gmail**: Use Senha de App, não a senha normal
- Verifique se 2FA está ativado (necessário para Senha de App)
- Confirme que EMAIL_USER e EMAIL_PASS estão corretos

### "Erro de conexão SMTP"
- Verifique se EMAIL_HOST e EMAIL_PORT estão corretos
- Confirme que sua rede permite conexões SMTP (porta 587)
- Alguns firewalls bloqueiam porta 587, tente porta 465

### Email vai para Spam
- Configure SPF, DKIM e DMARC no seu domínio
- Use um domínio próprio ao invés de Gmail
- Considere usar um serviço profissional (SendGrid, Amazon SES)

## Configuração Avançada

Se quiser usar nomes de variáveis diferentes, você pode usar:

```env
DEFAULT_SMTP_HOST=smtp.gmail.com
DEFAULT_SMTP_PORT=587
DEFAULT_SMTP_USER=seu-email@gmail.com
DEFAULT_SMTP_PASS=sua-senha
DEFAULT_FROM_EMAIL=noreply@seudominio.com
DEFAULT_FROM_NAME=Chatwell Pro
DEFAULT_SMTP_SECURE=false
```

## Modo Desenvolvimento

Se você não conseguir configurar SMTP agora, a aplicação retorna o link de reset no response da API. Você pode copiá-lo dos logs ou da resposta da requisição.

Para ver o link no console:
```bash
docker logs chatwell_pro-chatwell-1 -f
```

Procure por uma linha com `resetUrl` quando solicitar a recuperação de senha.

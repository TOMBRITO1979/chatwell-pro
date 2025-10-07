# 🚀 Chatwell Pro - Quick Start Guide

## Para GitHub

```bash
# 1. Execute o script de setup do GitHub
./setup-github.sh

# 2. Siga as instruções interativas
```

## Para Deploy Imediato

### 1️⃣ Configurar Secrets

```bash
# Execute o script interativo para criar secrets Docker
./deployment/scripts/create-secrets.sh
```

### 2️⃣ Deploy da Stack

```bash
# Deploy completo com Docker Swarm
./deployment/scripts/deploy.sh --email admin@chatwell.pro
```

### 3️⃣ Verificar Deploy

```bash
# Verificar status dos serviços
docker stack services chatwell

# Testar endpoints
curl https://status.chatwell.pro/api/status
```

## 📋 URLs Configuradas

| Serviço | URL | Função |
|---------|-----|--------|
| **Main App** | https://app.chatwell.pro | Interface principal |
| **API** | https://api.chatwell.pro | REST API pública |
| **Auth** | https://auth.chatwell.pro | OAuth callbacks |
| **Webhooks** | https://hooks.chatwell.pro | WAHA/outros webhooks |
| **Status** | https://status.chatwell.pro | Monitoramento |
| **Docs** | https://docs.chatwell.pro | API documentation |
| **CDN** | https://cdn.chatwell.pro | Arquivos estáticos |

## 🔧 Configuração DNS

Configure os registros DNS para apontar para seu servidor:

```dns
app.chatwell.pro     A     SEU_IP_SERVIDOR
api.chatwell.pro     A     SEU_IP_SERVIDOR
auth.chatwell.pro    A     SEU_IP_SERVIDOR
hooks.chatwell.pro   A     SEU_IP_SERVIDOR
status.chatwell.pro  A     SEU_IP_SERVIDOR
docs.chatwell.pro    A     SEU_IP_SERVIDOR
cdn.chatwell.pro     A     SEU_IP_SERVIDOR
```

**Ou use um wildcard:**
```dns
*.chatwell.pro       A     SEU_IP_SERVIDOR
```

## 🐳 Deploy no Portainer

1. **Acesse seu Portainer**
2. **Vá para Stacks → Add Stack**
3. **Cole o conteúdo de** `deployment/swarm/chatwell-stack.yml`
4. **Configure as variáveis de ambiente**
5. **Deploy!**

## ⚡ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Acessar: http://localhost:3000
```

## 📞 Suporte

- **Documentação completa**: [README.md](./README.md)
- **Guia de deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues

---

## ✅ Checklist de Deploy

- [ ] DNS configurado para *.chatwell.pro
- [ ] Docker Swarm inicializado
- [ ] Secrets criados (`./deployment/scripts/create-secrets.sh`)
- [ ] Stack deployada (`./deployment/scripts/deploy.sh`)
- [ ] Health checks passando (https://status.chatwell.pro)
- [ ] SSL certificados funcionando
- [ ] Aplicação acessível (https://app.chatwell.pro)

**🎉 Chatwell Pro está pronto para produção!**
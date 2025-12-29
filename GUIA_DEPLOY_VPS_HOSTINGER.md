# Guia Completo de Deploy do Monitor de Comandas em VPS Hostinger

Este guia detalhado vai te ajudar a fazer o deploy do Monitor de Comandas em uma VPS da Hostinger, desde a configuração inicial do Git até a configuração do Nginx e domínio personalizado.

## Índice

1. [Requisitos Iniciais](#requisitos-iniciais)
2. [Acesso à VPS](#acesso-à-vps)
3. [Configuração Inicial da VPS](#configuração-inicial-da-vps)
4. [Configuração do Git e Clone do Repositório](#configuração-do-git-e-clone-do-repositório)
5. [Instalação do Docker e Docker Compose](#instalação-do-docker-e-docker-compose)
6. [Deploy da Aplicação com Docker](#deploy-da-aplicação-com-docker)
7. [Configuração do Nginx como Proxy Reverso](#configuração-do-nginx-como-proxy-reverso)
8. [Configuração de Domínio](#configuração-de-domínio)
9. [Configuração de SSL com Certbot](#configuração-de-ssl-com-certbot)
10. [Manutenção e Atualização](#manutenção-e-atualização)
11. [Solução de Problemas](#solução-de-problemas)

## Requisitos Iniciais

- Uma VPS ativa na Hostinger (recomendado: plano com pelo menos 2GB de RAM)
- Um domínio registrado (opcional, mas recomendado para produção)
- Acesso SSH à sua VPS
- Conhecimentos básicos de linha de comando Linux

## Acesso à VPS

1. **Obtenha as credenciais de acesso SSH** no painel de controle da Hostinger:
   - Endereço IP da VPS
   - Nome de usuário (geralmente `root`)
   - Senha inicial ou arquivo de chave SSH

2. **Conecte-se à VPS** via SSH:
   ```bash
   ssh root@seu_ip_da_vps
   ```
   
   Se estiver usando um arquivo de chave:
   ```bash
   ssh -i caminho/para/sua/chave.pem root@seu_ip_da_vps
   ```

## Configuração Inicial da VPS

1. **Atualize o sistema**:
   ```bash
   apt update && apt upgrade -y
   ```

2. **Configure o fuso horário**:
   ```bash
   timedatectl set-timezone America/Sao_Paulo
   ```

3. **Instale ferramentas básicas**:
   ```bash
   apt install -y curl wget vim htop git unzip
   ```

4. **Crie um usuário não-root** (mais seguro que usar root):
   ```bash
   adduser seunome
   ```
   
   Adicione o usuário ao grupo sudo:
   ```bash
   usermod -aG sudo seunome
   ```
   
   Configure o acesso SSH para o novo usuário:
   ```bash
   mkdir -p /home/seunome/.ssh
   cp ~/.ssh/authorized_keys /home/seunome/.ssh/ 2>/dev/null || echo "Sem chaves para copiar"
   chown -R seunome:seunome /home/seunome/.ssh
   chmod 700 /home/seunome/.ssh
   chmod 600 /home/seunome/.ssh/authorized_keys 2>/dev/null
   ```

5. **Configure o firewall UFW**:
   ```bash
   apt install -y ufw
   ufw allow ssh
   ufw allow http
   ufw allow https
   ufw enable
   ```

## Configuração do Git e Clone do Repositório

1. **Configure o Git** (se você for usar um repositório Git):
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

2. **Crie uma pasta para a aplicação**:
   ```bash
   mkdir -p /var/www/monitor-comandas
   chown -R seunome:seunome /var/www/monitor-comandas
   ```

3. **Clone o repositório** (se estiver usando Git):
   ```bash
   # Mude para o usuário não-root
   su - seunome
   
   # Clone o repositório
   cd /var/www/monitor-comandas
   git clone https://github.com/seu-usuario/monitor-comandas.git .
   ```
   
   **OU faça upload dos arquivos** (se não estiver usando Git):
   
   No seu computador local:
   ```bash
   scp -r ./monitor-comandas-docker.zip seunome@seu_ip_da_vps:/var/www/monitor-comandas/
   ```
   
   Na VPS:
   ```bash
   cd /var/www/monitor-comandas
   unzip monitor-comandas-docker.zip
   mv monitor-comandas/* .
   rm -rf monitor-comandas monitor-comandas-docker.zip
   ```

## Instalação do Docker e Docker Compose

1. **Instale o Docker**:
   ```bash
   # Volte para o usuário root se necessário
   exit  # Se estiver como seunome
   
   # Instale dependências
   apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg
   
   # Adicione a chave GPG oficial do Docker
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
   
   # Adicione o repositório do Docker
   add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   
   # Atualize e instale o Docker
   apt update
   apt install -y docker-ce docker-ce-cli containerd.io
   
   # Verifique se o Docker está funcionando
   systemctl status docker
   ```

2. **Instale o Docker Compose**:
   ```bash
   # Instale o Docker Compose
   curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   
   # Torne-o executável
   chmod +x /usr/local/bin/docker-compose
   
   # Verifique a instalação
   docker-compose --version
   ```

3. **Adicione seu usuário ao grupo docker** (para executar Docker sem sudo):
   ```bash
   usermod -aG docker seunome
   ```

## Deploy da Aplicação com Docker

1. **Configure o arquivo .env**:
   ```bash
   # Mude para o usuário não-root
   su - seunome
   
   # Edite o arquivo .env
   cd /var/www/monitor-comandas
   cp .env.example .env  # Se existir um arquivo de exemplo
   nano .env
   ```
   
   Conteúdo recomendado para o arquivo `.env`:
   ```
   PORT=3000
   NODE_ENV=production
   API_KEY=sua_chave_api_segura_aqui  # Gere uma chave segura
   ```

2. **Ajuste o docker-compose.yml** se necessário:
   ```bash
   nano docker-compose.yml
   ```
   
   Verifique se o arquivo está configurado corretamente para produção.

3. **Construa e inicie os containers**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verifique se os containers estão rodando**:
   ```bash
   docker-compose ps
   ```

5. **Verifique os logs**:
   ```bash
   docker-compose logs -f
   ```

## Configuração do Nginx como Proxy Reverso

1. **Instale o Nginx**:
   ```bash
   # Volte para o usuário root
   exit  # Se estiver como seunome
   
   # Instale o Nginx
   apt install -y nginx
   
   # Inicie e habilite o Nginx
   systemctl start nginx
   systemctl enable nginx
   ```

2. **Configure o Nginx como proxy reverso**:
   ```bash
   # Crie um arquivo de configuração para o site
   nano /etc/nginx/sites-available/monitor-comandas
   ```
   
   Adicione o seguinte conteúdo:
   ```nginx
   server {
       listen 80;
       server_name seu_dominio.com www.seu_dominio.com;  # Substitua pelo seu domínio ou use o IP da VPS
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Ative a configuração**:
   ```bash
   # Crie um link simbólico
   ln -s /etc/nginx/sites-available/monitor-comandas /etc/nginx/sites-enabled/
   
   # Teste a configuração
   nginx -t
   
   # Reinicie o Nginx
   systemctl restart nginx
   ```

## Configuração de Domínio

1. **Acesse o painel de controle do seu provedor de domínio** (pode ser a própria Hostinger ou outro).

2. **Configure os registros DNS**:
   - Adicione um registro A apontando para o IP da sua VPS:
     - Tipo: A
     - Nome: @ (ou subdomínio, ex: monitor)
     - Valor: IP_DA_SUA_VPS
     - TTL: 3600 (ou o padrão)
   
   - Se quiser usar www, adicione outro registro:
     - Tipo: A (ou CNAME)
     - Nome: www
     - Valor: IP_DA_SUA_VPS (ou seu_dominio.com se for CNAME)
     - TTL: 3600 (ou o padrão)

3. **Aguarde a propagação DNS** (pode levar até 24 horas, mas geralmente é mais rápido).

## Configuração de SSL com Certbot

1. **Instale o Certbot**:
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. **Obtenha o certificado SSL**:
   ```bash
   certbot --nginx -d seu_dominio.com -d www.seu_dominio.com
   ```
   
   Siga as instruções na tela para completar o processo.

3. **Verifique a renovação automática**:
   ```bash
   certbot renew --dry-run
   ```

## Manutenção e Atualização

### Para atualizar a aplicação:

1. **Acesse a pasta do projeto**:
   ```bash
   su - seunome
   cd /var/www/monitor-comandas
   ```

2. **Se estiver usando Git**:
   ```bash
   git pull origin main  # ou master, dependendo da branch
   ```
   
   **OU se fez upload manual**, faça o upload dos novos arquivos e substitua os antigos.

3. **Reconstrua e reinicie os containers**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Para verificar o status:

```bash
# Verifique os containers
docker-compose ps

# Verifique os logs
docker-compose logs -f

# Verifique o status do Nginx
systemctl status nginx
```

## Solução de Problemas

### Se a aplicação não estiver acessível:

1. **Verifique se os containers estão rodando**:
   ```bash
   docker-compose ps
   ```

2. **Verifique os logs da aplicação**:
   ```bash
   docker-compose logs -f
   ```

3. **Verifique o status do Nginx**:
   ```bash
   systemctl status nginx
   nginx -t
   ```

4. **Verifique o firewall**:
   ```bash
   ufw status
   ```

5. **Verifique a conectividade**:
   ```bash
   curl -I http://localhost:3000
   ```

### Se o SSL não estiver funcionando:

```bash
certbot --nginx --debug
```

### Para reiniciar todos os serviços:

```bash
# Reinicie os containers
docker-compose restart

# Reinicie o Nginx
systemctl restart nginx
```

---

## Conclusão

Parabéns! Você agora tem o Monitor de Comandas rodando em sua VPS da Hostinger, com HTTPS e um domínio personalizado. Se encontrar algum problema durante o processo, consulte a seção de solução de problemas ou entre em contato com o suporte da Hostinger.

Lembre-se de fazer backups regulares e manter seu sistema atualizado para garantir segurança e desempenho.

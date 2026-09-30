# Publicação na Azure

Passo a passo para publicar a aplicação nos serviços do [desenho de solução](desenho-solucao.md):
API no App Service, frontend no Static Web Apps e banco no Azure SQL Database, com deploy pelo GitHub Actions.

## Pré-requisitos

- Conta na Azure com assinatura ativa.
- Este código em um repositório no GitHub.
- Na sua máquina: SDK .NET 8, `dotnet tool restore` executado em `backend/` e a API local parada
  (o comando de migrations compila o projeto e falha se os arquivos estiverem em uso).

Nomes usados neste guia. Troque `<sufixo>` por algo único, como suas iniciais e um número:

| Recurso | Nome | Região |
| --- | --- | --- |
| Grupo de recursos | `rg-insuranceclaims` | Brazil South |
| Servidor SQL | `sql-insuranceclaims-<sufixo>` | Brazil South |
| Banco de dados | `InsuranceClaimsDb` | |
| App Service (API) | `app-insuranceclaims-api-<sufixo>` | Brazil South |
| Static Web App (frontend) | `swa-insuranceclaims-<sufixo>` | a que o portal oferecer |

A ordem dos passos importa: o banco precisa existir e estar migrado antes da primeira subida da API,
porque a API consulta a tabela de usuários ao iniciar.

**Como ficou neste projeto.** A assinatura não tinha cota para o plano gratuito F1 do App Service em
Brazil South, então API e banco foram criados em **West US 3**, na mesma região, para as consultas ao
banco não cruzarem continentes. A oferta gratuita do Azure SQL falhou na recriação e o banco ficou no tier
**Básico** (5 DTU, cerca de 5 USD/mês). O App Service está no F1 gratuito, o Static Web Apps no plano
Free e o Application Insights ligado. O Key Vault (passo 10) não foi feito; os segredos estão em App Settings.

## 1. Azure SQL Database

No portal, **Criar um recurso** > **SQL Database** > **Criar**.

Aba **Básico**:

- Grupo de recursos: **Criar novo** > `rg-insuranceclaims`.
- Nome do banco: `InsuranceClaimsDb`.
- Servidor: **Criar novo**: nome `sql-insuranceclaims-<sufixo>`, local Brazil South,
  método de autenticação **Usar autenticação do SQL**, login `sqladmin` e uma senha forte. Guarde a senha.
- Pool elástico: Não. Ambiente de carga de trabalho: Desenvolvimento.
- Computação + armazenamento: se aparecer a **oferta gratuita** ("Apply offer"), aplique.
  Se não aparecer, **Configurar banco de dados** > **Básico** (5 DTU).
- Redundância de backup: com redundância local.

Aba **Rede**:

- Método de conectividade: **Ponto de extremidade público**.
- **Permitir que serviços e recursos do Azure acessem este servidor**: Sim.
- **Adicionar endereço IP do cliente atual**: Sim.

**Revisar + criar**. Depois de criado, abra o banco > **Cadeias de conexão** > **ADO.NET (autenticação SQL)** e copie.
O formato é:

```
Server=tcp:sql-insuranceclaims-<sufixo>.database.windows.net,1433;Initial Catalog=InsuranceClaimsDb;User ID=sqladmin;Password=<senha>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

## 2. Migrations no Azure SQL

No PowerShell, na pasta `backend`, com a API local parada:

```powershell
$env:ConnectionStrings__InsuranceClaims = '<cadeia de conexão do passo 1, com a senha>'
$env:Jwt__SecretKey = 'qualquer-valor-com-pelo-menos-32-caracteres-para-o-comando'
dotnet ef database update --project InsuranceClaims.Infrastructure --startup-project InsuranceClaims.Api
Remove-Item Env:ConnectionStrings__InsuranceClaims
```

O comando cria as tabelas e os tipos de sinistro iniciais. Se falhar por firewall, confira o IP liberado no passo 1
(o portal mostra seu IP atual em **Rede** do servidor SQL).

## 3. App Service (API)

**Criar um recurso** > **Aplicativo Web** > **Criar**.

Aba **Básico**:

- Grupo de recursos: `rg-insuranceclaims`.
- Nome: `app-insuranceclaims-api-<sufixo>`. Anote a URL mostrada abaixo do nome
  (`https://app-insuranceclaims-api-<sufixo>.azurewebsites.net`, possivelmente com um sufixo de região).
- Publicar: **Código**. Pilha de runtime: **.NET 8 (LTS)**. Sistema operacional: **Linux**. Região: Brazil South.
- Plano: **Criar novo**, tipo de preço **Gratuito F1**.

Aba **Implantação**: implantação contínua **Desabilitada** (o deploy é feito pelo workflow do repositório).
Se houver a opção **Autenticação básica**, deixe **Habilitada**: ela é necessária para o perfil de publicação.

Aba **Monitoramento**: **Habilitar Application Insights: Sim**. Isso cria o recurso e liga a telemetria sem código.

**Revisar + criar**. Depois de criado, abra o App Service:

1. **Configurações** > **Variáveis de ambiente** (ou **Configuração** > **Configurações do aplicativo**), adicione:

   | Nome | Valor |
   | --- | --- |
   | `ConnectionStrings__InsuranceClaims` | cadeia de conexão do passo 1, com a senha |
   | `Jwt__SecretKey` | chave nova com 48 caracteres (gere com o comando abaixo) |
   | `Swagger__Enabled` | `true` |
   | `AuthSeed__Name` | nome do usuário inicial |
   | `AuthSeed__Email` | e-mail do usuário inicial |
   | `AuthSeed__Password` | senha do usuário inicial, diferente de qualquer exemplo publicado |

   `Cors__AllowedOrigins__0` entra no passo 5, quando a URL do frontend existir. Clique em **Aplicar**/**Salvar**.

   Para gerar a chave JWT no PowerShell:

   ```powershell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
   ```

2. **Visão geral** > **Baixar perfil de publicação**. Guarde o arquivo `.PublishSettings`; o conteúdo dele vira um
   segredo no GitHub. Se o botão estiver desabilitado, ative **Configuração** > **Configurações gerais** >
   **Credenciais de publicação de autenticação básica do SCM** e tente de novo.

## 4. Static Web Apps (frontend)

**Criar um recurso** > **Aplicativo Web Estático** > **Criar**.

- Grupo de recursos: `rg-insuranceclaims`. Nome: `swa-insuranceclaims-<sufixo>`. Plano: **Gratuito**.
- Região: qualquer uma oferecida; o conteúdo é distribuído globalmente.
- Detalhes da implantação, origem: **Outro**. Assim a Azure não cria um workflow próprio; o do repositório é usado.

**Revisar + criar**. Depois de criado, na **Visão geral**:

1. Anote a URL (`https://<nome-gerado>.azurestaticapps.net`).
2. **Gerenciar token de implantação** > copie o token. Ele vira um segredo no GitHub.

## 5. CORS da API

Volte ao App Service > **Variáveis de ambiente** e adicione `Cors__AllowedOrigins__0` com a URL do
Static Web Apps, com `https://` e **sem barra no final**. Salve.

## 6. Segredos e variáveis no GitHub

No repositório: **Settings** > **Secrets and variables** > **Actions**.

Aba **Secrets** > **New repository secret**:

| Nome | Valor |
| --- | --- |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | conteúdo completo do arquivo `.PublishSettings` do passo 3 |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | token de implantação do passo 4 |

Aba **Variables** > **New repository variable**:

| Nome | Valor |
| --- | --- |
| `AZURE_WEBAPP_NAME` | `app-insuranceclaims-api-<sufixo>` |
| `VITE_API_BASE_URL` | URL da API, com `https://` e sem barra no final |

Enquanto essas variáveis não existem, os workflows só fazem build; o passo de deploy é pulado.

## 7. Primeiro deploy

**Actions** > **API - build e deploy** > **Run workflow**. Aguarde ficar verde.
Depois **Frontend - build e deploy** > **Run workflow**.

A partir daí, cada push em `main` que altere `backend/` ou `frontend/` publica de novo.

## 8. Verificação

1. `https://<api>/health` responde `Healthy`.
2. `https://<api>/swagger` abre a documentação.
3. A URL do Static Web Apps abre a tela de login; entre com o usuário do `AuthSeed__*`, cadastre um sinistro,
   edite, exclua e veja o dashboard.
4. Opcional, da sua máquina, com a pasta `backend`:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/SmokeTest.ps1 -BaseUrl https://<api> -Email <e-mail> -Password <senha>
   ```

   Os registros `SMOKE-*` criados ficam no banco marcados como excluídos (soft delete).

Se o frontend mostrar "Não foi possível conectar à API": confira `VITE_API_BASE_URL` (o front precisa ser
publicado de novo depois de alterar) e `Cors__AllowedOrigins__0` (origem exata, com `https://`, sem barra).
Se a API não subir: **App Service** > **Fluxo de log**. As causas comuns são cadeia de conexão errada, firewall
do SQL, migrations não aplicadas ou `Jwt__SecretKey` com menos de 32 caracteres.

## 9. Depois do primeiro acesso

Remova `AuthSeed__Name`, `AuthSeed__Email` e `AuthSeed__Password` das variáveis do App Service. O usuário já
existe no banco, só com o hash da senha, e o seed não é mais necessário.

## 10. Key Vault (opcional)

Tira a chave JWT e a cadeia de conexão das variáveis do App Service e as coloca em um cofre, lido por identidade
gerenciada.

1. **Criar um recurso** > **Cofre de chaves**: nome `kv-insuranceclaims-<sufixo>`, grupo `rg-insuranceclaims`,
   Brazil South, tipo Standard, modelo de permissão **Controle de acesso baseado em função do Azure**.
2. No cofre, **Controle de acesso (IAM)** > **Adicionar atribuição de função** > **Key Vault Secrets Officer**
   > para o seu próprio usuário. Sem isso, nem o dono da assinatura cria segredos.
3. **Segredos** > **Gerar/Importar**: crie `Jwt--SecretKey` e `ConnectionStrings--InsuranceClaims` com os valores
   atuais das variáveis do App Service.
4. No App Service, **Identidade** > **Atribuída pelo sistema** > **Status: Ativado** > Salvar.
5. De volta ao cofre, **IAM** > **Adicionar atribuição de função** > **Key Vault Secrets User** > **Identidade
   gerenciada** > selecione o App Service.
6. No App Service, troque o **valor** das duas variáveis por referências:

   ```
   @Microsoft.KeyVault(VaultName=kv-insuranceclaims-<sufixo>;SecretName=Jwt--SecretKey)
   @Microsoft.KeyVault(VaultName=kv-insuranceclaims-<sufixo>;SecretName=ConnectionStrings--InsuranceClaims)
   ```

   Salve. A lista de variáveis mostra um indicador verde quando a referência foi resolvida.

Ao concluir esta etapa, inclua o Key Vault no diagrama e na tabela de `desenho-solucao.md`, para o desenho
continuar descrevendo só o que existe.

## Custos

App Service F1, Static Web Apps Free e Application Insights (até 5 GB/mês) não têm custo. O Azure SQL tem
oferta gratuita com limite mensal; fora dela, o tier Básico custa cerca de 5 dólares por mês. O Key Vault custa
centavos. Para encerrar tudo, exclua o grupo de recursos `rg-insuranceclaims`.

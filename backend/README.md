# Insurance Claims — backend

CRUD em ASP.NET Core 8 e SQL Server, com quatro camadas:

- Domain: entidade Claim e enum ClaimStatus.
- Application: DTOs, validações e serviço; interfaces do serviço e repositório.
- Infrastructure: EF Core, mapeamento, repositório e migrations.
- Api: controllers, DI e respostas de erro em ProblemDetails.

## Executar

Requisitos: SDK .NET 8 e SQL Server. A conexão padrão em `appsettings.json` aponta para a instância
local `localhost\SQLEXPRESS`, banco `InsuranceClaimsDb`, com autenticação integrada do Windows.
No diretório backend:

```powershell
dotnet restore
dotnet tool restore
dotnet ef database update --project InsuranceClaims.Infrastructure --startup-project InsuranceClaims.Api
dotnet run --project InsuranceClaims.Api --launch-profile http
```

Swagger: http://localhost:5169/swagger

A API não inicia sem `Jwt__SecretKey` (veja Autenticação e segurança).

Para outra instância, configure ConnectionStrings:InsuranceClaims em user-secrets
ou pela variável de ambiente ConnectionStrings__InsuranceClaims antes dos comandos.
Exemplo com autenticação integrada:

```powershell
$env:ConnectionStrings__InsuranceClaims = 'Server=(localdb)\MSSQLLocalDB;Database=InsuranceClaimsDb;Trusted_Connection=True;TrustServerCertificate=True'
```

Migrations são aplicadas explicitamente pelo comando acima, não na inicialização da API.

## Configuração

Toda configuração sensível ou dependente de ambiente vem de variáveis de ambiente (ou App Settings, na Azure).
Nada disso é gravado no repositório.

| Chave | Obrigatória | Descrição |
| --- | --- | --- |
| `ConnectionStrings__InsuranceClaims` | Não | Conexão com o SQL Server; o padrão está em `appsettings.json` |
| `Jwt__SecretKey` | Sim | Chave de assinatura do JWT, com pelo menos 32 caracteres |
| `Cors__AllowedOrigins__0` | Não | Origem do frontend autorizada pelo CORS; padrão `http://localhost:5173` |
| `Swagger__Enabled` | Não | `true` publica o Swagger fora do ambiente Development |
| `AuthSeed__Name`, `AuthSeed__Email`, `AuthSeed__Password` | Não | Criam o primeiro usuário na inicialização, se o e-mail ainda não existir |

Na Azure, a connection string do Azure SQL usa `Encrypt=True` e `TrustServerCertificate=False`.
O passo a passo da publicação está em [docs/publicacao-azure.md](../docs/publicacao-azure.md).

## Endpoints

| Método | Rota | Resposta de sucesso |
| --- | --- | --- |
| GET | /api/claims | 200, página de sinistros (items, pageNumber, pageSize, totalCount, totalPages) |
| GET | /api/claims/dashboard | 200, indicadores agregados |
| GET | /api/claims/{id} | 200, sinistro |
| POST | /api/claims | 201, sinistro e Location |
| PUT | /api/claims/{id} | 200, sinistro atualizado |
| DELETE | /api/claims/{id} | 204 |
| GET | /health | 200, verificação de disponibilidade, sem autenticação |

Os endpoints de `/api/claims` exigem token JWT; sem token válido retornam 401.
Dados inválidos retornam 400; Id inexistente, 404; número duplicado, 409.
GET /api/claims aceita pageNumber, pageSize (máximo 50), searchTerm, status, claimType,
occurrenceDateFrom, occurrenceDateTo, estimatedAmountMin e estimatedAmountMax.
PUT substitui os campos editáveis e exige status.
Veja InsuranceClaims.Api/InsuranceClaims.Api.http para exemplos.

## Decisões e validações

- Id é Guid gerado pela aplicação; ClaimNumber é informado e único entre os sinistros ativos.
  O número de um sinistro excluído (soft delete) pode ser reutilizado.
- Status inicial Open; PUT aceita Open, UnderAnalysis, Approved, Rejected e Closed.
  Não há restrições de transição, pois não foram especificadas.
- ClaimTypeId é obrigatório e deve referenciar um tipo ativo (veja Tipos de sinistro).
- Campos de texto obrigatórios, com limites de tamanho e remoção de espaços nas extremidades.
  InsuredDocument aceita CPF com 11 dígitos ou CNPJ com 14 posições alfanuméricas, armazenado sem máscara.
- OccurrenceDate representa somente a data, é obrigatória e não pode ultrapassar o dia atual em UTC.
- EstimatedAmount é não negativo, com até duas casas decimais e precisão SQL decimal(18,2).
- CreatedAt é gerado em UTC; UpdatedAt começa nulo e é preenchido em UTC na atualização.
  Esses campos não são aceitos como campos editáveis.
- Consultas de leitura usam AsNoTracking; atualização e exclusão carregam a entidade rastreada,
  de modo que o EF Core grava somente as colunas alteradas. Operações propagam CancellationToken.
- A unicidade também é garantida pelo banco, inclusive em criações concorrentes, por índice único
  filtrado (`DeletedAt IS NULL`).
- Paginação, filtros, soft delete e autenticação JWT foram implementados. Controle de versão de registros não faz parte desta etapa.

## Verificação HTTP

Com banco atualizado e API em execução:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/SmokeTest.ps1 -Email 'usuario@exemplo.com' -Password 'Troque-Esta-Senha-1!'
```

Informe as credenciais de um usuário ativo. Sem os parâmetros, o script usa as variáveis de ambiente
`AuthSeed__Email` e `AuthSeed__Password`. Use `-BaseUrl` para outra porta.

O script cria registros com números aleatórios e os exclui ao terminar. Como a exclusão é soft delete,
as linhas `SMOKE-*` permanecem no banco com `DeletedAt` preenchido; prefira executá-lo em um banco de testes.
Verifica autenticação, CRUD, persistência após atualização (incluindo troca de tipo), status, auditoria,
duplicidade, reutilização de número após exclusão, dashboard e validações.

## Autenticação e segurança

A API usa autenticação JWT Bearer para proteger o CRUD de sinistros. Os endpoints de `/api/claims` exigem token válido; o endpoint público é `POST /api/auth/login`.

Configurações obrigatórias para executar a API localmente:

```powershell
$env:Jwt__SecretKey = 'troque-por-uma-chave-forte-com-pelo-menos-32-caracteres'
```

Para criar o primeiro usuário no banco, informe também as variáveis abaixo antes de iniciar a API. A senha é armazenada somente como hash PBKDF2-SHA256 com salt; a senha em texto puro não é persistida.

```powershell
$env:AuthSeed__Name = 'Administrador'
$env:AuthSeed__Email = 'usuario@exemplo.com'
$env:AuthSeed__Password = 'Troque-Esta-Senha-1!'
```

Os valores acima são apenas exemplo; use e-mail e senha próprios.

O seed cria o usuário somente se o e-mail ainda não existir. Após o primeiro acesso, em um ambiente real, recomenda-se remover essas variáveis de seed e gerenciar usuários por fluxo administrativo próprio.

Endpoints de autenticação:

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | /api/auth/login | Valida e-mail/senha e retorna JWT |
| GET | /api/auth/me | Retorna o usuário autenticado pelo token |
| PUT | /api/auth/change-password | Altera a senha do usuário autenticado |

Limitações e próximos passos de segurança:

- O projeto usa access token JWT de curta duração, sem refresh token, para manter o escopo do teste técnico controlado.
- O frontend guarda o token em `sessionStorage`, reduzindo persistência após fechar o navegador. Em produção, avalie cookies `HttpOnly`, `Secure` e `SameSite`, além de proteção CSRF quando aplicável.
- A chave JWT não deve ser gravada no repositório. Em Azure, configure `Jwt__SecretKey` nas configurações do App Service ou Key Vault.
- O cadastro/gestão de usuários ficou fora do escopo desta etapa. Em produção, implemente recuperação de senha, política de senha, bloqueio por tentativas, rotação de chaves e auditoria de login.
- Para integração corporativa em Azure, Azure Entra ID pode ser uma alternativa melhor do que autenticação local.

## Dashboard

A API disponibiliza `GET /api/claims/dashboard`, protegido por JWT, com indicadores agregados para a tela gerencial:

- total de sinistros;
- quantidade por status;
- valor estimado total e ticket médio;
- agrupamento por tipo de sinistro;
- evolução mensal por data de ocorrência;
- últimos sinistros cadastrados.

O dashboard ignora registros removidos por soft delete (`DeletedAt` preenchido). As agregações são calculadas no banco de dados, por consultas `GROUP BY` geradas pelo EF Core; a API não carrega os sinistros em memória.

## Tipos de sinistro

`ClaimType` foi modelado como tabela de referência (`ClaimTypes`) e `Claims` usa `ClaimTypeId` como chave estrangeira. O status permanece como enum do domínio porque representa estados controlados do fluxo do sinistro.

Endpoint protegido por JWT:

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | /api/claim-types | Lista tipos ativos para cadastro/edição de sinistros |

Tipos iniciais inseridos por migration: Colisão, Roubo/Furto, Danos naturais, Incêndio, Terceiros, Vidros e Outros.

## Validação de CPF/CNPJ

CPF e CNPJ numérico tradicional são normalizados e validados com dígitos verificadores no backend. Sequências repetidas como `11111111111` e `00000000000000` são rejeitadas. CNPJ alfanumérico é aceito quando possui 14 posições com letras/números e pelo menos uma letra; neste MVP, ele recebe validação de formato/tamanho.

## Layout, tema e perfil

A interface autenticada usa layout corporativo com menu lateral, barra superior fixa, avatar com iniciais e menu do usuário. O tema claro/escuro é controlado no frontend pelo Mantine. O menu lateral mantém somente funcionalidades reais do sistema: Dashboard, Sinistros e Meu Perfil.

A alteração de senha usa `PUT /api/auth/change-password`, protegido por JWT. O backend valida a senha atual, exige nova senha com pelo menos 8 caracteres, valida confirmação e grava somente o novo hash PBKDF2-SHA256. Não há recuperação de senha por e-mail, upload de avatar, notificações ou controle de permissões nesta etapa para manter o escopo do teste técnico controlado.

## Política de senha

Na alteração de senha, a aplicação exige pelo menos 8 caracteres com letra maiúscula, letra minúscula, número e caractere especial. Se a senha atual estiver incorreta, o usuário permanece autenticado e recebe mensagem de erro no formulário.

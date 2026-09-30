# Migração para .NET 10 LTS

## Por quê

O backend está no .NET 8 (LTS), cujo suporte termina em **10/11/2026**. Depois dessa data o runtime deixa de
receber correções de segurança. O .NET 10 é a LTS atual, com suporte até novembro de 2028.

A migração ficou fora da entrega do desafio por decisão de escopo: trocar runtime e pacotes em cima da entrega
é risco sem retorno para o objetivo avaliado. Este documento deixa o caminho mapeado.

## Escopo e esforço

- Só o backend muda. O frontend (React/Vite) não depende da versão do .NET.
- Quatro projetos (`Domain`, `Application`, `Infrastructure`, `Api`), sem uso de APIs obsoletas ou de
  bibliotecas de terceiros além do Swashbuckle.
- Esforço estimado: 1 a 2 horas, incluindo validação. A arquitetura em camadas mantém a mudança contida em
  target framework e versões de pacotes; nenhuma regra de negócio é afetada.

## Pré-requisitos

- SDK do .NET 10 instalado (`dotnet --list-sdks` deve listar `10.0.x`).
- API local parada, para o build não falhar por arquivo em uso.
- Branch própria (`feat/dotnet-10`), para a `main` continuar publicável.

## Passo a passo

1. **Target framework**: nos quatro arquivos `.csproj`, trocar `<TargetFramework>net8.0</TargetFramework>`
   por `<TargetFramework>net10.0</TargetFramework>`.

2. **Pacotes** (`dotnet add package ... --version 10.x` ou edição direta dos `.csproj`):

   | Projeto | Pacote | De | Para |
   | --- | --- | --- | --- |
   | Infrastructure | `Microsoft.EntityFrameworkCore.SqlServer` | 8.0.11 | 10.x |
   | Infrastructure, Api | `Microsoft.EntityFrameworkCore.Design` | 8.0.11 | 10.x |
   | Api | `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.15 | 10.x |
   | Api | `Microsoft.AspNetCore.OpenApi` | 8.0.15 | 10.x |
   | Api | `Swashbuckle.AspNetCore` | 6.6.2 | versão mais recente compatível com .NET 10 |

   Alternativa para o Swagger: o ASP.NET Core 9+ gera o documento OpenAPI nativamente com
   `Microsoft.AspNetCore.OpenApi`; o Swashbuckle passaria a servir só a interface, ou seria substituído por
   uma UI como Scalar. Decisão a tomar no momento da migração.

3. **Ferramenta de migrations**: em `backend/.config/dotnet-tools.json`, atualizar `dotnet-ef` para `10.x`
   e rodar `dotnet tool restore`.

4. **Build**: `dotnet restore` e `dotnet build backend/InsuranceClaims.sln`. Corrigir avisos e erros conforme
   as notas de mudanças incompatíveis do EF Core 9 e 10 e do ASP.NET Core 9 e 10. Pelo conjunto de recursos
   usado (DbContext com Fluent API, migrations, JWT Bearer, controllers, ProblemDetails, PBKDF2), a expectativa
   é de nenhuma alteração de código.

5. **Modelo do EF Core**: rodar `dotnet ef migrations has-pending-model-changes --project
   InsuranceClaims.Infrastructure --startup-project InsuranceClaims.Api`. Se não houver mudanças, nenhuma
   migration nova é necessária; o `ProductVersion` gravado no snapshot pode ser atualizado quando a próxima
   migration for criada.

6. **Publicação**: em `.github/workflows/deploy-api.yml`, trocar `dotnet-version: 8.0.x` por `10.0.x`.
   No App Service, em **Configuração > Configurações gerais > Pilha**, selecionar **.NET 10**.

7. **Documentação**: atualizar as referências a ".NET 8" nos READMEs, no desenho de solução e no guia de
   publicação.

## Validação

1. `dotnet build` sem avisos novos.
2. API local no ar; `GET /health`, `GET /swagger` e login funcionando.
3. `backend/scripts/SmokeTest.ps1` passando (71 verificações) contra a API local e, depois do deploy,
   contra a URL da Azure.
4. Frontend publicado operando normalmente: o contrato da API não muda.

## Riscos e mitigação

- **Pacote de terceiros sem versão compatível** (Swashbuckle): mitigado pela alternativa do OpenAPI nativo.
- **Mudança de comportamento de consultas do EF Core** entre versões: coberta pelo smoke test, que exercita
  filtros, paginação, dashboard e unicidade.
- **Runtime do App Service**: a troca da pilha é reversível na mesma tela.

## Plano de retorno

Reverter o merge da branch (`git revert`) e voltar a pilha do App Service para .NET 8. Como não há migration
nova nem mudança de contrato, o banco e o frontend não precisam de ação.

# Insurance Claims — frontend

Frontend React com Vite e Mantine para o sistema de Gestão de Sinistros.

## Executar

```bash
npm install
npm run dev
```

A API padrão é `http://localhost:5169`. Para alterar, crie um arquivo `.env.local` nesta pasta
(ignorado pelo git) com a URL desejada, sem barra no final:

```
VITE_API_BASE_URL=http://localhost:5169
```

A variável é lida no momento do build. Na publicação pelo GitHub Actions, ela vem da variável
de repositório `VITE_API_BASE_URL`.

## Autenticação

A tela de login chama `POST /api/auth/login`. O token JWT retornado é mantido em `sessionStorage` e enviado nas chamadas protegidas como `Authorization: Bearer <token>`.

O logout remove a sessão local. Quando a API retorna 401, o frontend limpa a sessão e volta para a tela de login.

Limitações e próximos passos:

- O token fica em `sessionStorage` para este MVP. Em produção, considere cookies `HttpOnly`, `Secure` e `SameSite` conforme a arquitetura final.
- Não há refresh token nesta etapa; quando o JWT expira, o usuário faz login novamente.
- Não há tela de recuperação de senha ou gestão de usuários, pois o foco do teste é o CRUD protegido de sinistros.

## Build

```bash
npm run build
```

## Dashboard

O dashboard usa dados reais da API em `GET /api/claims/dashboard` e apresenta:

- cards de indicadores;
- distribuição por status;
- sinistros por tipo;
- evolução mensal;
- últimos sinistros cadastrados.

A biblioteca de gráficos utilizada é Recharts. Mantine continua responsável pelo layout, cards, feedback e responsividade.

## Tipos de sinistro

O campo Tipo no formulário é carregado pela API `GET /api/claim-types` e enviado para criação/edição como `claimTypeId`. A listagem e o dashboard continuam exibindo o nome do tipo retornado pela API.

## Validação de CPF/CNPJ

O formulário valida CPF e CNPJ numérico com dígitos verificadores para melhorar a experiência do usuário. CNPJ alfanumérico é permitido com 14 posições alfanuméricas e pelo menos uma letra. O backend continua sendo a fonte de verdade da validação.

## Layout, tema e perfil

A área autenticada usa layout corporativo responsivo com menu lateral, topbar fixa, avatar com iniciais e menu do usuário. O tema claro/escuro é alternado pela interface com recursos do Mantine.

O menu contém somente páginas implementadas:

- Dashboard;
- Sinistros;
- Meu Perfil.

A página Meu Perfil permite consultar nome/e-mail da sessão e alterar a senha atual. Não foram implementados notificações, upload de avatar, permissões ou recuperação de senha por e-mail para evitar aumento de escopo.

## Política de senha

A alteração de senha valida no formulário e no backend: mínimo de 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial. Senha atual incorreta exibe erro no formulário sem encerrar a sessão.

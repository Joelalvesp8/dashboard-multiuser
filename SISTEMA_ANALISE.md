# 📊 Sistema de Análise e Projeção de Gastos

Sistema completo para análise de compras e projeção de gastos futuros baseado em dados históricos da planilha Google Sheets.

## 🎯 Funcionalidades

### 1. Análise de Dados em Tempo Real

O sistema busca dados da planilha **2025** do Google Sheets e realiza análises automáticas:

- **Estatísticas Gerais**
  - Total gasto
  - Número total de compras
  - Total de unidades compradas
  - Número de categorias
  - Ticket médio por compra

- **Análise Mensal**
  - Gastos por mês (Janeiro a Dezembro)
  - Quantidade de compras por mês
  - Média de gasto por compra em cada mês

- **Análise por Categoria**
  - Total gasto em cada categoria
  - Quantidade de itens por categoria
  - Total de unidades por categoria
  - Média de gasto por categoria

- **Top Produtos Mais Caros**
  - Lista dos produtos com maior valor total
  - Categoria de cada produto
  - Unidades compradas
  - Preço médio

### 2. Projeção de Gastos Futuros

O sistema calcula automaticamente:

- **Média Mensal** de gastos
- **Tendência** de crescimento/decrescimento (em %)
- **Projeções** para os próximos 3 meses (configurável)

#### Como funciona a projeção:

1. Calcula a média dos gastos mensais
2. Identifica a tendência (crescimento ou queda) comparando primeiros e últimos meses
3. Projeta valores futuros aplicando a tendência identificada

### 3. Análise de Sazonalidade

Identifica padrões sazonais nos gastos:

- Mês com **maior gasto**
- Mês com **menor gasto**
- **Variação percentual** entre maior e menor
- **Média geral** de gastos

## 🔌 Endpoints da API

### Análises

```
GET /api/dashboard/data
```
Retorna análise completa (estatísticas, análise mensal, por categoria, top produtos, sazonalidade e projeção)

```
GET /api/dashboard/monthly
```
Retorna apenas análise mensal

```
GET /api/dashboard/category
```
Retorna apenas análise por categoria

```
GET /api/dashboard/top-products?limit=10
```
Retorna top N produtos mais caros

```
GET /api/dashboard/seasonality
```
Retorna análise de sazonalidade

### Projeções

```
GET /api/dashboard/projection?months=3
```
Retorna projeção para os próximos N meses

## 📈 Exemplo de Resposta

### Análise Completa (`/api/dashboard/data`)

```json
{
  "stats": {
    "totalGasto": 74916421.59,
    "totalCompras": 24422,
    "totalUnidades": 40110227,
    "totalCategorias": 10,
    "ticketMedio": 3067.58
  },
  "byMonth": [
    {
      "mes": "Jan",
      "total": 9018454.36,
      "quantidade": 2547,
      "media": 3540.81
    },
    ...
  ],
  "byCategory": [
    {
      "categoria": "Medicamentos",
      "total": 27993027.12,
      "quantidade": 10198,
      "unidades": 5915114,
      "media": 2744.95
    },
    ...
  ],
  "topProducts": [
    {
      "produto": "Nome do Produto",
      "categoria": "Categoria",
      "valorTotal": 10000.00,
      "unidades": 100,
      "precoMedio": 100.00,
      "mes": "jan./25"
    },
    ...
  ],
  "seasonality": {
    "media": 7491642.16,
    "maiorGasto": {
      "mes": "Jan",
      "valor": 9018454.36
    },
    "menorGasto": {
      "mes": "Mar",
      "valor": 6179656.97
    },
    "variacao": 37.9
  },
  "projection": {
    "mediaMensal": 7491642.16,
    "tendencia": -5.2,
    "projecoes": [
      {
        "mes": "Nov",
        "valorProjetado": 7102459.64,
        "tendencia": -5.2
      },
      {
        "mes": "Dez",
        "valorProjetado": 6713277.12,
        "tendencia": -5.2
      },
      {
        "mes": "Jan",
        "valorProjetado": 6324094.60,
        "tendencia": -5.2
      }
    ]
  },
  "metadata": {
    "totalRecords": 24422,
    "lastUpdate": "2025-11-20T19:10:00.000Z"
  }
}
```

## 🔐 Autenticação

Todos os endpoints requerem autenticação via JWT.

**Permissões necessárias:**
- `view_dashboard` - Para análises básicas
- `view_analytics` - Para análises avançadas e projeções

## 🚀 Como Usar

1. Faça login para obter o token JWT:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dashboard.com","password":"admin123"}'
```

2. Use o token para acessar as análises:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/dashboard/data
```

## 📊 Estrutura dos Dados da Planilha

O sistema espera que a planilha tenha a seguinte estrutura:

| Coluna | Nome | Descrição |
|--------|------|-----------|
| A | Ref | Referência |
| B | Ano | Ano (25 para 2025) |
| C | mês | Mês (jan, fev, mar...) |
| D | Nome do produto | Nome completo do produto |
| E | Categoria | Categoria do produto |
| F | Mês | Mês formatado (jan./25) |
| G | Valor total | Valor total em R$ |
| H | Total unidades | Quantidade de unidades |
| I | Preço médio | Preço médio unitário |

## 🎨 Próximos Passos

O frontend será atualizado para exibir:
- Gráficos interativos de tendências
- Cards com estatísticas principais
- Gráficos de projeção
- Comparativos entre categorias
- Análise de sazonalidade visual

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + TypeScript + Express
- **Google Sheets API**: Para buscar dados em tempo real
- **Análise de Dados**: Funções customizadas de análise e projeção
- **Autenticação**: JWT com sistema de permissões

---

**Acesse**: http://localhost:5173
**Login**: admin@dashboard.com / admin123

// Serviço de Análise e Projeção de Gastos

export interface PurchaseData {
  ref: string;
  ano: string;
  mes: string;
  produto: string;
  categoria: string;
  mesFormatado: string;
  valorTotal: number;
  totalUnidades: number;
  precoMedio: number;
}

// Converte valor em formato brasileiro para número
function parseValorBR(valor: string): number {
  if (!valor) return 0;
  return parseFloat(
    valor
      .replace(/R\$/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .trim()
  );
}

// Converte dados brutos para estrutura tipada
export function parsePurchaseData(rawData: any[]): PurchaseData[] {
  return rawData
    .slice(1) // Pula cabeçalho
    .filter(row => row && row.length >= 9)
    .map(row => ({
      ref: row[0] || '',
      ano: row[1] || '',
      mes: row[2] || '',
      produto: row[3] || '',
      categoria: row[4] || '',
      mesFormatado: row[5] || '',
      valorTotal: parseValorBR(row[6]),
      totalUnidades: parseInt(row[7]) || 0,
      precoMedio: parseValorBR(row[8]),
    }));
}

// Análise de gastos por mês
export function analyzeByMonth(data: PurchaseData[]) {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const gastosPorMes = meses.map(mes => {
    const gastosMes = data.filter(item => item.mes.toLowerCase() === mes);
    const total = gastosMes.reduce((sum, item) => sum + item.valorTotal, 0);
    const quantidade = gastosMes.length;

    return {
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      total: Math.round(total * 100) / 100,
      quantidade,
      media: quantidade > 0 ? Math.round((total / quantidade) * 100) / 100 : 0,
    };
  });

  return gastosPorMes;
}

// Análise de gastos por categoria
export function analyzeByCategory(data: PurchaseData[]) {
  const categorias: { [key: string]: any } = {};

  data.forEach(item => {
    if (!categorias[item.categoria]) {
      categorias[item.categoria] = {
        categoria: item.categoria,
        total: 0,
        quantidade: 0,
        unidades: 0,
      };
    }

    categorias[item.categoria].total += item.valorTotal;
    categorias[item.categoria].quantidade += 1;
    categorias[item.categoria].unidades += item.totalUnidades;
  });

  return Object.values(categorias)
    .map((cat: any) => ({
      ...cat,
      total: Math.round(cat.total * 100) / 100,
      media: Math.round((cat.total / cat.quantidade) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}

// Top produtos mais caros
export function getTopExpensiveProducts(data: PurchaseData[], limit: number = 10) {
  return data
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, limit)
    .map(item => ({
      produto: item.produto,
      categoria: item.categoria,
      valorTotal: Math.round(item.valorTotal * 100) / 100,
      unidades: item.totalUnidades,
      precoMedio: Math.round(item.precoMedio * 100) / 100,
      mes: item.mesFormatado,
    }));
}

// Projeção de gastos futuros (baseado em média dos últimos meses)
export function projectFutureExpenses(data: PurchaseData[], mesesFuturos: number = 3) {
  const gastosPorMes = analyzeByMonth(data);

  // Calcula média dos meses com dados
  const mesesComDados = gastosPorMes.filter(m => m.total > 0);
  const mediaMensal = mesesComDados.reduce((sum, m) => sum + m.total, 0) / mesesComDados.length;

  // Calcula tendência (crescimento/decrescimento)
  let tendencia = 0;
  if (mesesComDados.length >= 2) {
    const primeirosMeses = mesesComDados.slice(0, Math.floor(mesesComDados.length / 2));
    const ultimosMeses = mesesComDados.slice(Math.floor(mesesComDados.length / 2));

    const mediaPrimeira = primeirosMeses.reduce((s, m) => s + m.total, 0) / primeirosMeses.length;
    const mediaSegunda = ultimosMeses.reduce((s, m) => s + m.total, 0) / ultimosMeses.length;

    tendencia = ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100;
  }

  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const ultimoMesIndex = mesesComDados.length - 1;

  const projecoes = [];
  for (let i = 1; i <= mesesFuturos; i++) {
    const mesIndex = (ultimoMesIndex + i) % 12;
    const valorProjetado = mediaMensal * (1 + (tendencia / 100) * i);

    projecoes.push({
      mes: mesesNomes[mesIndex],
      valorProjetado: Math.round(valorProjetado * 100) / 100,
      tendencia: Math.round(tendencia * 10) / 10,
    });
  }

  return {
    mediaMensal: Math.round(mediaMensal * 100) / 100,
    tendencia: Math.round(tendencia * 10) / 10,
    projecoes,
  };
}

// Análise de sazonalidade
export function analyzeSeasonality(data: PurchaseData[]) {
  const gastosPorMes = analyzeByMonth(data);
  const mesesComDados = gastosPorMes.filter(m => m.total > 0);

  if (mesesComDados.length === 0) return null;

  const media = mesesComDados.reduce((s, m) => s + m.total, 0) / mesesComDados.length;
  const maiorGasto = Math.max(...mesesComDados.map(m => m.total));
  const menorGasto = Math.min(...mesesComDados.map(m => m.total));

  const mesMaior = mesesComDados.find(m => m.total === maiorGasto);
  const mesMenor = mesesComDados.find(m => m.total === menorGasto);

  return {
    media: Math.round(media * 100) / 100,
    maiorGasto: {
      mes: mesMaior?.mes,
      valor: Math.round(maiorGasto * 100) / 100,
    },
    menorGasto: {
      mes: mesMenor?.mes,
      valor: Math.round(menorGasto * 100) / 100,
    },
    variacao: Math.round(((maiorGasto - menorGasto) / media) * 100 * 10) / 10,
  };
}

// Estatísticas gerais
export function getGeneralStats(data: PurchaseData[]) {
  const totalGasto = data.reduce((sum, item) => sum + item.valorTotal, 0);
  const totalCompras = data.length;
  const totalUnidades = data.reduce((sum, item) => sum + item.totalUnidades, 0);
  const categorias = new Set(data.map(item => item.categoria)).size;

  return {
    totalGasto: Math.round(totalGasto * 100) / 100,
    totalCompras,
    totalUnidades,
    totalCategorias: categorias,
    ticketMedio: Math.round((totalGasto / totalCompras) * 100) / 100,
  };
}

// Análise de produto específico
export function analyzeProductHistory(data: PurchaseData[], productName: string) {
  const productData = data.filter(item => 
    item.produto.toLowerCase().includes(productName.toLowerCase())
  );

  if (productData.length === 0) return null;

  const byMonth = analyzeByMonth(productData);
  const totalGasto = productData.reduce((sum, item) => sum + item.valorTotal, 0);
  const totalUnidades = productData.reduce((sum, item) => sum + item.totalUnidades, 0);

  return {
    produto: productData[0].produto,
    categoria: productData[0].categoria,
    totalCompras: productData.length,
    totalGasto: Math.round(totalGasto * 100) / 100,
    totalUnidades,
    precoMedio: totalUnidades > 0 ? Math.round((totalGasto / totalUnidades) * 100) / 100 : 0,
    historicoMensal: byMonth,
    projecao: projectFutureExpenses(productData, 3),
  };
}

// Filtrar dados por categoria
export function filterByCategory(data: PurchaseData[], categoria: string) {
  return data.filter(item => item.categoria === categoria);
}

// Filtrar dados por múltiplas categorias
export function filterByCategories(data: PurchaseData[], categorias: string[]) {
  if (categorias.length === 0) return data;
  return data.filter(item => categorias.includes(item.categoria));
}

// Buscar produtos por nome (autocomplete)
export function searchProducts(data: PurchaseData[], query: string, limit: number = 10) {
  if (!query || query.length < 2) return [];

  const uniqueProducts = new Map<string, PurchaseData>();
  
  data.forEach(item => {
    if (item.produto.toLowerCase().includes(query.toLowerCase())) {
      if (!uniqueProducts.has(item.produto)) {
        uniqueProducts.set(item.produto, item);
      }
    }
  });

  return Array.from(uniqueProducts.values())
    .slice(0, limit)
    .map(item => ({
      produto: item.produto,
      categoria: item.categoria,
    }));
}

// Listar todas as categorias disponíveis
export function getCategories(data: PurchaseData[]) {
  const categorias = new Set(data.map(item => item.categoria));
  return Array.from(categorias).sort();
}

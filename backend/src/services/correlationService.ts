// Serviço de Correlação entre Pacientes e Gastos

import { PurchaseData } from './analysisService';
import { PatientData } from './patientsService';

interface CorrelationByMonth {
  mes: string;
  totalPacientes: number;
  totalGasto: number;
  gastoPorPaciente: number;
  gastosPorCategoria: {
    categoria: string;
    total: number;
    porPaciente: number;
  }[];
}

interface CorrelationBySetor {
  setor: string;
  totalPacientes: number;
  totalGasto: number;
  gastoPorPaciente: number;
  gastosPorCategoria: {
    categoria: string;
    total: number;
    porPaciente: number;
  }[];
}

interface ElasticityAnalysis {
  categoria: string;
  correlacao: number; // -1 a 1
  elasticidade: number; // % de aumento de gasto para cada % de aumento de pacientes
  tendencia: 'positiva' | 'negativa' | 'neutra';
  descricao: string;
}

// Mapeia meses em português para inglês
const mesesMap: { [key: string]: keyof Omit<PatientData, 'setor'> } = {
  'jan': 'janeiro',
  'fev': 'fevereiro',
  'mar': 'marco',
  'abr': 'abril',
  'mai': 'maio',
  'jun': 'junho',
  'jul': 'julho',
  'ago': 'agosto',
  'set': 'setembro',
  'out': 'outubro',
  'nov': 'novembro',
  'dez': 'dezembro',
};

const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Correlação mensal: gastos por paciente
export function correlateByMonth(
  purchaseData: any[],
  patientsData: PatientData[]
): CorrelationByMonth[] {
  const resultado: CorrelationByMonth[] = [];

  mesesNomes.forEach(mes => {
    // Pegar compras do mês
    const comprasMes = purchaseData.filter(item => item.mes.toLowerCase() === mes);

    // Pegar total de pacientes do mês
    const mesKey = mesesMap[mes];
    const totalPacientes = patientsData.reduce((sum, setor) => sum + (setor[mesKey] || 0), 0);

    // Calcular gastos totais
    const totalGasto = comprasMes.reduce((sum, item) => sum + item.valorTotal, 0);

    // Gastos por categoria
    const categorias: { [key: string]: number } = {};
    comprasMes.forEach(item => {
      if (!categorias[item.categoria]) {
        categorias[item.categoria] = 0;
      }
      categorias[item.categoria] += item.valorTotal;
    });

    const gastosPorCategoria = Object.keys(categorias).map(categoria => ({
      categoria,
      total: Math.round(categorias[categoria] * 100) / 100,
      porPaciente: totalPacientes > 0 ? Math.round((categorias[categoria] / totalPacientes) * 100) / 100 : 0,
    })).sort((a, b) => b.total - a.total);

    resultado.push({
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      totalPacientes,
      totalGasto: Math.round(totalGasto * 100) / 100,
      gastoPorPaciente: totalPacientes > 0 ? Math.round((totalGasto / totalPacientes) * 100) / 100 : 0,
      gastosPorCategoria,
    });
  });

  return resultado;
}

// Correlação por setor: gastos por paciente de cada setor
export function correlateBySetor(
  purchaseData: any[],
  patientsData: PatientData[]
): CorrelationBySetor[] {
  const resultado: CorrelationBySetor[] = [];

  patientsData.forEach(setor => {
    // Total de pacientes do setor (soma de todos os meses)
    const totalPacientes = mesesNomes.reduce((sum, mes) => {
      const mesKey = mesesMap[mes];
      return sum + (setor[mesKey] || 0);
    }, 0);

    // Para este exemplo, vamos distribuir os gastos proporcionalmente aos pacientes de cada setor
    // Nota: Idealmente, você teria dados específicos de gastos por setor na planilha
    const totalGeralPacientes = patientsData.reduce((sum, s) => {
      return sum + mesesNomes.reduce((sumMes, mes) => {
        const mesKey = mesesMap[mes];
        return sumMes + (s[mesKey] || 0);
      }, 0);
    }, 0);

    const proporcao = totalGeralPacientes > 0 ? totalPacientes / totalGeralPacientes : 0;
    const totalGeralGasto = purchaseData.reduce((sum, item) => sum + item.valorTotal, 0);
    const totalGasto = totalGeralGasto * proporcao;

    // Gastos por categoria (proporcional)
    const categorias: { [key: string]: number } = {};
    purchaseData.forEach(item => {
      if (!categorias[item.categoria]) {
        categorias[item.categoria] = 0;
      }
      categorias[item.categoria] += item.valorTotal * proporcao;
    });

    const gastosPorCategoria = Object.keys(categorias).map(categoria => ({
      categoria,
      total: Math.round(categorias[categoria] * 100) / 100,
      porPaciente: totalPacientes > 0 ? Math.round((categorias[categoria] / totalPacientes) * 100) / 100 : 0,
    })).sort((a, b) => b.total - a.total);

    resultado.push({
      setor: setor.setor,
      totalPacientes,
      totalGasto: Math.round(totalGasto * 100) / 100,
      gastoPorPaciente: totalPacientes > 0 ? Math.round((totalGasto / totalPacientes) * 100) / 100 : 0,
      gastosPorCategoria,
    });
  });

  return resultado.sort((a, b) => b.totalPacientes - a.totalPacientes);
}

// Análise de elasticidade: correlação entre variação de pacientes e variação de gastos
export function analyzeElasticity(
  purchaseData: any[],
  patientsData: PatientData[]
): ElasticityAnalysis[] {
  const correlationByMonth = correlateByMonth(purchaseData, patientsData);

  // Filtrar apenas meses com dados
  const dadosValidos = correlationByMonth.filter(m => m.totalPacientes > 0 && m.totalGasto > 0);

  if (dadosValidos.length < 2) {
    return [];
  }

  // Pegar todas as categorias únicas
  const todasCategorias = new Set<string>();
  dadosValidos.forEach(mes => {
    mes.gastosPorCategoria.forEach(cat => todasCategorias.add(cat.categoria));
  });

  const resultado: ElasticityAnalysis[] = [];

  // Para cada categoria, calcular correlação e elasticidade
  todasCategorias.forEach(categoria => {
    const dadosCategoria = dadosValidos.map(mes => {
      const catData = mes.gastosPorCategoria.find(c => c.categoria === categoria);
      return {
        pacientes: mes.totalPacientes,
        gasto: catData ? catData.total : 0,
      };
    }).filter(d => d.gasto > 0);

    if (dadosCategoria.length < 2) return;

    // Calcular correlação de Pearson
    const n = dadosCategoria.length;
    const sumX = dadosCategoria.reduce((s, d) => s + d.pacientes, 0);
    const sumY = dadosCategoria.reduce((s, d) => s + d.gasto, 0);
    const sumXY = dadosCategoria.reduce((s, d) => s + d.pacientes * d.gasto, 0);
    const sumX2 = dadosCategoria.reduce((s, d) => s + d.pacientes * d.pacientes, 0);
    const sumY2 = dadosCategoria.reduce((s, d) => s + d.gasto * d.gasto, 0);

    const numerador = n * sumXY - sumX * sumY;
    const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const correlacao = denominador !== 0 ? numerador / denominador : 0;

    // Calcular elasticidade (variação % de gasto / variação % de pacientes)
    let elasticidade = 0;
    if (dadosCategoria.length >= 2) {
      const primeiro = dadosCategoria[0];
      const ultimo = dadosCategoria[dadosCategoria.length - 1];

      const variacaoPacientes = ((ultimo.pacientes - primeiro.pacientes) / primeiro.pacientes) * 100;
      const variacaoGasto = ((ultimo.gasto - primeiro.gasto) / primeiro.gasto) * 100;

      if (variacaoPacientes !== 0) {
        elasticidade = variacaoGasto / variacaoPacientes;
      }
    }

    let tendencia: 'positiva' | 'negativa' | 'neutra' = 'neutra';
    if (correlacao > 0.3) tendencia = 'positiva';
    else if (correlacao < -0.3) tendencia = 'negativa';

    let descricao = '';
    if (tendencia === 'positiva') {
      descricao = `Para cada 1% de aumento no atendimento, há um aumento de ${Math.abs(elasticidade).toFixed(2)}% em ${categoria}`;
    } else if (tendencia === 'negativa') {
      descricao = `Correlação negativa: aumento de atendimento não aumenta gastos em ${categoria}`;
    } else {
      descricao = `Não há correlação significativa entre atendimento e gastos em ${categoria}`;
    }

    resultado.push({
      categoria,
      correlacao: Math.round(correlacao * 100) / 100,
      elasticidade: Math.round(elasticidade * 100) / 100,
      tendencia,
      descricao,
    });
  });

  return resultado.sort((a, b) => Math.abs(b.correlacao) - Math.abs(a.correlacao));
}

// Resumo geral de correlação
export function getCorrelationSummary(
  purchaseData: any[],
  patientsData: PatientData[]
) {
  const byMonth = correlateByMonth(purchaseData, patientsData);
  const bySetor = correlateBySetor(purchaseData, patientsData);
  const elasticity = analyzeElasticity(purchaseData, patientsData);

  // Calcular média geral de gasto por paciente
  const totalPacientes = byMonth.reduce((s, m) => s + m.totalPacientes, 0);
  const totalGasto = byMonth.reduce((s, m) => s + m.totalGasto, 0);
  const mediaGeralPorPaciente = totalPacientes > 0 ? totalGasto / totalPacientes : 0;

  return {
    mediaGeralPorPaciente: Math.round(mediaGeralPorPaciente * 100) / 100,
    byMonth,
    bySetor,
    elasticity,
  };
}

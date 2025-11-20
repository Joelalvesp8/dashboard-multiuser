// Serviço de Análise de Pacientes Atendidos

import { getSheetData } from './googleSheets';

export interface PatientData {
  setor: string;
  janeiro: number;
  fevereiro: number;
  marco: number;
  abril: number;
  maio: number;
  junho: number;
  julho: number;
  agosto: number;
  setembro: number;
  outubro: number;
  novembro: number;
  dezembro: number;
}

// Busca dados de pacientes
export async function getPatientsData(): Promise<PatientData[]> {
  try {
    const sheetData = await getSheetData('Pacientes!A1:Z100');
    const rows = sheetData.rows;

    if (rows.length === 0) return [];

    // Primeira linha é o cabeçalho
    const patients: PatientData[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const setor = row[0]?.toString().trim() || '';
      if (!setor) continue;

      patients.push({
        setor,
        janeiro: parseInt(row[1]) || 0,
        fevereiro: parseInt(row[2]) || 0,
        marco: parseInt(row[3]) || 0,
        abril: parseInt(row[4]) || 0,
        maio: parseInt(row[5]) || 0,
        junho: parseInt(row[6]) || 0,
        julho: parseInt(row[7]) || 0,
        agosto: parseInt(row[8]) || 0,
        setembro: parseInt(row[9]) || 0,
        outubro: parseInt(row[10]) || 0,
        novembro: parseInt(row[11]) || 0,
        dezembro: parseInt(row[12]) || 0,
      });
    }

    return patients;
  } catch (error) {
    console.error('Erro ao buscar dados de pacientes:', error);
    return [];
  }
}

// Análise de pacientes por mês
export function analyzePatientsByMonth(patients: PatientData[]) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const chavesDosMeses: { [key: string]: keyof Omit<PatientData, 'setor'> } = {
    'Janeiro': 'janeiro',
    'Fevereiro': 'fevereiro',
    'Março': 'marco',
    'Abril': 'abril',
    'Maio': 'maio',
    'Junho': 'junho',
    'Julho': 'julho',
    'Agosto': 'agosto',
    'Setembro': 'setembro',
    'Outubro': 'outubro',
    'Novembro': 'novembro',
    'Dezembro': 'dezembro',
  };

  const resultado = meses.map((mes, index) => {
    const chave = chavesDosMeses[mes];
    const total = patients.reduce((sum, p) => {
      const valor = p[chave] || 0;
      return sum + valor;
    }, 0);

    return {
      mes,
      total,
      setores: patients.map(p => ({
        setor: p.setor,
        quantidade: p[chave] || 0,
      })),
    };
  });

  return resultado;
}

// Estatísticas gerais de pacientes
export function getPatientStats(patients: PatientData[]) {
  if (patients.length === 0) {
    return {
      totalPacientes: 0,
      mediaMensal: 0,
      setores: 0,
    };
  }

  let totalPacientes = 0;
  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  patients.forEach(patient => {
    meses.forEach(mes => {
      totalPacientes += patient[mes as keyof Omit<PatientData, 'setor'>] || 0;
    });
  });

  const mesesComDados = meses.filter(mes => {
    return patients.some(p => (p[mes as keyof Omit<PatientData, 'setor'>] || 0) > 0);
  }).length;

  return {
    totalPacientes,
    mediaMensal: mesesComDados > 0 ? Math.round(totalPacientes / mesesComDados) : 0,
    setores: patients.length,
  };
}

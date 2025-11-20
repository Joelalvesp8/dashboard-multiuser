import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getSheetData, parseSheetToJson } from '../services/googleSheets';
import {
  parsePurchaseData,
  analyzeByMonth,
  analyzeByCategory,
  getTopExpensiveProducts,
  projectFutureExpenses,
  analyzeSeasonality,
  getGeneralStats,
  analyzeProductHistory,
  filterByCategories,
  searchProducts,
  getCategories,
} from '../services/analysisService';
import { getPatientsData, analyzePatientsByMonth, getPatientStats } from '../services/patientsService';
import { getCorrelationSummary } from '../services/correlationService';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;

    // Buscar dados do Google Sheets
    const sheetData = await getSheetData(range as string);
    const jsonData = parseSheetToJson(sheetData);
    const purchaseData = parsePurchaseData(sheetData.rows);

    // Buscar dados de pacientes
    const patients = await getPatientsData();
    const patientsStats = getPatientStats(patients);
    const patientsByMonth = analyzePatientsByMonth(patients);

    // Análises
    const stats = getGeneralStats(purchaseData);
    const byMonth = analyzeByMonth(purchaseData);
    const byCategory = analyzeByCategory(purchaseData);
    const topProducts = getTopExpensiveProducts(purchaseData, 10);
    const seasonality = analyzeSeasonality(purchaseData);
    const projection = projectFutureExpenses(purchaseData, 3);

    res.json({
      stats,
      byMonth,
      byCategory,
      topProducts,
      seasonality,
      projection,
      patients: {
        stats: patientsStats,
        byMonth: patientsByMonth,
      },
      metadata: {
        totalRecords: purchaseData.length,
        lastUpdate: new Date(),
      },
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
};

export const getMonthlyAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const monthlyData = analyzeByMonth(purchaseData);

    res.json(monthlyData);
  } catch (error) {
    console.error('Get monthly analysis error:', error);
    res.status(500).json({ error: 'Erro ao buscar análise mensal' });
  }
};

export const getCategoryAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const categoryData = analyzeByCategory(purchaseData);

    res.json(categoryData);
  } catch (error) {
    console.error('Get category analysis error:', error);
    res.status(500).json({ error: 'Erro ao buscar análise por categoria' });
  }
};

export const getProjection = async (req: AuthRequest, res: Response) => {
  try {
    const { range, months } = req.query;
    const monthsToProject = months ? parseInt(months as string) : 3;

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const projection = projectFutureExpenses(purchaseData, monthsToProject);

    res.json(projection);
  } catch (error) {
    console.error('Get projection error:', error);
    res.status(500).json({ error: 'Erro ao calcular projeção' });
  }
};

export const getTopProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { range, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const topProducts = getTopExpensiveProducts(purchaseData, limitNum);

    res.json(topProducts);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos mais caros' });
  }
};

export const getSeasonality = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const seasonality = analyzeSeasonality(purchaseData);

    res.json(seasonality);
  } catch (error) {
    console.error('Get seasonality error:', error);
    res.status(500).json({ error: 'Erro ao buscar sazonalidade' });
  }
};

// Novos endpoints para análise avançada

export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await getPatientsData();
    const byMonth = analyzePatientsByMonth(patients);
    const stats = getPatientStats(patients);

    res.json({
      stats,
      byMonth,
      setores: patients,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de pacientes' });
  }
};

export const getProductAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { range, product } = req.query;

    if (!product) {
      return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    }

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const analysis = analyzeProductHistory(purchaseData, product as string);

    if (!analysis) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get product analysis error:', error);
    res.status(500).json({ error: 'Erro ao analisar produto' });
  }
};

export const getFilteredData = async (req: AuthRequest, res: Response) => {
  try {
    const { range, categories } = req.query;

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    let filteredData = purchaseData;

    if (categories) {
      const categoryList = (categories as string).split(',');
      filteredData = filterByCategories(purchaseData, categoryList);
    }

    // Buscar dados de pacientes (sempre incluir)
    const patients = await getPatientsData();
    const patientsStats = getPatientStats(patients);
    const patientsByMonth = analyzePatientsByMonth(patients);

    const stats = getGeneralStats(filteredData);
    const byMonth = analyzeByMonth(filteredData);
    const byCategory = analyzeByCategory(filteredData);
    const topProducts = getTopExpensiveProducts(filteredData, 10);
    const seasonality = analyzeSeasonality(filteredData);
    const projection = projectFutureExpenses(filteredData, 3);

    res.json({
      stats,
      byMonth,
      byCategory,
      topProducts,
      seasonality,
      projection,
      patients: {
        stats: patientsStats,
        byMonth: patientsByMonth,
      },
      totalFiltered: filteredData.length,
      metadata: {
        totalRecords: filteredData.length,
        lastUpdate: new Date(),
      },
    });
  } catch (error) {
    console.error('Get filtered data error:', error);
    res.status(500).json({ error: 'Erro ao filtrar dados' });
  }
};

export const searchProductsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { range, query, limit } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const limitNum = limit ? parseInt(limit as string) : 10;
    const products = searchProducts(purchaseData, query as string, limitNum);

    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

export const getCategoriesEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;

    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const categories = getCategories(purchaseData);

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

// Manter compatibilidade com endpoints antigos
export const getChartData = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const categoryData = analyzeByCategory(purchaseData);

    res.json(
      categoryData.map(cat => ({
        name: cat.categoria,
        value: cat.total,
      }))
    );
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
  }
};

export const getStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const stats = getGeneralStats(purchaseData);

    res.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas' });
  }
};

export const getTimeSeriesData = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const monthlyData = analyzeByMonth(purchaseData);

    res.json(
      monthlyData.map(m => ({
        date: m.mes,
        value: m.total,
      }))
    );
  } catch (error) {
    console.error('Get time series data error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de série temporal' });
  }
};

export const getAggregatedData = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    const categoryData = analyzeByCategory(purchaseData);

    res.json(
      categoryData.map(cat => ({
        name: cat.categoria,
        value: cat.total,
        count: cat.quantidade,
      }))
    );
  } catch (error) {
    console.error('Get aggregated data error:', error);
    res.status(500).json({ error: 'Erro ao agregar dados' });
  }
};

// Endpoint de correlação entre pacientes e gastos
export const getCorrelation = async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query;

    // Buscar dados de compras
    const sheetData = await getSheetData(range as string);
    const purchaseData = parsePurchaseData(sheetData.rows);

    // Buscar dados de pacientes
    const patients = await getPatientsData();

    // Calcular correlação
    const correlation = getCorrelationSummary(purchaseData, patients);

    res.json(correlation);
  } catch (error) {
    console.error('Get correlation error:', error);
    res.status(500).json({ error: 'Erro ao calcular correlação' });
  }
};

import { Router } from 'express';
import {
  getDashboardData,
  getMonthlyAnalysis,
  getCategoryAnalysis,
  getProjection,
  getTopProducts,
  getSeasonality,
  getChartData,
  getStatistics,
  getTimeSeriesData,
  getAggregatedData,
  getPatients,
  getProductAnalysis,
  getFilteredData,
  searchProductsEndpoint,
  getCategoriesEndpoint,
  getCorrelation,
} from '../controllers/dashboardController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Endpoint principal com todas as análises (incluindo pacientes)
router.get('/data', requirePermission('view_dashboard'), getDashboardData);

// Endpoints de análise
router.get('/monthly', requirePermission('view_dashboard'), getMonthlyAnalysis);
router.get('/category', requirePermission('view_dashboard'), getCategoryAnalysis);
router.get('/top-products', requirePermission('view_dashboard'), getTopProducts);
router.get('/seasonality', requirePermission('view_analytics'), getSeasonality);

// Endpoint de projeção
router.get('/projection', requirePermission('view_analytics'), getProjection);

// Novos endpoints de filtros e análise avançada
router.get('/patients', requirePermission('view_dashboard'), getPatients);
router.get('/product-analysis', requirePermission('view_analytics'), getProductAnalysis);
router.get('/filtered', requirePermission('view_dashboard'), getFilteredData);
router.get('/search-products', requirePermission('view_dashboard'), searchProductsEndpoint);
router.get('/categories', requirePermission('view_dashboard'), getCategoriesEndpoint);
router.get('/correlation', requirePermission('view_analytics'), getCorrelation);

// Endpoints antigos (compatibilidade)
router.get('/chart', requirePermission('view_dashboard'), getChartData);
router.get('/statistics', requirePermission('view_analytics'), getStatistics);
router.get('/timeseries', requirePermission('view_dashboard'), getTimeSeriesData);
router.get('/aggregated', requirePermission('view_analytics'), getAggregatedData);

export default router;

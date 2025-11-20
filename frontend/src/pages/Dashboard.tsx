import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../components/Layout';
import { dashboardAPI } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Novos estados para filtros e análise
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<any>(null);
  const [showProductAnalysis, setShowProductAnalysis] = useState(false);

  const [correlation, setCorrelation] = useState<any>(null);
  const [showCorrelation, setShowCorrelation] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategories.length > 0) {
      loadFilteredData();
    } else {
      loadDashboardData();
    }
  }, [selectedCategories]);

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts();
    } else {
      setProductSuggestions([]);
    }
  }, [productSearch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getData();
      setData(response);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await dashboardAPI.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadFilteredData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getFilteredData(selectedCategories);
      setData(response);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados filtrados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados filtrados');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      const results = await dashboardAPI.searchProducts(productSearch, 5);
      setProductSuggestions(results);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const handleProductSelect = async (product: string) => {
    try {
      setSelectedProduct(product);
      setProductSearch(product);
      setProductSuggestions([]);
      const analysis = await dashboardAPI.getProductAnalysis(product);
      setProductAnalysis(analysis);
      setShowProductAnalysis(true);
    } catch (err: any) {
      console.error('Erro ao analisar produto:', err);
      setError(err.response?.data?.error || 'Erro ao analisar produto');
    }
  };

  const loadCorrelation = async () => {
    try {
      const correlationData = await dashboardAPI.getCorrelation();
      setCorrelation(correlationData);
    } catch (err) {
      console.error('Erro ao carregar correlação:', err);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedCategories(options);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card bg-red-50 border border-red-200">
          <h3 className="text-red-800 font-semibold">Erro</h3>
          <p className="text-red-600">{error}</p>
          <button onClick={loadDashboardData} className="btn btn-primary mt-4">
            Tentar Novamente
          </button>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-900">Nenhum dado disponível</h3>
          <p className="text-gray-600 mt-2">
            Não foi possível carregar os dados da planilha.
          </p>
        </div>
      </Layout>
    );
  }

  const { stats, byMonth, byCategory, topProducts, seasonality, projection } = data;

  // Verificações de segurança
  if (!stats || !byMonth || !byCategory) {
    return (
      <Layout>
        <div className="card bg-yellow-50 border border-yellow-200">
          <h3 className="text-yellow-800 font-semibold">Dados incompletos</h3>
          <p className="text-yellow-600">Os dados da planilha estão incompletos. Verifique se a planilha está configurada corretamente.</p>
          <button onClick={loadDashboardData} className="btn btn-primary mt-4">
            Tentar Novamente
          </button>
        </div>
      </Layout>
    );
  }

  // Formatar valores monetários
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          📊 Dashboard de Análise e Projeção de Gastos
        </h1>

        {/* Filtros e Busca */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Filtro de Categorias */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🏷️ Filtrar por Categorias</h3>
            <select
              multiple
              value={selectedCategories}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="py-1">
                  {category}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Segure Ctrl (ou Cmd no Mac) para selecionar múltiplas categorias
            </p>
            {selectedCategories.length > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedCategories.length} categoria(s) selecionada(s)
                </span>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {/* Busca de Produtos */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🔍 Analisar Produto</h3>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Digite o nome do produto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {productSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {productSuggestions.map((product, index) => (
                    <button
                      key={index}
                      onClick={() => handleProductSelect(product.produto)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{product.produto}</div>
                      <div className="text-xs text-gray-500">{product.categoria}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProduct && (
              <button
                onClick={() => {
                  setShowProductAnalysis(!showProductAnalysis);
                }}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                {showProductAnalysis ? 'Ocultar análise' : 'Ver análise do produto'}
              </button>
            )}
          </div>
        </div>

        {/* Análise de Produto */}
        {showProductAnalysis && productAnalysis && (
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📦 Análise: {productAnalysis.produto}
              </h2>
              <button
                onClick={() => setShowProductAnalysis(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="text-lg font-bold text-gray-900">{productAnalysis.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Compras</p>
                <p className="text-lg font-bold text-gray-900">{productAnalysis.totalCompras}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-lg font-bold text-green-600">{formatMoney(productAnalysis.totalGasto)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Preço Médio</p>
                <p className="text-lg font-bold text-gray-900">{formatMoney(productAnalysis.precoMedio)}</p>
              </div>
            </div>
            {productAnalysis.projecao && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🔮 Projeção do Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Média Mensal</p>
                    <p className="text-md font-bold text-gray-900">{formatMoney(productAnalysis.projecao.mediaMensal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tendência</p>
                    <p className={`text-md font-bold ${productAnalysis.projecao.tendencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {productAnalysis.projecao.tendencia >= 0 ? '↗' : '↘'} {Math.abs(productAnalysis.projecao.tendencia)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Próximos 3 Meses</p>
                    <div className="text-xs mt-1">
                      {productAnalysis.projecao.projecoes.map((p: any) => (
                        <div key={p.mes} className="flex justify-between">
                          <span className="font-medium">{p.mes}:</span>
                          <span className="text-gray-600">{formatMoney(p.valorProjetado)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dados de Pacientes */}
        {data?.patients && (
          <div className="card bg-gradient-to-br from-cyan-50 to-blue-50 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              👥 Pacientes Atendidos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total de Pacientes</p>
                <p className="text-2xl font-bold text-blue-600">{data.patients.stats.totalPacientes.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Média Mensal</p>
                <p className="text-2xl font-bold text-gray-900">{data.patients.stats.mediaMensal.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Setores</p>
                <p className="text-2xl font-bold text-gray-900">{data.patients.stats.setores}</p>
              </div>
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.patients.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0ea5e9" name="Pacientes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Botão para Análise de Correlação */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (!showCorrelation && !correlation) {
                loadCorrelation();
              }
              setShowCorrelation(!showCorrelation);
            }}
            className="btn btn-primary w-full md:w-auto"
          >
            {showCorrelation ? '🔼 Ocultar Análise de Correlação' : '🔽 Ver Análise de Correlação (Gastos por Paciente)'}
          </button>
        </div>

        {/* Análise de Correlação */}
        {showCorrelation && correlation && (
          <div className="space-y-6 mb-6">
            {/* Resumo Geral */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                💰 Análise de Correlação: Gastos por Paciente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Média Geral por Paciente</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMoney(correlation.mediaGeralPorPaciente)}
                  </p>
                </div>
              </div>
            </div>

            {/* Análise de Elasticidade */}
            {correlation.elasticity && correlation.elasticity.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📊 Elasticidade: Correlação entre Atendimentos e Gastos
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Correlação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Elasticidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tendência
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Descrição
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {correlation.elasticity.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.categoria}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-bold ${
                              item.correlacao > 0.5 ? 'text-green-600' :
                              item.correlacao < -0.5 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {item.correlacao.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {item.elasticidade.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.tendencia === 'positiva' ? 'bg-green-100 text-green-800' :
                              item.tendencia === 'negativa' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.tendencia}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.descricao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {correlation.bySetor && correlation.bySetor.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🏥 Gastos por Setor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {correlation.bySetor.map((setor: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-900 mb-2">{setor.setor}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pacientes:</span>
                        <span className="font-medium">{setor.totalPacientes.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Gasto:</span>
                        <span className="font-medium text-green-600">{formatMoney(setor.totalGasto)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Por Paciente:</span>
                        <span className="font-bold text-blue-600">{formatMoney(setor.gastoPorPaciente)}</span>
                      </div>
                      {setor.gastosPorCategoria.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Top Categorias:</p>
                          {setor.gastosPorCategoria.slice(0, 3).map((cat: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 truncate mr-2">{cat.categoria}</span>
                              <span className="text-gray-900 font-medium">{formatMoney(cat.porPaciente)}/pac</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {correlation.byMonth && correlation.byMonth.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📅 Gastos por Mês
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mês
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pacientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Gasto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Gasto por Paciente
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {correlation.byMonth.filter((m: any) => m.totalPacientes > 0).map((mes: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {mes.mes}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {mes.totalPacientes.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            {formatMoney(mes.totalGasto)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-blue-600">
                            {formatMoney(mes.gastoPorPaciente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards de estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm opacity-90">Total Gasto</p>
            <p className="text-2xl font-bold mt-2">{formatMoney(stats.totalGasto)}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-90">Total de Compras</p>
            <p className="text-2xl font-bold mt-2">{stats.totalCompras.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-sm opacity-90">Ticket Médio</p>
            <p className="text-2xl font-bold mt-2">{formatMoney(stats.ticketMedio)}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-sm opacity-90">Unidades Compradas</p>
            <p className="text-2xl font-bold mt-2">{stats.totalUnidades.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Projeção de Gastos */}
        {projection && (
          <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🔮 Projeção de Gastos Futuros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Média Mensal</p>
                <p className="text-xl font-bold text-gray-900">{formatMoney(projection.mediaMensal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tendência</p>
                <p className={`text-xl font-bold ${projection.tendencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {projection.tendencia >= 0 ? '↗' : '↘'} {Math.abs(projection.tendencia)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Próximos Meses</p>
                <div className="text-sm mt-1">
                  {projection.projecoes.slice(0, 3).map((p: any) => (
                    <div key={p.mes} className="flex justify-between">
                      <span className="font-medium">{p.mes}:</span>
                      <span className="text-gray-600">{formatMoney(p.valorProjetado)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sazonalidade */}
        {seasonality && (
          <div className="card bg-blue-50 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🌡️ Análise de Sazonalidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mês de Maior Gasto</p>
                <p className="text-lg font-bold text-red-600">{seasonality.maiorGasto.mes}</p>
                <p className="text-sm text-gray-600">{formatMoney(seasonality.maiorGasto.valor)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mês de Menor Gasto</p>
                <p className="text-lg font-bold text-green-600">{seasonality.menorGasto.mes}</p>
                <p className="text-sm text-gray-600">{formatMoney(seasonality.menorGasto.valor)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Variação</p>
                <p className="text-lg font-bold text-gray-900">{seasonality.variacao}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Gastos Mensais */}
          {byMonth && byMonth.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📈 Gastos Mensais
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatMoney(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="Total"
                    dot={{ fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Categorias */}
          {byCategory && byCategory.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🏷️ Gastos por Categoria
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byCategory.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.categoria.substring(0, 15)}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {byCategory.slice(0, 10).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico de Barras - Comparativo de Categorias */}
        {byCategory && byCategory.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Comparativo por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => formatMoney(value)} />
                <Legend />
                <Bar dataKey="total" fill="#0ea5e9" name="Total Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top 10 Produtos Mais Caros */}
        {topProducts && topProducts.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              💰 Top 10 Produtos Mais Caros
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unidades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mês
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.map((product: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.produto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatMoney(product.valorTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unidades.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.mes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

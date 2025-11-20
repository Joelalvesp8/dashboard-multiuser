import { google } from 'googleapis';
import { GoogleSheetData } from '../types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '11hzxr3GFND1ihrd4t6-NyReacU1RaIxljzWxZXz2UxA';

// Método 1: Usando API Key (público, apenas leitura)
export const getSheetDataWithApiKey = async (range: string = '2025!A1:Z25000'): Promise<GoogleSheetData> => {
  try {
    const sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_API_KEY
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: range,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    return {
      headers,
      rows: dataRows
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw new Error('Erro ao buscar dados do Google Sheets');
  }
};

// Método 2: Usando Service Account (mais seguro, permite escrita)
export const getSheetDataWithServiceAccount = async (range: string = '2025!A1:Z25000'): Promise<GoogleSheetData> => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: range,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    return {
      headers,
      rows: dataRows
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw new Error('Erro ao buscar dados do Google Sheets');
  }
};

// Função auxiliar para converter dados em formato JSON
export const parseSheetToJson = (data: GoogleSheetData) => {
  const { headers, rows } = data;

  return rows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
};

// Função para análise de dados
export const analyzeSheetData = (jsonData: any[]) => {
  if (jsonData.length === 0) return null;

  // Identifica campos numéricos
  const numericFields = Object.keys(jsonData[0]).filter(key => {
    return jsonData.some(row => !isNaN(parseFloat(row[key])));
  });

  // Calcula estatísticas para campos numéricos
  const statistics: any = {};
  numericFields.forEach(field => {
    const values = jsonData
      .map(row => parseFloat(row[field]))
      .filter(val => !isNaN(val));

    if (values.length > 0) {
      statistics[field] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  });

  return {
    totalRecords: jsonData.length,
    fields: Object.keys(jsonData[0]),
    numericFields,
    statistics,
    sample: jsonData.slice(0, 5), // Primeiros 5 registros como amostra
  };
};

// Função principal que escolhe o método de autenticação
export const getSheetData = async (range: string = '2025!A1:Z25000'): Promise<GoogleSheetData> => {
  // Se tiver service account, usa ele (preferencial)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return getSheetDataWithServiceAccount(range);
  }

  // Caso contrário, usa API Key
  if (process.env.GOOGLE_API_KEY) {
    return getSheetDataWithApiKey(range);
  }

  throw new Error('Nenhuma credencial do Google configurada. Configure GOOGLE_API_KEY ou GOOGLE_SERVICE_ACCOUNT.');
};

import express from 'express';
import { spawn } from 'node:child_process';

try { process.loadEnvFile?.(); } catch {}

const app = express();
const port = Number(process.env.BACKEND_PORT || 4100);
const enableRealApi = process.env.ENABLE_REAL_API === 'true';
const sessions = new Map();
const submissions = new Map();
const otpBaseUri = process.env.OTP_BACKEND_BASE_URI || 'https://prod.cdri.cloud/api/v1/';
const otpProject = (process.env.OTP_PROJECT || 'SME').toUpperCase();

app.use(express.json({ limit: '1mb' }));

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'sme-ai-backend' });
});

app.get('/api/public/survey-template/:id', (request, response) => {
  response.json({
    id: request.params.id,
    title: '企業財務轉型需求診斷',
    version: 'standalone-v1',
  });
});

const GCIS_ENTITY_TYPE_API = 'https://data.gcis.nat.gov.tw/od/data/api/673F0FC0-B3A7-429F-9041-E9866836B66D';
const GCIS_COMPANY_API = 'https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6';
const GCIS_BUSINESS_AGENCY_API = 'https://data.gcis.nat.gov.tw/od/data/api/426D5542-5F05-43EB-83F9-F1300F14E1F1';
const GCIS_BUSINESS_CAPITAL_API = 'https://data.gcis.nat.gov.tw/od/data/api/7E6AFA72-AD6A-46D3-8681-ED77951D912D';

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const result = await fetch(url, { signal: controller.signal });
    if (!result.ok) return null;
    return await result.json();
  } finally {
    clearTimeout(timeout);
  }
};

const companyData = (company) => ({
  businessAccountingNo: company.Business_Accounting_NO,
  companyName: company.Company_Name,
  companyStatusDesc: company.Company_Status_Desc,
  capitalAmount: company.Capital_Stock_Amount ?? null,
  companyAddress: company.Company_Location ?? '',
  responsibleName: company.Responsible_Name || null,
  entityType: 'company',
});

const businessData = (item, capital = null) => ({
  businessAccountingNo: item.President_No,
  companyName: capital?.Business_Name || item.Business_Name,
  companyStatusDesc: capital?.Business_Current_Status_Desc || item.Business_Current_Status_Desc,
  capitalAmount: capital?.Business_Register_Funds ?? null,
  companyAddress: capital?.Business_Address || item.Business_Address || '',
  responsibleName: capital?.Responsible_Name || null,
  entityType: 'business',
});

async function lookupCompany(taxId) {
  const filter = encodeURIComponent(taxId);
  const entityRows = await fetchJson(`${GCIS_ENTITY_TYPE_API}?$format=json&$filter=No%20eq%20${filter}&$skip=0&$top=50`);
  const entity = Array.isArray(entityRows) ? entityRows.find((item) => item.exist === 'Y') : null;
  const entityType = entity?.TYPE === '商業' ? 'business' : 'company';

  if (entityType === 'company') {
    const rows = await fetchJson(`${GCIS_COMPANY_API}?$format=json&$filter=Business_Accounting_NO%20eq%20${filter}&$skip=0&$top=50`);
    if (Array.isArray(rows) && rows[0]) return companyData(rows[0]);
  }

  const agencyRows = await fetchJson(`${GCIS_BUSINESS_AGENCY_API}?$format=json&$filter=President_No%20eq%20${filter}&$skip=0&$top=50`);
  if (!Array.isArray(agencyRows) || !agencyRows[0]) return null;
  const agency = agencyRows[0].Agency;
  if (!agency) return businessData(agencyRows[0]);

  const capitalRows = await fetchJson(`${GCIS_BUSINESS_CAPITAL_API}?$format=json&$filter=President_No%20eq%20${filter}%20and%20Agency%20eq%20${encodeURIComponent(agency)}&$skip=0&$top=50`);
  return businessData(agencyRows[0], Array.isArray(capitalRows) ? capitalRows[0] : null);
}

app.get('/api/company/:taxId', async (request, response) => {
  const { taxId } = request.params;
  if (!/^\d{8}$/.test(taxId)) return response.status(400).json({ message: '統一編號必須是 8 碼數字。' });
  if (!enableRealApi) return response.json({ businessAccountingNo: taxId, companyName: '測試示範股份有限公司', responsibleName: '王小明', companyAddress: '臺北市中正區測試路 1 號', capitalAmount: 10000000, entityType: 'company' });
  try {
    const company = await lookupCompany(taxId);
    if (!company) return response.status(404).json({ message: '查無公司資料，請自行填寫。' });
    return response.json(company);
  } catch (error) {
    const message = error?.name === 'AbortError' ? '公司資料查詢逾時。' : '公司資料查詢失敗，請稍後再試。';
    return response.status(502).json({ message });
  }
});

const fetchOtp = async (action, fields) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const endpoint = `${otpBaseUri.replace(/\/$/, '')}/${action === 'generate' ? 'generateOTP' : 'verifyOTP'}/${otpProject}`;
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
      signal: controller.signal,
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok) {
      const error = new Error(data.detail || data.message || '驗證碼服務暫時無法使用。');
      error.status = result.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

app.post('/api/public/otp', async (request, response) => {
  const { action } = request.query;
  const { email, username, otp } = request.body ?? {};

  if (!email || typeof email !== 'string') {
    return response.status(400).json({ message: '電子信箱為必填欄位。' });
  }

  if (action === 'generate') {
    if (!username || typeof username !== 'string') {
      return response.status(400).json({ message: '聯絡人姓名為必填欄位。' });
    }
    if (!enableRealApi) {
      sessions.set(email, { verified: false, testOtp: '123456', expiresAt: Date.now() + 600000 });
      return response.json({ sent: true, message: '測試模式驗證碼為 123456。' });
    }
    try {
      const data = await fetchOtp('generate', { email, username });
      sessions.set(email, { verified: false, expiresAt: Date.now() + 600000 });
      return response.json({ sent: true, message: data.message || '驗證碼已寄出。' });
    } catch (error) {
      return response.status(error.status || 502).json({ message: error.message || '驗證碼寄送失敗，請稍後再試。' });
    }
  }

  if (action === 'verify') {
    const session = sessions.get(email);
    if (!session || session.expiresAt < Date.now()) {
      return response.status(401).json({ message: '驗證碼已過期，請重新寄送。' });
    }
    if (!otp || typeof otp !== 'string') {
      return response.status(400).json({ message: '請輸入驗證碼。' });
    }
    if (!enableRealApi) {
      if (otp !== session.testOtp) return response.status(401).json({ message: '測試模式驗證碼錯誤，請輸入 123456。' });
      session.verified = true;
      return response.json({ verified: true });
    }
    try {
      await fetchOtp('verify', { email, otp });
    } catch (error) {
      return response.status(error.status || 502).json({ message: error.message || '驗證碼驗證失敗，請稍後再試。' });
    }
    session.verified = true;
    return response.json({ verified: true });
  }

  return response.status(400).json({ message: '請提供有效的 OTP action。' });
});

app.post('/api/public/homepage-survey', (request, response) => {
  if (!enableRealApi) return response.status(201).json({ id: `test-sme-${Date.now()}`, message: '測試問卷提交成功。' });
  const { email } = request.body ?? {};
  const session = email ? sessions.get(email) : null;
  if (!session?.verified) {
    return response.status(401).json({ message: '請先完成電子信箱驗證。' });
  }

  const id = `sme-${Date.now()}`;
  submissions.set(id, { id, ...request.body, createdAt: new Date().toISOString() });
  sessions.delete(email);
  return response.status(201).json({ id, message: '問卷提交成功。' });
});

app.post('/api/public/report.pdf', (request, response) => {
  const report = request.body;
  if (!report || report.status !== 'completed') {
    return response.status(400).json({ message: '尚未有可匯出的完成問卷資料。' });
  }
  const generator = spawn(process.env.PYTHON_BIN || 'python3', [new URL('./report-generator.py', import.meta.url).pathname]);
  const chunks = [];
  let errorOutput = '';
  generator.stdout.on('data', (chunk) => chunks.push(chunk));
  generator.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
  generator.on('error', (error) => response.status(500).json({ message: `PDF 產製失敗：${error.message}` }));
  generator.on('close', (code) => {
    if (code !== 0) return response.status(500).json({ message: errorOutput || 'PDF 產製失敗。' });
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="sme-ai-report-${report.id || Date.now()}.pdf"`);
    return response.send(Buffer.concat(chunks));
  });
  generator.stdin.end(JSON.stringify(report));
});

app.delete('/api/public/homepage-survey', (request, response) => {
  if (request.body?.email) sessions.delete(request.body.email);
  return response.json({ success: true });
});

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`SME AI backend listening on http://localhost:${port}`);
  });
}

export default app;

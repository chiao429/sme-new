const API_BASE = window.__SME_API_BASE__ || '/api';
const PROJECT = 'SME';

const extractErrorMessage = (value) => {
  if (typeof value === 'string') return value.trim() || null;
  if (!value || typeof value !== 'object') return null;
  return ['reason', 'detail', 'details', 'message', 'error']
    .map((key) => extractErrorMessage(value[key]))
    .find(Boolean) || null;
};

const requestJson = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractErrorMessage(data) || `API 請求失敗（${response.status}）`);
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('API 請求逾時，請稍後再試。');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const fetchPublicSurveyTemplate = () =>
  requestJson(`/public/survey-template/${encodeURIComponent('SMBusiness')}`);

export const lookupCompany = (taxId) =>
  requestJson(`/company/${encodeURIComponent(taxId)}`, { headers: {} });

export const generateOtp = (email, username = email) =>
  requestJson(`/public/otp?action=generate&project=${PROJECT}`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), username: username.trim() }),
  });

export const verifyOtp = (email, otp) =>
  requestJson(`/public/otp?action=verify&project=${PROJECT}`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
  });

export const submitHomepageSurvey = async (data) => {
  let submissionData = data;
  try {
    const template = await fetchPublicSurveyTemplate();
    if (template.id) submissionData = { ...data, from_template: template.id };
  } catch {
    // Keep the loaded template data if refreshing the template fails.
  }
  return requestJson('/public/homepage-survey', {
    method: 'POST',
    body: JSON.stringify(submissionData),
  });
};

export const clearHomepageSurveySession = () =>
  requestJson('/public/homepage-survey', { method: 'DELETE' });

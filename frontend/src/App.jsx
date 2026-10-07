import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ListFilter } from 'lucide-react';
import { ReceiptIcon, FileTextIcon, ArrowsClockwiseIcon, CreditCardIcon, ChartLineUpIcon, CloudIcon, ChatCircleTextIcon, ShieldCheckIcon, CubeIcon, RobotIcon, PackageIcon, StorefrontIcon, FactoryIcon, BuildingsIcon, BookOpenTextIcon, FileXlsIcon, ClipboardTextIcon, ScalesIcon, ShoppingCartIcon, ChartBarIcon, FileMagnifyingGlassIcon, BankIcon, TrendUpIcon, WrenchIcon, CalculatorIcon, ToolboxIcon, SignpostIcon } from '@phosphor-icons/react';
import { selfDiagnosisConfig } from './config/self-diagnosis.config.js';

const API = window.__BACKEND_URL__ || 'http://localhost:4100';
const steps = [
  ['開始說明', '企業財務轉型輔導需求表'], ['產業分類', '請選擇貴公司所屬的產業類別'],
  ['個資同意', '個人資料蒐集、處理及利用同意書'], ['基本資料與身分驗證', '請填寫基本資料並驗證電子郵件'],
  ['自我診斷', '請依照目前狀況完成自我診斷量表'], ['完成', '問卷填寫完成'],
];
const industries = [['manufacturing', '製造業', '生產、加工、物料、庫存、供應鏈為主'], ['service', '服務業', '餐飲、零售、門市、專業服務或平台型態']];
const diagnosisGroups = selfDiagnosisConfig.groups;
const initialBasicInfo = { taxId: '', companyName: '', responsible: '', contactName: '', title: '', phone: '', address: '', capital: '', products: '', introduction: '', email: '' };
const DRAFT_KEY = 'sme-ai-public-survey-draft';
const REPORT_CACHE_KEY = 'sme-ai-public-survey-report-cache';
const CALCULATOR_KEY = 'sme-ai-calculator-draft';
const DEMO_OTP = '123456';
const basicFieldHints = {
  companyName: '請確認公司正式登記名稱。',
  taxId: '輸入 8 碼統一編號後，按「查詢公司」才會帶入資料；也可以直接手動填寫。',
  responsible: '可由公司資料查詢結果自動帶入。',
  contactName: '請填寫後續聯繫窗口。',
  title: '例如：負責人、經理、主任。',
  phone: '請填寫方便聯繫的電話或手機。',
  address: '可由公司資料查詢結果自動帶入。',
  capital: '單位為新台幣，可由公司資料查詢結果自動帶入。',
};
const mockCompanyData = (taxId) => ({
  businessAccountingNo: taxId,
  companyName: '示範科技股份有限公司',
  responsibleName: '王小明',
  companyAddress: '臺北市中正區示範路 1 號',
  capitalAmount: 10000000,
});
const toolCatalog = [
  ['企業單據辨識系統', '九創國際科技', '辨識發票、費用單據，將單據轉為結構化資料', '約 1.2 萬 / 年', ['OCR', '可獨立導入']],
  ['單據 OCR 模組', '精益科技', '辨識支票、發票與各式文件', '每種模組約 3,000', ['OCR', '可獨立導入']],
  ['RPA + AI 自動化', '伊斯酷', '自動下載對帳單、對帳、沖銷與產出財報', '專案報價', ['帳務', '可獨立導入']],
  ['COMMEET 費用管理', '撰樂數據', '拍照報銷、費用雙表板、AI 合規檢查', '每人每月 480 起', ['帳務', '可獨立導入']],
  ['Genie CFO', '行動貝果', '現金流、應收帳款、跨墊點財務分析', '約 10 萬 / 年', ['分析', '可獨立導入']],
  ['雲端財會系統', '財報雲', '拍照記帳、自動佈傳票、資金對帳', '399 / 月起', ['帳務', '完整財會軟體']],
  ['AI 財會助理', '思邁智能', '用自然語言查詢財務數據與報表', '40 萬 / 年以下', ['分析', '專案導入']],
  ['AI 智慧稽核', '傑克商業自動化', '24/7 自動檢查異常交易與重複付款', '1,500 / 90 天起', ['風險', '可獨立導入']],
  ['Business Central + Copilot', 'Dynamics 365 BC', '自動對帳、採購、庫存、預測與情境模擬', '3,535 / 人 / 月起', ['營運', 'ERP 整合']],
  ['ERP AI 模組', '銓陽系統整合', '單據辨識、詢價、比價與採購自動化', '5,000 / 模組 / 月起', ['營運', '需搭配 ERP']],
  ['AI 智慧庫存', '天冠資訊', '智慧庫存與補貨建議', '洽業者', ['營運', '需搭配既有系統']],
  ['餐飲 POS／LINE 整合', '穩旭兄弟', 'POS、外送、金流、發票與損益整合', '800–1,200 / 月', ['帳務', '餐飲業']],
];
const toolIcons = {
  '企業單據辨識系統': ReceiptIcon,
  '單據 OCR 模組': FileTextIcon,
  'RPA + AI 自動化': ArrowsClockwiseIcon,
  'COMMEET 費用管理': CreditCardIcon,
  'Genie CFO': ChartLineUpIcon,
  '雲端財會系統': CloudIcon,
  'AI 財會助理': ChatCircleTextIcon,
  'AI 智慧稽核': ShieldCheckIcon,
  'Business Central + Copilot': CubeIcon,
  'ERP AI 模組': RobotIcon,
  'AI 智慧庫存': PackageIcon,
  '餐飲 POS／LINE 整合': StorefrontIcon,
};
const finderOptionIcons = [
  [FactoryIcon, StorefrontIcon],
  [BookOpenTextIcon, FileXlsIcon, BuildingsIcon, BankIcon],
  [ReceiptIcon, ScalesIcon, ShoppingCartIcon, ChartBarIcon],
  [FileMagnifyingGlassIcon, ClipboardTextIcon, ArrowsClockwiseIcon, PackageIcon, TrendUpIcon],
];
const onboardingStages = [['整理資料', '確認資料可用、格式一致。'], ['盤點流程', '確認要接 ERP、POS、銀行或 Excel。'], ['先做 PoC', '從最容易成功的工具測試。'], ['小範圍試用', '先從部門、門市或單一流程開始。'], ['顧好資安', '權限、法遵與人員覆核同步做。'], ['讓大家會用', '教育訓練、SOP、FAQ 都要準備。'], ['持續改善', '追蹤工時、準確率與實際成效。']];
const onboardingTips = [[ShieldCheckIcon, '公司資料不要亂貼', '客戶資料、帳號、薪資等重要資料，不要直接貼到公開 AI。'], [RobotIcon, 'AI 算完要有人再看', '金額、付款、報表等重要結果，都要再由人確認一次。'], [ClipboardTextIcon, '做過什麼要留紀錄', '誰用了 AI、改了什麼、最後怎麼決定，都要查得到。'], [ArrowsClockwiseIcon, '資料要能帶走', '後換系統時，資料要能下載帶走，不會卡在原本的系統裡。']];
const finderPages = [
  { title: '你的公司比較接近哪一種？', hint: '點一下就好，後面的情境會跟著調整。', options: [['製造業', '生產、加工、物料、庫存、供應鏈為主'], ['服務業', '餐飲、零售、門市、專業服務或平台型態']] },
  { title: '你們現在怎麼管帳？', hint: '選最接近的就好，不需要完全符合。', options: [['都交給記帳士', '公司自己只有簡單收支、訂單或 Excel'], ['主要靠 Excel', '收支、應收應付、報表大多自己整理'], ['已有財會系統', '但輸入、對帳或分析還有人工作業'], ['ERP／POS 都有了', '現在更想提升預測、分析與自動化']] },
  { title: '你最想先改善哪一種問題？', hint: '可以選一個最有感的痛點。', options: [['單據與發票整理', '減少登打、辨識與歸檔時間'], ['對帳與費用管理', '降低人工核對與錯誤'], ['庫存與採購分析', '掌握存貨、補貨與採購決策'], ['報表與財務分析', '更快得到可用的管理資訊']] },
  { title: '想優先看看哪些工具？', hint: '最多選 3 個，完成後再看看推薦結果。', multi: true, options: [['AI OCR／單據辨識', '發票、收據與 PDF 自動轉資料'], ['費用與報銷管理', '拍照報銷、審核與費用分析'], ['對帳與流程自動化', '銀行、ERP 與 Excel 流程串接'], ['庫存／採購智慧化', '補貨建議、預測與採購分析'], ['財務 AI 助理', '用自然語言查詢報表與數據']] },
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || '操作失敗，請稍後再試。');
  return data;
}

function loadDraft() {
  try {
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null');
    return draft && typeof draft === 'object' ? draft : {};
  } catch {
    return {};
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [draft] = useState(loadDraft);
  const [step, setStep] = useState(() => Number.isInteger(draft.step) ? draft.step : 0);
  const [industry, setIndustry] = useState(() => draft.industry || '');
  const [consent, setConsent] = useState(() => Boolean(draft.consent));
  const [basicInfo, setBasicInfo] = useState(() => ({ ...initialBasicInfo, ...(draft.basicInfo || {}) }));
  const [companyLookup, setCompanyLookup] = useState({ loading: false, message: '' });
  const autoFilledValues = useRef({});
  const [otp, setOtp] = useState({ sent: false, code: '', verified: false, cooldown: 0 });
  const [diagnosis, setDiagnosis] = useState({});
  const [diagnosisPanel, setDiagnosisPanel] = useState(0);
  const [diagnosisPanelDirection, setDiagnosisPanelDirection] = useState('forward');
  const [result, setResult] = useState(null);
  const [reportAvailable, setReportAvailable] = useState(() => Boolean(window.localStorage.getItem(REPORT_CACHE_KEY)));
  const [toast, setToast] = useState('');
  const [view, setView] = useState('survey');
  const [showMethodology, setShowMethodology] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [toolType, setToolType] = useState('全部類型');
  const [finderPage, setFinderPage] = useState(0);
  const [finderAnswers, setFinderAnswers] = useState({});
  const [finderMode, setFinderMode] = useState(false);
  const [calculator, setCalculator] = useState(() => { try { return { people: 2, salary: 45000, hours: 25, efficiency: 50, cost: 50000, ...JSON.parse(window.localStorage.getItem(CALCULATOR_KEY) || '{}') }; } catch { return { people: 2, salary: 45000, hours: 25, efficiency: 50, cost: 50000 }; } });
  const clearingDraft = useRef(false);
  const progress = step === 0 ? 0 : Math.min(step / 5, 1);
  const currentStep = steps[step];
  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/';
    if (pathname === '/calculator') {
      setView('calculator');
      setFinderMode(false);
    } else if (pathname === '/tools') {
      setView('tools');
      setFinderMode(false);
    } else if (pathname === '/onboarding') {
      setView('onboarding');
      setFinderMode(false);
    } else if (pathname === '/find-tools') {
      setView('survey');
      setFinderMode(true);
      setStep((previous) => previous || 1);
    } else if (pathname === '/self-diagnosis') {
      setView('survey');
      setFinderMode(false);
      setStep((previous) => previous || 1);
    } else {
      setView('survey');
      setFinderMode(false);
      setStep(0);
    }
  }, [location.pathname]);
  const setBasicField = (key, value) => setBasicInfo((previous) => ({ ...previous, [key]: value }));
  const handleTaxIdChange = (value) => {
    setBasicInfo((previous) => {
      const next = { ...previous, taxId: value };
      Object.entries(autoFilledValues.current).forEach(([key, autoValue]) => {
        if (next[key] === autoValue) next[key] = '';
      });
      return next;
    });
    autoFilledValues.current = {};
    setCompanyLookup({ loading: false, message: value ? '統一編號變更，請稍候重新查詢公司資料。' : '' });
  };
  const handleBasicField = (key, value) => {
    setBasicField(key, value);
    if (key === 'email') setOtp({ sent: false, code: '', verified: false, cooldown: 0 });
  };
  const validateBasicInfo = () => {
    if (!/^\d{8}$/.test(basicInfo.taxId)) return '請輸入 8 碼統一編號，系統才能查詢公司資料。';
    if (!basicInfo.companyName.trim()) return '請填寫公司名稱；查無公司資料時也可以手動輸入。';
    if (!basicInfo.contactName.trim()) return '請填寫聯絡人姓名，方便後續聯繫。';
    if (!/^\S+@\S+\.\S+$/.test(basicInfo.email)) return '請輸入格式正確的電子郵件地址。';
    return '';
  };
  const notify = (message) => { setToast(message); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(''), 2600); };
  const saveDraft = () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, industry, consent, basicInfo, savedAt: new Date().toISOString() }));
    notify('已暫存目前填寫資料。');
  };
  const clearDiagnosis = () => {
    setBasicInfo(initialBasicInfo);
    setCompanyLookup({ loading: false, message: '' });
    autoFilledValues.current = {};
    setOtp({ sent: false, code: '', verified: false, cooldown: 0 });
    notify('已清除第 3／5 步的公司資料與 Email 驗證。');
  };
  const exportReport = async () => {
    const cachedReport = window.localStorage.getItem(REPORT_CACHE_KEY);
    if (!cachedReport) return notify('目前沒有可匯出的完成問卷資料。');
    try {
      const report = { ...JSON.parse(cachedReport), calculator, calculation };
      const response = await fetch(`${API}/api/public/report.pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'PDF 報表產製失敗。');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sme-ai-report-${report.id || Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      notify('PDF 報表已下載。');
    } catch (error) {
      notify(error.message || 'PDF 報表產製失敗。');
    }
  };
  const updateCalculator = (key, value) => setCalculator((previous) => ({ ...previous, [key]: Number(value) }));
  const calculation = (() => {
    const rate = (calculator.salary * 12) / 2080;
    const savedHours = calculator.people * calculator.hours * (calculator.efficiency / 100) * 12;
    const saving = savedHours * rate;
    const roi = calculator.cost ? ((saving - calculator.cost) / calculator.cost) * 100 : 0;
    const payback = saving ? calculator.cost / (saving / 12) : 0;
    return { rate, savedHours, saving, roi, payback };
  })();
  useEffect(() => { window.localStorage.setItem(CALCULATOR_KEY, JSON.stringify(calculator)); }, [calculator]);
  const goTo = (nextStep) => {
    if (!finderMode && nextStep === 0 && location.pathname !== '/') navigate('/');
    if (!finderMode && nextStep > 0 && location.pathname === '/') navigate('/self-diagnosis');
    setStep(nextStep);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  useEffect(() => {
    if (!otp.cooldown) return undefined;
    const timer = window.setInterval(() => setOtp((previous) => ({ ...previous, cooldown: Math.max(previous.cooldown - 1, 0) })), 1000);
    return () => window.clearInterval(timer);
  }, [otp.cooldown]);

  useEffect(() => {
    if (clearingDraft.current) {
      clearingDraft.current = false;
      return;
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, industry, consent, basicInfo, savedAt: new Date().toISOString() }));
  }, [step, industry, consent, basicInfo]);

  useEffect(() => {
    if (step !== 5) return;
    const firstIncomplete = diagnosisGroups.findIndex((group) => group.questions.some((question) => !diagnosis[question.id]));
    setDiagnosisPanel(firstIncomplete === -1 ? diagnosisGroups.length - 1 : firstIncomplete);
  }, [step]);

  useEffect(() => {
    const exportButton = document.querySelector('.header-actions .navy-button');
    if (exportButton) {
      exportButton.disabled = !reportAvailable;
      exportButton.title = reportAvailable ? '匯出已完成問卷報告' : '完成問卷後才能匯出報告';
    }
  }, [reportAvailable, view]);

  useEffect(() => {
    const finderButton = document.querySelector('.finder-nav-button');
    finderButton?.classList.toggle('active', finderMode);
    const exportButton = document.querySelector('.header-actions .navy-button');
    if (exportButton) exportButton.style.display = (view === 'calculator' || (view === 'survey' && step !== 5 && !finderMode)) ? '' : 'none';
    const floatingActions = document.querySelector('.floating-actions');
    if (floatingActions) floatingActions.style.display = view === 'survey' && step > 0 && !finderMode ? '' : 'none';
    const heroProgress = document.querySelector('.hero-progress');
    if (heroProgress) heroProgress.style.display = finderMode || (step === 0 && view === 'survey') ? 'none' : '';
    const heroStart = document.querySelector('.hero-start');
    if (heroStart) heroStart.style.display = step === 0 && view === 'survey' ? 'none' : '';
    const heroEyebrow = document.querySelector('.hero > .eyebrow');
    if (heroEyebrow) heroEyebrow.style.display = step === 0 && view === 'survey' ? 'none' : '';
    const heroDescription = document.querySelector('.hero > p');
    if (heroDescription && step === 0 && view === 'survey') heroDescription.textContent = '透過 AI 財務工具互動指引，快速了解企業目前的數位轉型需求，找到適合優先改善的方向。';
    const surveyHero = document.querySelector('.hero');
    if (surveyHero) surveyHero.style.display = finderMode ? 'none' : '';
    const surveyHeading = document.querySelector('.survey-section > .section-heading');
    if (surveyHeading) surveyHeading.style.display = finderMode ? 'none' : '';
    const surveySection = document.querySelector('.survey-section');
    if (surveySection) surveySection.style.paddingTop = finderMode ? '0' : '';
  }, [finderMode, step, view]);

  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero || view !== 'survey' || step !== 0 || finderMode) return undefined;
    const banner = document.createElement('img');
    banner.className = 'home-banner';
    banner.src = '/banner.png';
    banner.alt = 'AI 財務工具互動指引';
    hero.appendChild(banner);
    return () => banner.remove();
  }, [finderMode, step, view]);

  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    footer.innerHTML = '<div class="footer-organizations"><section><h3>主辦單位</h3><a class="footer-organization-link" href="https://www.sme.gov.tw/" target="_blank" rel="noreferrer"><img src="/sme-gov-logo.png" alt="經濟部中小及新創企業署" /></a></section><section><h3>執行單位</h3><a class="footer-organization-link" href="https://www.cdri.org.tw/" target="_blank" rel="noreferrer"><img src="/cdri-logo.png" alt="商業發展研究院" /></a><p>臺北市大安區復興南路一段303號4樓<br />02-7707-4800</p></section></div><div class="footer-copyright">本工具僅供示範、探索與內部評估，不代表任何主管機關或計畫之推薦、認證或背書。<br />資料來源為公開資訊，產品功能與價格請以廠商最新公告為準。<br />請勿輸入客戶、帳號、財務或其他未公開之敏感資料。<br />© 2026 本工具內容保留所有權利｜未經授權不得重製、改作或作為對外商業宣稱。</div>';
  }, []);

  useEffect(() => {
    if (step !== 5 || diagnosisPanel !== 0) return undefined;
    const actions = document.querySelector('.diagnosis-panel-actions');
    if (!actions || actions.querySelector('.back-basic-button')) return undefined;
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'back-button back-basic-button';
    backButton.textContent = '← 返回';
    backButton.addEventListener('click', () => goTo(4));
    actions.prepend(backButton);
    return () => backButton.remove();
  }, [step, diagnosisPanel]);

  const lookupCompany = () => {
    const taxId = basicInfo.taxId;
    if (!/^\d{8}$/.test(taxId)) {
      setCompanyLookup({ loading: false, message: '請先輸入完整 8 碼統一編號，再按「查詢公司」。' });
      return notify('統一編號必須是 8 碼數字。');
    }
    const company = mockCompanyData(taxId);
    setBasicInfo((previous) => ({
      ...previous,
      companyName: company.companyName,
      responsible: company.responsibleName,
      address: company.companyAddress,
      capital: String(company.capitalAmount),
      email: previous.email,
    }));
    autoFilledValues.current = Object.fromEntries([
      ['companyName', company.companyName],
      ['responsible', company.responsibleName],
      ['address', company.companyAddress],
      ['capital', String(company.capitalAmount)],
    ]);
    setCompanyLookup({ loading: false, message: '前端示範資料已帶入（未呼叫後端），請確認後繼續填寫。' });
  };

  const sendOtp = () => {
    if (!/^\S+@\S+\.\S+$/.test(basicInfo.email)) return notify('請先填寫格式正確的電子郵件。');
    if (!basicInfo.contactName.trim()) return notify('請先填寫聯絡人姓名。');
    if (otp.cooldown) return;
    setOtp((previous) => ({ ...previous, sent: true, verified: false, code: '', cooldown: 60 }));
    notify(`前端示範驗證碼：${DEMO_OTP}`);
  };
  const verifyOtp = () => {
    if (otp.code !== DEMO_OTP) return notify('驗證碼錯誤，請輸入前端示範驗證碼 123456。');
    setOtp((previous) => ({ ...previous, verified: true }));
    notify('電子郵件驗證完成（前端示範）。');
  };
  const diagnosisComplete = diagnosisGroups.every((group) => group.questions.every((question) => diagnosis[question.id]));
  const submit = (diagnosisAnswers = diagnosis) => {
    const diagnosisQa = diagnosisGroups.flatMap((group) => group.questions.map((question) => ({ formId: group.formId, question: question.text, answer: diagnosisAnswers[question.id] })));
    const qa = [{ formId: '1', question: '產業分類', answer: industry }, { formId: '2', question: '個資同意', answer: 1 }, ...Object.entries(basicInfo).map(([question, answer]) => ({ formId: '3', question, answer })), ...diagnosisQa];
    const reportId = `demo-sme-${Date.now()}`;
    const reportData = { id: reportId, status: 'completed', completedAt: new Date().toISOString(), title: basicInfo.companyName, industry, basicInfo, diagnosis: diagnosisAnswers, diagnosisGroups, qa, calculator, calculation };
    window.localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(reportData));
    setReportAvailable(true);
    setResult({ id: reportId, message: '已完成問卷（前端示範）' });
    goTo(5);
  };
  const handleDiagnosisAnswer = (questionId, value) => {
    const nextDiagnosis = { ...diagnosis, [questionId]: value };
    setDiagnosis(nextDiagnosis);
    const group = diagnosisGroups[diagnosisPanel];
    if (diagnosisPanel < diagnosisGroups.length - 1 && group.questions.every((question) => nextDiagnosis[question.id])) {
      window.setTimeout(() => moveDiagnosisPanel(diagnosisPanel + 1), 250);
    }
  };
  const reset = () => { setStep(0); setIndustry(''); setConsent(false); setBasicInfo(initialBasicInfo); setCompanyLookup({ loading: false, message: '' }); autoFilledValues.current = {}; setOtp({ sent: false, code: '', verified: false, cooldown: 0 }); setDiagnosis({}); setResult(null); setReportAvailable(Boolean(window.localStorage.getItem(REPORT_CACHE_KEY))); };
  const handleBasicNext = () => {
    const message = validateBasicInfo();
    if (message) return notify(message);
    if (!otp.verified) return notify('請先完成電子郵件驗證。');
    goTo(4);
  };
  const moveDiagnosisPanel = (nextPanel) => {
    setDiagnosisPanelDirection(nextPanel > diagnosisPanel ? 'forward' : 'backward');
    setDiagnosisPanel(nextPanel);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const renderStep = () => {
    if (finderMode) return <FinderView onTools={() => navigate('/tools')} />;
    if (step === 0) return <div className="intro-card"><div className="eyebrow">公開問卷</div><h3>填寫數位成熟度自我診斷評估表</h3><p>透過幾個問題了解企業目前的營運現況與數位轉型需求，作答時間約五到十分鐘。</p><div className="info-callout">本評量建議由公司具決策權之高階主管填寫，便於評估公司營運現況與轉型策略。</div><button className="orange-button" type="button" onClick={() => goTo(1)}>開始測驗 →</button></div>;
    if (step === 1) return <><div className="choice-grid two">{industries.map(([value, title, description]) => { const IndustryIcon = value === 'manufacturing' ? FactoryIcon : StorefrontIcon; return <button className={`choice-card ${industry === value ? 'selected' : ''}`} type="button" key={value} onClick={() => setIndustry(value)}><span className="line-icon" aria-hidden="true"><IndustryIcon weight="regular" /></span><strong>{title}</strong><small>{description}</small></button>; })}</div><StepActions onBack={() => goTo(0)} onNext={() => industry ? goTo(2) : notify('請先選擇產業類別。')} /></>;
    if (step === 2) return <div className="consent-card"><p>為提供企業財務轉型輔導與後續聯繫，本計畫將蒐集您填寫的公司及聯絡資料，並依個人資料保護法及相關規定進行處理與利用。</p><p>資料僅供本計畫業務使用，不會在未經同意的情況下提供給無關第三方。</p><label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> 我已閱讀並同意上述個人資料蒐集、處理及利用內容</label><StepActions onBack={() => goTo(1)} onNext={() => consent ? goTo(3) : notify('請先勾選同意。')} /></div>;
    if (step === 3) return <><div className="form-grid">{[['taxId','統一編號','8 碼統一編號'],['companyName','公司名稱','公司或商號名稱'],['responsible','負責人','負責人姓名'],['contactName','聯絡人','聯絡人姓名'],['title','職稱','聯絡人職稱'],['phone','聯絡電話','電話或手機'],['address','地址','公司地址'],['capital','資本額','資本額']].map(([key, label, placeholder]) => <label key={key}><span className="field-label">{label}{(key === 'taxId' || key === 'email') && <em className="required-mark">必填</em>}</span>{key === 'taxId' ? <div className="input-row"><input value={basicInfo[key]} placeholder={placeholder} aria-describedby="tax-id-hint" aria-invalid={basicInfo.taxId.length > 0 && basicInfo.taxId.length !== 8} onChange={(event) => handleTaxIdChange(event.target.value.replace(/\D/g, '').slice(0, 8))} /><button className="lookup-button" type="button" disabled={companyLookup.loading} onClick={lookupCompany}>{companyLookup.loading ? '查詢中…' : '查詢公司'}</button></div> : <input type={key === 'email' ? 'email' : undefined} value={basicInfo[key]} placeholder={placeholder} aria-invalid={key === 'email' && basicInfo.email.length > 0 && !/^\S+@\S+\.\S+$/.test(basicInfo.email)} onChange={(event) => handleBasicField(key, event.target.value)} />}{basicFieldHints[key] && <small id={key === 'taxId' ? 'tax-id-hint' : undefined} className="field-hint">{basicFieldHints[key]}</small>}</label>)}<div className="email-verification-row full"><label className="email-field"><span className="field-label">負責人電子郵件<em className="required-mark">必填</em>{otp.verified && <em className="verified-mark">已完成驗證</em>}</span><div className={otp.verified ? "input-row email-verified" : "input-row"}><input type="email" value={basicInfo.email} placeholder="name@company.com" aria-invalid={basicInfo.email.length > 0 && !/^\S+@\S+\.\S+$/.test(basicInfo.email)} onChange={(event) => handleBasicField("email", event.target.value)} /><button className="lookup-button" type="button" disabled={Boolean(otp.cooldown) || otp.verified} onClick={sendOtp}>{otp.cooldown ? `${otp.cooldown} 秒後可重新寄送` : "送出驗證碼"}</button></div><small className="field-hint">此 Email 將用於寄送身分驗證碼。</small></label>{!otp.verified && <div className="email-otp-field"><span className="field-label">輸入驗證碼</span><div className="input-row"><input value={otp.code} disabled={!otp.sent} inputMode="numeric" maxLength={6} placeholder="請輸入 6 碼驗證碼" onChange={(event) => setOtp((previous) => ({ ...previous, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))} /><button className="navy-button" type="button" disabled={!otp.sent || otp.code.length !== 6} onClick={verifyOtp}>驗證電子郵件</button></div></div>}</div><p className="company-lookup-status full" role="status" aria-live="polite">{companyLookup.loading ? '正在查詢公司資料…' : companyLookup.message}</p><label className="full"><span className="field-label">主要產品／服務</span><textarea value={basicInfo.products} onChange={(event) => handleBasicField('products', event.target.value)} /><small className="field-hint">請簡述目前主要提供的產品或服務。</small></label><label className="full"><span className="field-label">公司簡介</span><textarea value={basicInfo.introduction} onChange={(event) => handleBasicField('introduction', event.target.value)} /><small className="field-hint">可補充公司規模、主要客戶或目前營運狀況。</small></label></div><StepActions onBack={() => goTo(2)} onNext={handleBasicNext} /></>;
    if (step === 4) { const group = diagnosisGroups[diagnosisPanel]; const completed = group.questions.filter((question) => diagnosis[question.id]).length; return <div className="diagnosis-list"><div className="helper-text diagnosis-guide">{selfDiagnosisConfig.instruction.scaleHint}</div><div className="diagnosis-stepper" aria-label="自我診斷量表進度"><span className="diagnosis-stepper-label">量表進度</span><div className="diagnosis-stepper-track">{diagnosisGroups.map((item, index) => <div className={`diagnosis-step ${index < diagnosisPanel ? 'completed' : ''} ${index === diagnosisPanel ? 'active' : ''}`} key={item.id}><span>{index < diagnosisPanel ? '✓' : index + 1}</span><strong>{item.title.replace(/^第[一二三四四五六七八九十]+部分：/, '')}</strong></div>)}</div></div><div className="diagnosis-panel-progress"><span>自我診斷量表</span><strong>第 {diagnosisPanel + 1} / {diagnosisGroups.length} 部分</strong><small>{completed} / {group.questions.length} 題完成</small></div><section className={`diagnosis-panel diagnosis-panel-${diagnosisPanelDirection}`} key={group.id}><div className="eyebrow">{group.title}</div>{group.questions.map((question) => <div className="diagnosis-question" key={question.id}><strong>{question.number}. {question.text}</strong><div className="diagnosis-options">{selfDiagnosisConfig.scale.map((value) => <button className={`diagnosis-option ${diagnosis[question.id] === value ? 'selected' : ''}`} type="button" key={value} aria-label={`${question.text}：${value} 分，${question.options[value - 1]}`} onClick={() => handleDiagnosisAnswer(question.id, value)}><span>{value}</span><small>{question.options[value - 1]}</small></button>)}</div></div>)}</section><div className="diagnosis-panel-actions">{diagnosisPanel > 0 ? <button className="back-button" type="button" onClick={() => moveDiagnosisPanel(diagnosisPanel - 1)}>← 上一部分</button> : <span />}{diagnosisPanel === diagnosisGroups.length - 1 && <button className="orange-button" type="button" disabled={!diagnosisComplete} onClick={() => submit()}>完成診斷</button>}</div></div>; }
    return <div className="complete-card"><div className="eyebrow">五、填寫完成</div><h3>已完成問卷</h3><p>你的填寫資料已保存，可用於後續產出報表。</p><div className="score-card"><small>問卷完成編號</small><strong>{result?.id || '完成'}</strong><span>資料已保存</span></div><div className="result-actions"><button className="outline-button" type="button" onClick={reset}>返回首頁</button><button className="navy-button" type="button" onClick={exportReport} disabled={!reportAvailable}>▣ 匯出報告</button></div></div>;
  };

  const renderCalculator = () => <section className="calculator-view"><div className="calculator-hero"><div className="eyebrow">互動試算</div><h2>減少重複工作，能釋放多少工時價值？</h2><p>調整人數、薪資、人工時、效率提升與軟體成本，進行情境試算；結果須以企業實測與實際報價驗證。</p><button className="outline-button" type="button" onClick={() => setShowMethodology(true)}>⌁ 這個數字怎麼算？</button></div><div className="calculator-grid"><div className="calculator-inputs">{[['people','財會人員',1,50,'人'],['salary','平均月薪',20000,300000,'元'],['hours','每人每月人工登打／對帳',1,200,'小時'],['efficiency','情境效率提升',0,100,'%'],['cost','工具年費預算',0,2000000,'元']].map(([key,label,min,max,unit]) => <label className="calculator-field" key={key}><span><b>{label}</b><strong>{key === 'salary' || key === 'cost' ? `NT$ ${calculator[key].toLocaleString()}` : `${calculator[key].toLocaleString()} ${unit}`}</strong></span><input type="range" min={min} max={max} step={key === 'salary' ? 1000 : key === 'cost' ? 1000 : 1} value={calculator[key]} onChange={(event) => updateCalculator(key, event.target.value)} /></label>)}</div><div className="calculator-results"><div className="kpi-card primary"><small>一年可釋放工時（情境）</small><strong>{Math.round(calculation.savedHours).toLocaleString()} 小時</strong></div><div className="kpi-card"><small>年化工時價值（估算）</small><strong>NT$ {Math.round(calculation.saving).toLocaleString()}</strong></div><div className="kpi-card"><small>工時價值 ROI（估算）</small><strong>{Math.round(calculation.roi)}%</strong></div><div className="kpi-card"><small>估算回收期（工時價值）</small><strong>{calculation.payback ? `${calculation.payback.toFixed(1)} 個月` : '—'}</strong></div><div className="calculator-note">情境假設／示例：本模型僅估算人工工時價值，須以企業實測與實際報價驗證；工時價值不等於現金節省。</div></div></div>{showMethodology && <div className="modal-backdrop methodology-backdrop" role="presentation" onClick={() => setShowMethodology(false)}><div className="methodology-modal" role="dialog" aria-modal="true" aria-labelledby="methodology-title" onClick={(event) => event.stopPropagation()}><div className="methodology-top"><div className="methodology-label">Methodology｜計算邏輯</div><button className="modal-close" type="button" onClick={() => setShowMethodology(false)} aria-label="關閉">×</button></div><div className="methodology-rule" /><h2 id="methodology-title">AI 財務工具情境試算怎麼算？</h2><p>本試算以可釋放人力工時價值作為情境估算基礎，協助比較不同導入假設下的工時價值與估算回收期；結果須以企業實測與實際報價驗證。</p><div className="methodology-callout"><strong>薪資輸入與法定最低工資提醒</strong><b>請依企業實際薪資及最新法定最低工資輸入；相關法令與數額應以主管機關最新公告為準。</b><span>注意：月薪制與時薪制是不同計薪制度，不能直接以月薪除以固定時數推論法定最低時薪。</span></div><h3>一、5 個輸入變數</h3><div className="methodology-inputs"><div><b>N｜財會人員數</b><span>實際參與登打、對帳、報表整理等作業的人數。</span></div><div><b>S｜平均月薪</b><span>參與人員的平均每月薪資；請依企業實際情況與最新法定規範設定。</span></div><div><b>H｜每月人工工時</b><span>每人每月花在可被自動化工作的時間。</span></div><div><b>E｜預期工時減省率</b><span>AI 導入後預估可減少的人工比例；建議以實際 PoC 結果調整。</span></div><div><b>C｜年度 AI 成本</b><span>軟體授權、模組或年度服務費；若有一次性導入費，正式評估時應另外納入。</span></div></div><h3>二、4 個核心公式</h3><div className="methodology-formulas"><div className="formula-card formula-blue"><b>1. 工時價值換算 R</b><code>R = (S × 12) ÷ 2,080</code><p>以台灣法定正常工時「每週 40 小時」換算全年 52 週，共約 2,080 小時，作為生產力價值的簡化基準。這不是加班費計算公式，也不是用來判斷最低工資是否合法。</p></div><div className="formula-card formula-orange"><b>2. 全團隊可釋放工時 H_saved</b><code>H_saved = N × H × (E ÷ 100) × 12</code><p>把每人每月可減少的重複作業工時，換算成全團隊一年可釋放的時間。</p></div><div className="formula-card formula-green"><b>3. 年化可釋放人力價值 V_saving</b><code>V_saving = H_saved × R</code><p>用可釋放工時乘以平均工時價值，估算這些時間的內部生產力價值。</p></div><div className="formula-card formula-red"><b>4. 工時價值 ROI 與估算回收期</b><code>ROI = [(V_saving − C) ÷ C] × 100%<br />回收期(月) = C ÷ (V_saving ÷ 12)</code><p>代表工具支出多久能被可釋放工時的等值生產力抵回。若要做「會計帳面現金 ROI」，還需納入實際減少的人事支出、委外費、錯帳損失等現金項目。</p></div></div><div className="methodology-warning"><b>重要提醒｜工時價值不等於現金節省</b><span>例如 AI 每年釋放 500 小時，不代表公司一定少付 500 小時薪資；更常見的是把這些時間移去做催收、分析、預算、管理報表等更高價值工作。因此此處呈現為「工時價值 ROI」。正式投資評估可再另算「現金 ROI」。</span><strong>最低時薪 196 元的用途：若企業採時薪人員，可直接用實際時薪，且不得低於 NT$196；若是月薪制人員，本模型以實際月薪及全年正常工時換算，不把 196 元硬套為月薪制的時薪。</strong></div><div className="methodology-actions"><button className="outline-button" type="button" onClick={() => setShowMethodology(false)}>關閉</button><button className="orange-button" type="button" onClick={() => setShowMethodology(false)}>立即回到試算</button></div></div></div>}</section>;
  const renderTools = () => {
    const types = ['全部類型', ...new Set(toolCatalog.flatMap(([, , , , tags]) => tags))];
    const filtered = toolCatalog.filter(([name, vendor, description, price, tags]) => (toolType === '全部類型' || tags.includes(toolType)) && `${name}${vendor}${description}${tags.join('')}`.toLowerCase().includes(toolSearch.toLowerCase()));
    return <section className="tools-view">
      <div className="tools-hero"><div className="eyebrow">工具探索</div><h2>先選想改善的問題，再找適合的工具。</h2><p>先用功能與問題篩選，再比較廠商、價格與導入條件。</p></div>
      <div className="tools-notice">資料更新日：2026 年 9 月 2 日｜資料來源：公開產品資訊與廠商公開資料彙整。價格以廠商最新報價為準，本工具僅供示範與探索用途。</div>
      <div className="tools-filters">
        <div className="tools-search"><Search aria-hidden="true" /><input aria-label="搜尋工具" placeholder="搜尋廠商、工具或功能" value={toolSearch} onChange={(event) => setToolSearch(event.target.value)} /></div>
        <div className="tools-type-filter"><ListFilter aria-hidden="true" /><select aria-label="工具類型" value={toolType} onChange={(event) => setToolType(event.target.value)}>{types.map((type) => <option key={type}>{type}</option>)}</select></div>
      </div>
      <div className="tools-count">找到 {filtered.length} 項工具</div>
      <div className="tool-grid">{filtered.map(([name, vendor, description, price, tags]) => {
        const ToolIcon = toolIcons[name];
        return <article className="tool-card" key={name}>
          <div className="tool-card-top"><div className="tool-card-identity"><span className="tool-card-icon"><ToolIcon weight="duotone" aria-hidden="true" /></span><h2>{name}</h2></div><strong>{price}</strong></div>
          <b className="tool-vendor">{vendor}</b><p>{description}</p>
          <div className="tool-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </article>;
      })}</div>
      {filtered.length === 0 && <div className="tools-empty">找不到符合條件的工具，請換個關鍵字或類型。</div>}
    </section>;
  };
  const renderOnboarding = () => <section className="onboarding-view"><div className="onboarding-hero"><div className="eyebrow">從試用到真正落地</div><h2>先從一個問題開始，再一步一步導入。</h2><p>先整理資料、小範圍試用，再逐步擴大。每個階段都有清楚的檢查點，降低導入風險。</p></div><div className="onboarding-section-title"><span>導入路徑</span><h2>7 個導入階段</h2></div><div className="onboarding-timeline">{onboardingStages.map(([title, description], index) => <article className={`onboarding-stage stage-${index + 1}`} key={title}><div className="stage-line" /><b>{String(index + 1).padStart(2, '0')}</b><h3>{title}</h3><p>{description}</p></article>)}</div><div className="onboarding-tips">{onboardingTips.map(([IconComponent, title, description]) => <article key={title}><span className="onboarding-tip-icon"><IconComponent aria-hidden="true" weight="duotone" /></span><h3>{title}</h3><p>{description}</p></article>)}</div><div className="onboarding-callout"><strong>建議順序</strong><span>先從低風險、容易量化的流程開始，例如單據整理、對帳或報表彙整，再逐步導入跨部門整合。</span></div></section>;

  return <div className="page-shell"><header className="site-header"><Link className="brand" to="/">AI 財務工具互動指引</Link><nav><button className={`finder-nav-button ${currentPath === '/find-tools' ? 'active' : ''}`} type="button" onClick={() => navigate('/find-tools')}><WrenchIcon aria-hidden="true" />幫我找工具</button><button className={currentPath === '/self-diagnosis' ? 'active' : ''} type="button" onClick={() => navigate('/self-diagnosis')}><ClipboardTextIcon aria-hidden="true" />自我診斷量表</button><button className={currentPath === '/calculator' ? 'active' : ''} type="button" onClick={() => navigate('/calculator')}><CalculatorIcon aria-hidden="true" />算算能省多少</button><button className={currentPath === '/tools' ? 'active' : ''} type="button" onClick={() => navigate('/tools')}><ToolboxIcon aria-hidden="true" />有哪些工具</button><button className={currentPath === '/onboarding' ? 'active' : ''} type="button" onClick={() => navigate('/onboarding')}><SignpostIcon aria-hidden="true" />怎麼導入</button></nav><div className="header-actions"></div></header><main>{view === 'calculator' ? renderCalculator() : view === 'tools' ? renderTools() : view === 'onboarding' ? renderOnboarding() : <><section className={`hero ${step > 0 ? 'hero-compact' : ''}`}>{step === 0 && <><div className="eyebrow">企業財務轉型輔導需求表</div><h1>你的公司，最適合從哪裡開始用 AI？</h1><p>不用懂 AI，也不用先研究軟體。完成原有的企業問卷流程，我們將協助整理目前的數位轉型需求。</p></>}{step === 0 && <button className="orange-button hero-start" type="button" onClick={() => goTo(1)}>開始測驗 →</button>}</section>{step > 0 && <section className="survey-section"><div className="section-heading"><div><div className="step-label">{currentStep[0]}</div><h2>{currentStep[1]}</h2>{step < 5 && <p>請依照目前狀況完成本步驟，資料會保留在本次填寫流程中。</p>}</div>{step === 3 ? <button className="clear-data-button" type="button" onClick={clearDiagnosis}>清除所有資料</button> : null}</div><div className={`hero-progress ${step > 0 ? 'progress-fixed' : ''}`}><span style={{ width: `${progress * 100}%` }}></span><b>{step === 0 ? '準備開始' : step === 5 ? '完成' : `第 ${step} / 5 步`}</b></div>{renderStep()}</section>}</>}</main><footer className="site-footer">本工具為示範／探索用途，不代表主管機關或計畫之採購推薦、認證或背書。<br />本獨立版本採前後端分離架構：React + Vite + Node.js Express。</footer>{view === 'survey' && <div className="floating-actions" aria-label="問卷資料操作"><button type="button" className="floating-save" onClick={saveDraft}>暫存填寫資料</button><button type="button" className="floating-clear" onClick={clearDiagnosis}>清除所有資料</button></div>}{toast && <div className="toast" role="alert" aria-live="assertive">{toast}</div>}</div>;
}

function FinderView({ onTools }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const page = finderPages[pageIndex];
  const selected = answers[pageIndex] || [];
  const selectedValues = Array.isArray(selected) ? selected : [selected];
  useEffect(() => {
    if (pageIndex === 0) return;
    const progress = document.querySelector('.finder-progress');
    if (!progress) return;
    const headerOffset = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const top = progress.getBoundingClientRect().top + window.scrollY - headerOffset - 24;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }, [pageIndex]);
  const choose = (index) => {
    if (page.multi) {
      const next = selectedValues.includes(index) ? selectedValues.filter((value) => value !== index) : selectedValues.length < 3 ? [...selectedValues, index] : selectedValues;
      setAnswers((previous) => ({ ...previous, [pageIndex]: next }));
      return;
    }
    setAnswers((previous) => ({ ...previous, [pageIndex]: index }));
    window.setTimeout(() => setPageIndex((current) => Math.min(current + 1, finderPages.length)), 180);
  };
  if (pageIndex === finderPages.length) return <section className="finder-view"><div className="finder-result"><div><div className="eyebrow">推薦結果</div><h2>建議先從最有感的問題開始。</h2><p>依照你的情境，先從小範圍、容易驗證的流程開始，再逐步擴大導入。</p><div className="finder-recommendations">{(answers[3] || [0, 1, 2]).map((value, index) => <article key={value}><b>0{index + 1} · 最值得先做</b><h2>{finderPages[3].options[value][0]}</h2><p>{finderPages[3].options[value][1]}</p><span>適合先做 PoC</span></article>)}</div><div className="finder-result-actions"><button className="outline-button" type="button" onClick={() => { setPageIndex(0); setAnswers({}); }}>重新測一次</button><button className="navy-button" type="button" onClick={onTools}>看看適合的工具 →</button></div></div><div className="finder-score"><small>AI 導入準備度</small><strong>{Math.min(95, 50 + Object.keys(answers).length * 8 + (answers[3]?.length || 0) * 3)}</strong><span>適合從小工具開始</span><i /></div></div></section>;
  return <section className="finder-view"><div className="finder-hero"><h2 className="finder-kicker">3 分鐘企業健檢</h2><h2>你的公司，最適合從哪裡開始用 AI？</h2><p>不用懂 AI，也不用先研究軟體。回答幾個每天會遇到的問題，我們幫你找出最值得先改善的地方。</p></div><div className="finder-progress"><div className="finder-progress-track"><span style={{ width: `${((pageIndex + 1) / finderPages.length) * 100}%` }} /></div><b>第 {pageIndex + 1} / {finderPages.length} 步</b></div><div className="finder-question"><h2>{page.title}</h2><p>{page.hint}</p></div><div className="finder-options">{page.options.map(([title, description], index) => { const FinderIcon = finderOptionIcons[pageIndex][index]; return <button className={`finder-option ${selectedValues.includes(index) ? 'selected' : ''} ${pageIndex === 0 && index === 0 ? 'manufacturing-card' : pageIndex === 0 && index === 1 ? 'service-card' : ''}`} type="button" key={title} onClick={() => choose(index)}><span className="finder-option-icon"><FinderIcon weight="duotone" aria-hidden="true" /></span><strong>{title}</strong><small>{description}</small></button>; })}</div><div className="finder-footer">{page.multi ? <><span>已選 {selectedValues.length} / 3</span><button className="orange-button" type="button" disabled={selectedValues.length !== 3} onClick={() => setPageIndex(finderPages.length)}>看看結果 →</button></> : <>{pageIndex > 0 ? <button className="back-button" type="button" onClick={() => setPageIndex((current) => current - 1)}>← 返回</button> : <span />}</>}</div></section>;
}

function StepActions({ onBack, onNext, nextText = '下一步 →' }) {
  return <div className="step-actions"><button className="back-button" type="button" onClick={onBack}>← 返回</button><button className="orange-button" type="button" onClick={onNext}>{nextText}</button></div>;
}

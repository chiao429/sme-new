import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  clearHomepageSurveySession,
  fetchPublicSurveyTemplate,
  generateOtp,
  lookupCompany,
  submitHomepageSurvey,
  verifyOtp,
} from './services/public-survey-api.js';

const SME_FORM_IDS = { industry: '1', consent: '2', basic: '3', identity: '4', diagnosis: '5' };

const cloneSurvey = (data) => ({
  ...data,
  qa: (data.qa || []).map((item) => ({
    ...item,
    options: item.options?.map((option) => ({ ...option })),
  })),
});

const formById = (data, id) => data?.form?.find((item) => String(item.id) === String(id));
const questionsByFormId = (data, id) =>
  (data?.qa || []).filter((item) => String(item.formId) === String(id));
const firstQuestion = (data, id) => questionsByFormId(data, id)[0];
const titleFor = (data, id, fallback) => formById(data, id)?.title || fallback;
const descriptionFor = (data, id) => formById(data, id)?.description?.replaceAll('<br/>', '\n') || '';
const diagnosisFormIds = (data) =>
  (data?.form || [])
    .filter((form) => Number(form.id) > Number(SME_FORM_IDS.diagnosis))
    .filter((form) => questionsByFormId(data, form.id).length > 0)
    .map((form) => String(form.id));
const mainStepCount = (data) => Math.max(1, (data?.form?.length || 0) - diagnosisFormIds(data).length);
const answerMatches = (value, expected) => String(value ?? '') === String(expected ?? '');
const isBasicFieldVisible = (field, fields) => {
  if (field.hide_front) return false;
  if (field.hideUnlessAny?.length) {
    return field.hideUnlessAny.some((condition) => {
      const dependency = fields.find((item) => String(item.id) === String(condition.id));
      return dependency && answerMatches(dependency.answer, condition.answer);
    });
  }
  if (field.hide_default_back) {
    return field.set_show_if_question_match?.some((condition) => {
      const dependency = fields.find((item) => String(item.id) === String(condition.id));
      return dependency && answerMatches(dependency.answer, condition.value);
    });
  }
  return true;
};

function ProgressBar({ step, totalSteps }) {
  if (step === 0 || step === 6) return null;
  const percentage = Math.min((step / totalSteps) * 100, 100);
  return (
    <div className="sme-progress" aria-label="問卷填寫進度">
      <div
        className="sme-progress-track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        aria-label="問卷填寫進度"
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <span className="sme-progress-label">第 {step} / {totalSteps} 步</span>
    </div>
  );
}

function StepActions({ onBack, onNext, nextText = '下一步', nextDisabled = false, busy = false }) {
  return (
    <div className="step-actions">
      <button className="orange-button" type="button" onClick={onBack} disabled={busy}>
        返回
      </button>
      <button className="orange-button" type="button" onClick={onNext} disabled={nextDisabled || busy} aria-busy={busy}>
        {busy ? '處理中…' : nextText}
      </button>
    </div>
  );
}

function Header() {
  return (
    <header className="sme-header">
      <a className="sme-logo" href="/sme" aria-label="企業財務轉型輔導需求表－回首頁">
        <img src="/logo.svg" alt="AI 財務 SME 企業財務轉型輔導需求表" />
      </a>
      <div className="sme-header-actions">
        <a href="/sme/sitemap">網站導覽</a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="sme-footer">
      <div>
        <h2>主辦單位</h2>
        <img src="/sme-gov-logo.png" alt="經濟部中小及新創企業署" />
      </div>
      <div>
        <h2>執行單位</h2>
        <img src="/cdri-logo.png" alt="財團法人商業發展研究院" />
        <p>臺北市大安區復興南路一段303號4樓</p>
        <p>02-7707-4800</p>
      </div>
    </footer>
  );
}

function HomeStep({ onStart }) {
  return (
    <section className="sme-home" aria-labelledby="sme-home-title">
      <h1 id="sme-home-title">企業財務轉型輔導需求表</h1>
      <p className="sme-home-description">
        填寫數位成熟度自我診斷評估表，可幫助企業更加了解目前數位轉型的成熟度，企業須有數位基礎後，才能透過數位工具的協助、一步步達成數位轉型的終極目標。
      </p>
      <p className="sme-home-note">本評量建議由公司具決策權之高階主管填寫，便於評估公司營運現況與數位轉型策略。</p>
      <p className="sme-time"><span className="sme-time-icon" aria-hidden="true">◷</span><span>作答時間約五到十分鐘</span></p>
      <button className="orange-button sme-start-button" type="button" onClick={onStart}>
        開始測驗
      </button>
      <img className="sme-home-banner" src="/banner.png" alt="AI 財務工具互動指引示意圖" />
    </section>
  );
}

function IndustryStep({ data, selected, onSelect, onNext, onBack }) {
  const industry = firstQuestion(data, SME_FORM_IDS.industry);
  const options = industry?.options || [];
  return (
    <section className="sme-step" aria-labelledby="industry-title">
      <h1 id="industry-title">{titleFor(data, SME_FORM_IDS.industry, '一、產業分類')}</h1>
      <p className="sme-step-description">{descriptionFor(data, SME_FORM_IDS.industry) || '一、您的事業位於哪個產業呢？'}</p>
      <ProgressBar step={1} totalSteps={mainStepCount(data)} />
      <div className="sme-industry-grid" onClick={(event) => { if (event.target === event.currentTarget) onSelect(null); }}>
        {options.map((option, index) => {
          const value = String(option.value);
          const isManufacturing = option.title.includes('製造');
          return (
            <button
              className={`sme-industry-card ${isManufacturing ? 'manufacturing' : 'service'} ${selected === value ? 'selected' : ''}`}
              type="button"
              key={`${value}-${index}`}
              aria-pressed={selected === value}
              onClick={() => onSelect(value)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          );
        })}
      </div>
      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </section>
  );
}

function ConsentStep({ data, checked, onCheck, onNext, onBack }) {
  const consent = firstQuestion(data, SME_FORM_IDS.consent);
  const label = consent?.options?.[0];
  const content = consent?.description?.replaceAll('<br/>', '\n') || '蒐集個人資料告知事項';
  return (
    <section className="sme-step" aria-labelledby="consent-title">
      <h1 id="consent-title">{titleFor(data, SME_FORM_IDS.consent, '個資同意書')}</h1>
      <ProgressBar step={2} totalSteps={mainStepCount(data)} />
      <article className="sme-consent-panel" aria-labelledby="consent-notice-title">
        <h2 id="consent-notice-title">蒐集個人資料告知事項</h2>
        <div className="sme-consent-content" tabIndex="0" role="region" aria-label="個資告知事項內容">
          {content}
        </div>
        <label className="sme-consent-check">
          <input type="checkbox" checked={checked} onChange={(event) => onCheck(event.target.checked)} />
          <span>{label?.title || '個人資料之同意提供：(同意請勾選)'}</span>
          <small>{label?.description || '本人已充分知悉上述告知事項，並同意本計畫蒐集、處理、利用本人之個人資料，以及其他公務機關請求行政協助目的之提供。'}</small>
        </label>
      </article>
      <StepActions onBack={onBack} onNext={onNext} nextText="我同意" nextDisabled={!checked} />
    </section>
  );
}

function BasicInfoStep({ data, industryCategoryValue, onChange, onLookup, lookupState, onNext, onBack }) {
  const allFields = questionsByFormId(data, SME_FORM_IDS.basic).map((field) => (
    field.question === '產業類別' && industryCategoryValue !== undefined
      ? { ...field, answer: industryCategoryValue }
      : field
  ));
  const fields = allFields.filter((field) => isBasicFieldVisible(field, allFields));
  const hasRequired = fields.some((field) => !field.optional && !String(field.answer ?? '').trim());
  return (
    <section className="sme-step" aria-labelledby="basic-title">
      <h1 id="basic-title">{titleFor(data, SME_FORM_IDS.basic, '二、基本資料')}</h1>
      <p className="sme-step-description">{descriptionFor(data, SME_FORM_IDS.basic) || '讓我們快速認識您。'}</p>
      <ProgressBar step={3} totalSteps={mainStepCount(data)} />
      <div className="sme-basic-grid">
        {fields.map((field, index) => {
          const id = `sme-basic-${index}`;
          const value = field.answer ?? '';
          const isTaxId = field.question === '統一編號';
          const isProduct = field.question === '主要產品';
          return (
            <label className={isProduct ? 'sme-field full' : 'sme-field'} htmlFor={id} key={`${field.question}-${index}`}>
              <span className="sme-field-label">
                {field.icon && <img src={field.icon} alt="" aria-hidden="true" />}
                <span>{field.question}</span>
                {!field.optional && <em aria-hidden="true">*</em>}
              </span>
              {field.optionType === 'dropdown' ? (
                <select id={id} value={value} required={!field.optional} onChange={(event) => onChange(field.question, event.target.value)}>
                  <option value="">請選擇</option>
                  {(field.options || []).map((option) => <option value={option.value} key={option.value}>{option.title}</option>)}
                </select>
              ) : isProduct ? (
                <textarea id={id} value={value} required={!field.optional} placeholder={field.placeholder || '請盡量詳述'} onChange={(event) => onChange(field.question, event.target.value)} />
              ) : (
                <input id={id} type={field.optionType === 'number' ? 'text' : field.optionType || 'text'} inputMode={field.optionType === 'number' ? 'numeric' : undefined} value={value} required={!field.optional} onChange={(event) => onChange(field.question, event.target.value)} />
              )}
              {isTaxId && <button className="lookup-button" type="button" onClick={onLookup} disabled={lookupState.loading}>{lookupState.loading ? '查詢中…' : '查詢公司'}</button>}
              {isTaxId && <small className="sme-field-hint" role="status" aria-live="polite">{lookupState.message || '輸入 8 碼統一編號可自動帶入公司資料。'}</small>}
            </label>
          );
        })}
      </div>
      <StepActions onBack={onBack} onNext={onNext} nextDisabled={hasRequired} />
    </section>
  );
}

function IdentityStep({ data, email, code, sent, onEmail, onCode, onSend, onVerify, busy, error, onBack }) {
  const identity = firstQuestion(data, SME_FORM_IDS.identity);
  return (
    <section className="sme-step identity-step" aria-labelledby="identity-title">
      <h1 id="identity-title">{titleFor(data, SME_FORM_IDS.identity, '三、身分驗證')}</h1>
      <p className="sme-step-description">{descriptionFor(data, SME_FORM_IDS.identity) || '請確認電子郵件並輸入驗證碼。'}</p>
      <ProgressBar step={4} totalSteps={mainStepCount(data)} />
      <form className="sme-verification-panel" onSubmit={(event) => { event.preventDefault(); onSend(); }} aria-busy={busy.send}>
        <label className="sme-field full" htmlFor="sme-email">
          <span className="sme-field-label">{identity?.question || '電子郵件'}<em aria-hidden="true">*</em></span>
          <input id="sme-email" type="email" autoComplete="email" value={email} onChange={(event) => onEmail(event.target.value)} required />
        </label>
        <div className="sme-verification-actions">
          <button className="orange-button" type="submit" disabled={busy.send || sent}>{busy.send ? '寄送中…' : sent ? '驗證碼已送至信箱' : '送出驗證碼'}</button>
          {sent && <button className="resend-button" type="button" onClick={onSend} disabled={busy.send}>再送一次</button>}
        </div>
      </form>
      <form className="sme-verification-panel" onSubmit={(event) => { event.preventDefault(); onVerify(); }} aria-busy={busy.verify}>
        <label className="sme-field full" htmlFor="sme-code">
          <span className="sme-field-label">輸入驗證碼<em aria-hidden="true">*</em></span>
          <input id="sme-code" value={code} onChange={(event) => onCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" disabled={!sent} required />
        </label>
      </form>
      {error && <p className="sme-error" role="alert">{error}</p>}
      <StepActions onBack={onBack} onNext={onVerify} nextDisabled={!sent || !code.trim()} busy={busy.send || busy.verify} />
    </section>
  );
}

function DiagnosisStep({ data, answers, groupIndex, onAnswer, onGroup, onSubmit, submitting, onBack }) {
  const groups = diagnosisFormIds(data).map((id) => ({
    id,
    title: titleFor(data, id, ''),
    description: descriptionFor(data, id),
    questions: questionsByFormId(data, id),
  })).filter((group) => group.questions.length > 0);
  const group = groups[groupIndex] || groups[0];
  const groupComplete = group?.questions.every((question) => answers[question.question] !== undefined && answers[question.question] !== '');
  const formComplete = groups.flatMap((item) => item.questions).every((question) => answers[question.question] !== undefined && answers[question.question] !== '');
  const last = groupIndex === groups.length - 1;
  const canContinue = last ? formComplete : groupComplete;
  return (
    <section className="sme-step" aria-labelledby="diagnosis-title">
      <h1 id="diagnosis-title">{titleFor(data, SME_FORM_IDS.diagnosis, '四、自我診斷量表')}</h1>
      <p className="sme-step-description">{descriptionFor(data, SME_FORM_IDS.diagnosis) || '以下為自我診斷量表'}</p>
      <ProgressBar step={5} totalSteps={mainStepCount(data)} />
      <div className="sme-diagnosis-heading">
        <h2>{group?.title}</h2>
        <p>{group?.description}</p>
      </div>
      <article className="sme-diagnosis-panel" key={group?.id}>
        {group?.questions.map((question) => (
          <fieldset className="sme-diagnosis-question" key={question.question}>
            <legend>{question.question}</legend>
            <div className="sme-diagnosis-scale" aria-hidden="true">
              <span>↓ 1(最不需要推動)</span>
              <i />
              <span>↑ 5(最需要推動)</span>
            </div>
            <div className="sme-diagnosis-options">
              {(question.options || []).map((option) => {
                const value = String(option.value);
                const selected = String(answers[question.question]) === value;
                return <button type="button" key={value} className={selected ? 'selected' : ''} aria-label={`${value} ${option.description}`} aria-pressed={selected} onClick={() => onAnswer(question.question, option.value)}><span>{option.description}</span></button>;
              })}
            </div>
          </fieldset>
        ))}
      </article>
      <div className="step-actions">
        <button className="orange-button" type="button" onClick={() => groupIndex > 0 ? onGroup(groupIndex - 1) : onBack()} disabled={submitting}>返回</button>
        <button className="orange-button" type="button" onClick={() => last ? onSubmit() : onGroup(groupIndex + 1)} disabled={!canContinue || submitting} aria-busy={submitting}>{submitting ? '送出中…' : canContinue ? (last ? '完成量表' : '下一步') : '尚未完成量表'}</button>
      </div>
    </section>
  );
}

function CompleteStep({ data, onRestart, onHome }) {
  const companyName = questionsByFormId(data, SME_FORM_IDS.basic)
    .find((field) => field.question === '公司名稱')?.answer;
  return (
    <section className="sme-complete" aria-labelledby="complete-title">
      <h1 id="complete-title">五、填寫完成</h1>
      <img src="/sme-complete-success.png" alt="數位轉型評估填寫完成" />
      <p>{`感謝${companyName ? `${companyName}廠商` : '您'}的填答，後續將有輔導人員與您聯繫，感謝。`}</p>
      <div className="sme-complete-actions">
        <button className="orange-button" type="button" onClick={onRestart}>再測試一次</button>
        <button className="orange-button" type="button" onClick={onHome}>回到首頁</button>
      </div>
    </section>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(Number(new URLSearchParams(location.search).get('step') || 0));
  const [industry, setIndustry] = useState('');
  const [industryCategoryValue, setIndustryCategoryValue] = useState('');
  const [consent, setConsent] = useState(false);
  const [lookupState, setLookupState] = useState({ loading: false, message: '' });
  const [otp, setOtp] = useState({ email: '', code: '', sent: false });
  const [busy, setBusy] = useState({ send: false, verify: false, submit: false });
  const [diagnosisAnswers, setDiagnosisAnswers] = useState({});
  const [groupIndex, setGroupIndex] = useState(0);
  const [result, setResult] = useState(null);

  const pathname = location.pathname || '/sme';
  const basicFields = useMemo(() => questionsByFormId(data, SME_FORM_IDS.basic), [data]);

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation?.type !== 'reload') return;
    clearHomepageSurveySession().catch(() => {});
    if (new URLSearchParams(location.search).get('step') !== '0') {
      navigate(`${pathname}?step=0`, { replace: true });
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublicSurveyTemplate()
      .then((template) => {
        if (active) {
          const cloned = cloneSurvey(template);
          setData(cloned);
          setInitialData(cloned);
          setIndustryCategoryValue(String(questionsByFormId(cloned, SME_FORM_IDS.basic).find((field) => field.question === '產業類別')?.answer || ''));
        }
      })
      .catch((reason) => { if (active) setError(reason.message || '無法載入問卷資料'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requestedStep = Number(new URLSearchParams(location.search).get('step') || 0);
    if (Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep <= 6) setStep(requestedStep);
  }, [location.search]);

  useEffect(() => {
    const requestedStep = Number(new URLSearchParams(location.search).get('step') || 0);
    const hasIndustryCategory = industryCategoryValue || questionsByFormId(data, SME_FORM_IDS.basic)
      .find((field) => field.question === '產業類別')?.answer;
    if (data && requestedStep === 3 && !String(hasIndustryCategory ?? '').trim()) {
      setStep(1);
      navigate(`${pathname}?step=1`, { replace: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [data, industryCategoryValue, location.search, navigate, pathname]);

  const goToStep = (target) => {
    setStep(target);
    navigate(`${pathname}?step=${target}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateAnswer = (question, answer) => {
    setData((current) => current ? ({ ...current, qa: current.qa.map((item) => item.question === question ? { ...item, answer } : item) }) : current);
  };

  const updateIndustrySelection = (value) => {
    setIndustry(value || '');
    setData((current) => {
      if (!current) return current;
      const industryQuestion = firstQuestion(current, SME_FORM_IDS.industry);
      const categoryQuestion = questionsByFormId(current, SME_FORM_IDS.basic).find((field) => field.question === '產業類別');
      const selectedOption = industryQuestion?.options?.find((option) => String(option.value) === String(value));
      const categoryOption = categoryQuestion?.options?.find(
        (option) => option.title?.trim() === selectedOption?.title?.trim()
      );
      const nextCategoryValue = categoryOption?.value ?? '';
      setIndustryCategoryValue(String(nextCategoryValue));
      return {
        ...current,
        qa: current.qa.map((item) => {
          if (item.question === industryQuestion?.question) return { ...item, answer: value ? Number(value) : null };
          if (item.question === categoryQuestion?.question) return { ...item, answer: categoryOption?.value ?? null };
          return item;
        }),
      };
    });
  };

  const handleLookup = async () => {
    const taxId = String(basicFields.find((field) => field.question === '統一編號')?.answer || '');
    if (!/^\d{8}$/.test(taxId)) { setLookupState({ loading: false, message: '請先輸入 8 碼統一編號。' }); return; }
    setLookupState({ loading: true, message: '' });
    try {
      const response = await lookupCompany(taxId);
      if (!response.success || !response.data) throw new Error('查無公司資料，請確認編號或手動填寫。');
      const values = { 統一編號: response.data.businessAccountingNo, 公司名稱: response.data.companyName };
      Object.entries(values).forEach(([question, value]) => updateAnswer(question, value));
      setLookupState({ loading: false, message: '已自動填入公司資料，請確認內容。' });
    } catch (reason) {
      setLookupState({ loading: false, message: reason.message || '查詢公司資料失敗，請手動填寫。' });
    }
  };

  const sendOtp = async () => {
    const email = String(basicFields.find((field) => field.question === '電子郵件')?.answer || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('請先輸入格式正確的電子郵件。'); return; }
    setBusy((current) => ({ ...current, send: true })); setError('');
    try { await generateOtp(email, String(basicFields.find((field) => field.question === '聯絡人')?.answer || email)); setOtp({ email, code: '', sent: true }); }
    catch (reason) { setError(reason.message || '發送驗證碼失敗'); }
    finally { setBusy((current) => ({ ...current, send: false })); }
  };

  const verifyCode = async () => {
    setBusy((current) => ({ ...current, verify: true })); setError('');
    try { await verifyOtp(otp.email, otp.code); updateAnswer('電子郵件', otp.email); goToStep(5); }
    catch (reason) { setError(reason.message || '驗證碼錯誤'); }
    finally { setBusy((current) => ({ ...current, verify: false })); }
  };

  const submit = async () => {
    setBusy((current) => ({ ...current, submit: true })); setError('');
    try { const submitted = await submitHomepageSurvey(data); setResult(submitted); goToStep(6); }
    catch (reason) { setError(reason.message || '提交量表失敗'); }
    finally { setBusy((current) => ({ ...current, submit: false })); }
  };

  const restart = async () => {
    await clearHomepageSurveySession().catch(() => {});
    const cloned = cloneSurvey(initialData); setData(cloned); setIndustry(''); setIndustryCategoryValue(''); setConsent(false); setOtp({ email: '', code: '', sent: false }); setDiagnosisAnswers({}); setGroupIndex(0); setResult(null); setError(''); goToStep(1);
  };

  if (loading) return <div className="sme-loading" role="status">正在載入問卷資料…</div>;
  if (error && !data) return <div className="sme-loading" role="alert">{error}</div>;

  return (
    <div className="sme-app">
      <a className="sme-skip-link" href="#sme-main">跳到主要內容</a>
      <Header />
      <main id="sme-main" className={step === 6 ? 'sme-main-complete' : undefined}>
        {step === 0 && <HomeStep onStart={() => goToStep(1)} />}
        {step === 1 && <IndustryStep data={data} selected={industry || String(firstQuestion(data, SME_FORM_IDS.industry)?.answer || '')} onSelect={updateIndustrySelection} onNext={() => goToStep(2)} onBack={() => goToStep(0)} />}
        {step === 2 && <ConsentStep data={data} checked={consent || Boolean(firstQuestion(data, SME_FORM_IDS.consent)?.answer)} onCheck={(value) => { setConsent(value); updateAnswer(firstQuestion(data, SME_FORM_IDS.consent)?.question, value ? 1 : null); }} onNext={() => goToStep(3)} onBack={() => goToStep(1)} />}
        {step === 3 && <BasicInfoStep data={data} industryCategoryValue={industryCategoryValue} onChange={(question, answer) => {
          updateAnswer(question, answer);
          if (question === '產業類別') setIndustryCategoryValue(String(answer ?? ''));
        }} onLookup={handleLookup} lookupState={lookupState} onNext={() => goToStep(4)} onBack={() => goToStep(2)} />}
        {step === 4 && <IdentityStep data={data} email={String(basicFields.find((field) => field.question === '電子郵件')?.answer || '')} code={otp.code} sent={otp.sent} onEmail={(value) => updateAnswer('電子郵件', value)} onCode={(value) => setOtp((current) => ({ ...current, code: value }))} onSend={sendOtp} onVerify={verifyCode} busy={busy} error={error} onBack={() => goToStep(3)} />}
        {step === 5 && <DiagnosisStep data={data} answers={diagnosisAnswers} groupIndex={groupIndex} onAnswer={(question, value) => { setDiagnosisAnswers((current) => ({ ...current, [question]: value })); updateAnswer(question, value); }} onGroup={setGroupIndex} onSubmit={submit} submitting={busy.submit} onBack={() => goToStep(4)} />}
        {step === 6 && <CompleteStep data={data} onRestart={restart} onHome={() => goToStep(0)} />}
        {error && step !== 4 && <p className="sme-error" role="alert">{error}</p>}
      </main>
      <Footer />
    </div>
  );
}

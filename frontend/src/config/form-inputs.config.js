import { selfDiagnosisConfig } from './self-diagnosis.config.js';

const iconBase = 'https://storage.googleapis.com/umas_public_assets/cdri/input-icons';
const icon = (name) => `${iconBase}/${name}.png`;
const option = (title, value, description = '', image = null) => ({ image, title, value, description });
const dropdownOptions = (titles) => titles.map((title, index) => option(title, index + 1));

const manufacturingIndustries = [
  '08中類 - 食品及飼品製造業', '09中類 - 飲料製造業', '10中類 - 菸草製造業', '11中類 - 紡織業',
  '12中類 - 成衣及服飾品製造業', '13中類 - 皮革、毛皮及其製品製造業', '14中類 - 木竹製品製造業',
  '15中類 - 紙漿、紙及紙製品製造業', '16中類 - 印刷及資料儲存媒體複製業', '17中類 - 石油及煤製品製造業',
  '18中類 - 化學材料及肥料製造業', '19中類 - 其他化學製品製造業', '20中類 - 藥品及醫用化學製品製造業',
  '21中類 - 橡膠製品製造業', '22中類 - 塑膠製品製造業', '23中類 - 非金屬礦物製品製造業', '24中類 - 基本金屬製造業',
  '25中類 - 金屬製品製造業', '26中類 - 電子零組件製造業', '27中類 - 電腦、電子產品及光學製品製造業',
  '28中類 - 電力設備及配備製造業', '29中類 - 機械設備製造業', '30中類 - 汽車及其零件製造業',
  '31中類 - 其他運輸工具及其零件製造業', '32中類 - 家具製造業', '33中類 - 其他製造業', '34中類 - 產業用機械設備維修及安裝業',
];

const serviceIndustries = [
  '45∣46中類 - 批發業', '47∣48中類 - 零售業', '49中類 - 陸上運輸業', '50中類 - 水上運輸業', '51中類 - 航空運輸業',
  '52中類 - 運輸輔助及中介業', '53中類 - 倉儲業', '54中類 - 郵政及遞送服務業', '55中類 - 住宿業', '56中類 - 餐飲業',
  '58中類 - 出版業', '59中類 - 影片及電視節目業；聲音錄製及音樂發行業', '60中類 - 廣播、電視節目編排等內容傳播業',
  '61中類 - 電信業', '62中類 - 電腦程式設計、諮詢及相關服務業', '63中類 - 資訊服務業', '64中類 - 金融服務業',
  '65中類 - 保險業', '66中類 - 證券期貨及金融輔助業', '67中類 - 不動產開發業', '68中類 - 不動產經營及相關服務業',
  '69中類 - 法律及會計服務業', '70中類 - 企業總管理機構及管理顧問業', '71中類 - 建築、工程服務及技術檢測、分析服務業',
  '72中類 - 研究發展服務業', '73中類 - 廣告業、市場研究及公共關係業', '74中類 - 專門設計業', '75中類 - 獸醫業',
  '76中類 - 其他專業、科學及技術服務業', '77中類 - 租賃業', '78中類 - 人力仲介及供應業', '79中類 - 旅行及相關服務業',
  '80中類 - 保全及偵探業', '81中類 - 建築物及景觀服務業', '82中類 - 行政事務支援服務業',
  '83中類 - 公共行政及國防；強制性社會安全', '84中類 - 國際組織及外國機構', '85中類 - 教育業', '86中類 - 醫療保健業',
  '87中類 - 居住型照顧服務業', '88中類 - 其他社會工作服務業', '90中類 - 創作及藝術表演業',
  '91中類 - 圖書館、檔案保存、博物館及類似機構', '92中類 - 博弈業', '93中類 - 運動、娛樂及休閒服務業',
  '94中類 - 宗教、職業及類似組織', '95中類 - 個人及家庭用品維修業', '96中類 - 未分類其他服務業',
];

const scaleOptions = (group) => group.questions.map((question, index) => ({
  icon: null,
  answer: 2,
  formId: group.formId,
  options: group.scale?.map((value) => option(String(value), value, question.options[value - 1])) || question.options.map((description, index) => option(String(index + 1), index + 1, description)),
  question: question.text,
  hide_front: false,
  optionType: 'radio',
  id: `${group.formId}-${index + 1}`,
}));

const diagnosisInputs = selfDiagnosisConfig.groups.flatMap(scaleOptions);

export const formInputs = [
  {
    icon: null,
    answer: 2,
    formId: '1',
    options: [
      option('服務業', 1, '包含旅宿觀光、餐飲業、清潔保全、活動展演、人力資源服務', `${iconBase}/%E4%BD%8F%E5%AE%BF%E3%80%81%E9%A4%90%E9%A3%B2%E3%80%81%E6%94%AF%E6%8F%B4%E6%9C%8D%E5%8B%99%E6%A5%AD.png`),
      option('製造業', 2, '包含基礎原料、精密加工、自動化設備、消費性產品、生技醫療製造', `${iconBase}/%E8%A3%BD%E9%80%A0%E6%A5%AD.png`),
    ],
    question: '一、產業分類',
    hide_front: false,
    optionType: 'radio',
    description: '您的事業位於哪個產業呢？',
  },
  {
    icon: null,
    answer: [1],
    formId: '2',
    options: [option('個人資料之同意提供：(同意請勾選)', 1, '本人已充分知悉上述告知事項，並同意本計畫蒐集、處理、利用本人之個人資料，以及其他公務機關請求行政協助目的之提供。')],
    question: '個資同意書',
    hide_front: false,
    optionType: 'checkbox',
    description: '蒐集個人資料告知事項<br/>經濟部中小及新創企業署(以下簡稱本署)為遵守個人資料保護法規定，於向您蒐集個人資料前，依法向您告知下列事項。<br/>一、 本署因「中小微企業碳健檢及AI財務培力計畫」之輔助目的，而獲取您下列個人資料類別：姓名、電話、電子郵件、職稱、公司名稱等)。<br/>二、 除涉及國際業務或活動外，您的個人資料僅供本署於中華民國領域、在前述蒐集目的之必要範圍內，以合理方式利用至蒐集目的消失為止。<br/>三、 您可依個人資料保護法第 3 條規定，向本署行使查詢或請求閱覽、製給複製本、補充或更正、停止蒐集∕處理∕利用或刪除您的個人資料。另依個人資料保護法第14條規定，本署得酌收行政作業費用。<br/>四、 若您未提供正確或不提供個人資料，本署將無法為您提供蒐集目的之相關服務。<br/>五、 您瞭解此一條款符合個人資料保護法及相關法規之要求，且同意本署留存本同意書，供日後取出查驗。<br/>六、 本署因業務需要而委託其他機關處理您的個人資料時，本署將會善盡監督之責。',
  },
  { icon: icon('briefcase'), answer: '昇馳工程有限公司', formId: '3', options: null, question: '公司名稱', hide_front: false, optionType: 'text' },
  { icon: icon('map-pin'), answer: '新北市八里區忠孝路171號', formId: '3', options: null, optional: true, question: '公司地址', hide_front: false, optionType: 'address' },
  { icon: icon('user-check'), answer: '洪士鈞', formId: '3', options: null, optional: true, question: '負責人', hide_front: true, optionType: 'text' },
  { icon: icon('tag'), answer: '50841648', formId: '3', options: null, question: '統一編號', hide_front: false, optionType: 'number' },
  { icon: icon('users'), answer: 1, formId: '3', options: dropdownOptions(['1~30人', '31~100人', '101~199人']), question: '公司人數', hide_front: false, optionType: 'dropdown' },
  { icon: icon('user'), answer: '許鈺淋', formId: '3', options: null, question: '聯絡人', hide_front: false, optionType: 'text' },
  { icon: icon('bookmark'), answer: '會計', formId: '3', options: null, question: '職稱', hide_front: false, optionType: 'text' },
  { icon: icon('phone'), answer: '0912973311', formId: '3', options: null, question: '電話', hide_front: false, optionType: 'tel' },
  { icon: icon('mail'), answer: 'may70008@gmail.com', formId: '3', options: null, question: '電子郵件', hide_front: false, optionType: 'email' },
  { icon: icon('dollar-sign'), answer: 39900000, formId: '3', options: null, optional: true, question: '實收資本額', hide_front: true, optionType: 'text' },
  { id: '28', icon: icon('package'), answer: null, formId: '3', options: null, optional: true, question: '公司簡介', hide_front: true, optionType: 'text' },
  { icon: icon('dollar-income'), answer: null, formId: '3', options: null, optional: true, question: '年度營業額預估', hide_front: false, optionType: 'text' },
  { id: '19', icon: icon('briefcase'), answer: 1, formId: '3', options: dropdownOptions(['製造業', '服務業']), optional: false, question: '產業類別', hide_front: false, optionType: 'dropdown' },
  { id: '45', icon: 'https://storage.googleapis.com/umas_public_assets/cdri/school/icons/%E8%A3%BD%E9%80%A0%E6%A5%AD%E5%B0%8F%E9%A1%9E.svg', answer: 26, formId: '3', options: dropdownOptions(manufacturingIndustries), question: '製造業行業別（小類）', hide_front: false, optionType: 'dropdown', clearIfHide: true, hideUnlessAny: [{ id: 19, answer: 1 }], optionalUnlessAny: [{ id: 19, answer: 1 }] },
  { id: '46', icon: 'https://storage.googleapis.com/umas_public_assets/cdri/school/icons/%E6%9C%8D%E5%8B%99%E6%A5%AD%E5%B0%8F%E9%A1%9E.svg', answer: null, formId: '3', options: dropdownOptions(serviceIndustries), question: '服務業行業別（小類）', hide_front: false, optionType: 'dropdown', clearIfHide: true, hideUnlessAny: [{ id: 19, answer: 2 }], optionalUnlessAny: [{ id: 19, answer: 2 }] },
  { icon: icon('package'), answer: null, formId: '3', options: null, question: '主要產品', hide_front: false, optionType: 'text', placeholder: '（請盡量詳述）' },
  { icon: null, answer: 'may70008@gmail.com', formId: '4', options: null, question: '請驗證您的電子郵件！', hide_front: false, optionType: 'email' },
  ...diagnosisInputs,
];

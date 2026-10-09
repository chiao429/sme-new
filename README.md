# SME AI：獨立 React + Vite 前端

目前的 `frontend/` 是 `/sme` 問卷流程的獨立純前端版本，畫面與問卷步驟使用現有 SME API 資料：

- `frontend/`：React 18、Vite、BrowserRouter。
- API：開發環境透過 Vite proxy 呼叫目前 `http://localhost:8083` 的 Next API。
- 問卷範本：`SMBusiness`。
- OTP 驗證沿用現有 HttpOnly session，前端請求會攜帶 credentials。

## 安裝

```bash
npm install
```

## 開發啟動

先啟動目前的 Next 專案，再啟動獨立前端：

```bash
# 在 /Users/jo/c2m-sme
yarn dev

# 在 /Users/jo/c2m-sme/sme-new
npm run dev
```

獨立前端網址：

`http://localhost:4173/sme`

## Production build

```bash
npm run build
NODE_ENV=production npm run start:backend
NODE_ENV=production npm run start:frontend
```

前端採 Vite client-side rendering，不使用 SSR。正式部署時，需由同網域反向代理將 `/api/*` 轉送至目前的 Next API，才能維持 HttpOnly OTP session 與現有後端安全流程。

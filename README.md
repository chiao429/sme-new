# SME AI：React Vite + Node.js Express

獨立的企業財務轉型需求診斷工具，前後端分離：

- `frontend/`：React 18、Vite、hydrateRoot。
- `backend/`：Node.js、Express API。
- 視覺：依照提供的參考圖，使用白底 SaaS 版面、Navy `#000079`、Orange `#F75000`、大標題、進度條、兩欄卡片與深藍結果 KPI 卡。

## 安裝

```bash
npm install
```

## 開發啟動

可用一個 terminal 同時啟動前後端：

```bash
npm run dev
```

也可以分別開兩個 terminal：

```bash
npm run dev:backend
npm run dev:frontend
```

- Backend：`http://localhost:4100`
- Frontend Vite：`http://localhost:4173`

## Production build

```bash
npm run build
NODE_ENV=production npm run start:backend
NODE_ENV=production npm run start:frontend
```

目前 OTP 測試碼為 `246810`。session 與提交資料暫存於 Express process memory，正式環境應改成 Redis / database，並接上實際寄信服務。前端採 Vite client-side rendering，不使用 SSR。

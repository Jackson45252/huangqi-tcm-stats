# 黃耆 TCM 球員數據

黃耆 TCM 專用的球員數據看板。網站從 BBallHot 公開 API 取得資料，僅保留 `TeamName` 為 `黃耆TCM` 的球員。

## 網站功能

- 得分、籃板、助攻與效率值隊內領先者
- 球員姓名搜尋
- 依主要數據排序
- 桌面完整表格與手機球員卡片
- 每週六、週日晚上 11 點由 GitHub Actions 更新資料並重新部署
- 上游 API 暫時失敗時保留上次成功資料

## 資料更新

工作流程預設於台灣時間每週六、週日晚上 11 點執行，也可以在 GitHub Actions 頁面手動執行 `Update player data and deploy Pages`。

## 資料來源

- API：<https://www.bballhot.com/api/Home/PlayerList/45>
- 網站：<https://www.bballhot.com/>

球員數據與比賽紀錄以主辦單位公告為準。

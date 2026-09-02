# 南球人球員數據中心

可依季度／賽季、組別及球隊切換的球員數據看板。網站從 BBallHot 公開 API 取得資料，並將 EventId → GroupId → TeamId 整理成可分享的分層檢視。

## 網站功能

- 依季度／賽季、組別、球隊三級下拉選單切換資料
- 得分、籃板、助攻與效率值隊內領先者
- 支援 eventId、groupId、teamId 網址參數，方便分享指定畫面
- 舊有 ?teamId=1789 黃耆 TCM 網址仍可自動推導所屬季度與組別
- 球員姓名搜尋與主要數據排序
- 桌面完整表格與手機球員卡片
- 每週六、週日晚上 11 點由 GitHub Actions 更新資料並重新部署
- 上游 API 暫時失敗時保留上次成功資料

## 資料更新

工作流程預設於台灣時間每週六、週日晚上 11 點執行，也可以在 GitHub Actions 頁面手動執行 Update player data and deploy Pages。

## 資料來源

- API：<https://www.bballhot.com/api/Home/PlayerList/45>
- 網站：<https://www.bballhot.com/>

球員數據與比賽紀錄以主辦單位公告為準。

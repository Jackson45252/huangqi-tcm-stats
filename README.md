# 五甲 S6 球員數據

五甲 S6 球員數據看板。網站從 BBallHot 公開 API 取得資料，保留 `GroupId` 為 `715` 的球員，並可切換不同球隊。

## 網站功能

- 得分、籃板、助攻與效率值隊內領先者
- 使用下拉選單切換同層級球隊
- 支援 `?teamId=1789` 網址參數預選球隊，方便分享
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

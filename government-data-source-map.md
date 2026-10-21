# 臺灣政府公開資料來源與同步地圖

## 全國聯邦目錄

政府資料開放平臺是 PiSuAI™ 的全國 discovery 層。官方全量目錄位於 `https://data.gov.tw/api/v2/rest/dataset/export`，每日異動位於 `https://data.gov.tw/api/front/dataset/changed/export?format=json&report_date=YYYY-MM-DD`，單筆 metadata 可由 `https://data.gov.tw/api/v2/rest/dataset/{datasetId}` 取得。全量匯出沒有分頁或游標，適合低頻串流下載；每日異動檔應依「資料集上架、資料集修改、資料集下架」狀態處理，缺少狀態者不可直接寫入。

2026 年 9 月 15 日快照經正式 CSV parser 確認有 53,169 筆唯一 datasetId、800 個提供機關標籤與 18 類服務分類。目錄主要採政府資料開放授權條款第 1 版，另有 CC0、CC BY、CC BY-SA 與 OFL；因此 PiSuAI 必須逐筆保存授權，不能把整個目錄一律改標為同一授權。官方條款為 `https://data.gov.tw/license`。

## 中央專業資料入口

| 領域 | 官方入口 | 已確認的同步方式 | 主要限制 |
|---|---|---|---|
| 司法裁判 | `https://opendata.judicial.gov.tw/` | 會員資料集與裁判 API | 需帳密；服務時段、個資、更正與撤下 |
| 中央法規 | `https://law.moj.gov.tw/Service/LawData.aspx` | JSON／XML ZIP 與 schema | 每週整編；以主管機關公布文字為準 |
| 立法資料 | `https://www.ly.gov.tw/Pages/List.aspx?nodeid=116` | 日期窗口 CSV／JSON／XML | 日期與格式切片；影音另有權利限制 |
| 環境資料 | `https://data.moenv.gov.tw/paradigm` | API key、offset／limit | 一般及會員日額度不同 |
| 運輸資料 | `https://tdx.transportdata.tw/` | OData、OIDC token、Swagger | 會員、點數、速率與需審核資料 |
| 健保資料 | `https://info.nhi.gov.tw/IODE0000/IODE0000S01` | metadata API、modified 增量 | 原始內容每次上限；醫療再識別風險 |
| 金融監理 | `https://www.fsc.gov.tw/ch/home.jsp?id=1223&parentpath=0,7` | dataset UUID／alias、資料與匯出 API | 授權與容量須逐資料集確認 |
| 專利商標 | `https://cloud.tipo.gov.tw/S220/opdata/` | FTP、XML／JSON API、OAS | token、附件、圖像、地址與第三人權利 |
| 國家統計 | `https://nstatdb.dgbas.gov.tw/dgbasall/webMain.aspx` | CSV／JSON／XML／PXFile | 保留表號、口徑、基期、單位與缺值碼 |
| 國土圖資 | `https://maps.nlsc.gov.tw/S09SOA/homePage.action?Language=ZH` | OGC WMS／WMTS／WFS 與服務代碼 | 免申請、需申請及付費服務並存 |
| 公共工程 | `https://pcic.pcc.gov.tw/pwc-web/service/api001` | 官方 OAS／服務頁 | 不等同完整政府採購標案 API |

## 地方政府入口

六都原生入口為臺北 `https://data.taipei/`、新北 `https://data.ntpc.gov.tw/`、桃園 `https://opendata.tycg.gov.tw/`、臺中 `https://opendata.taichung.gov.tw/`、臺南 `https://data.tainan.gov.tw/` 與高雄 `https://data.kcg.gov.tw/`。data.gov.tw 已含六都及其餘十六縣市的資料集 metadata，但中央與地方原生目錄可能有同步差。PiSuAI 應以 `source_platform + source_dataset_id` 保存來源身分，再用 publisher OID、canonical URL、schema fingerprint 與 resource URL 建立同源候選，不可僅以標題自動合併。

## 同步政策

PiSuAI 的全國目錄採 metadata-only：保存資料集識別碼、名稱、機關、分類、格式、欄位說明、更新頻率、授權、費用、官方頁、資源連結、版本時間與雜湊，不主動下載所有原始檔。每次異動都保留同步紀錄；下架資料保留歷史狀態而不對外顯示。涉及裁判、醫療、政治獻金、公司關係、不動產交易與裁罰的內容，仍須由治理來源層個別判斷公開方式。

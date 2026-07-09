# Screenshot & Recording Shot List

建议录屏时长控制在 3 到 5 分钟。

## 必拍截图

1. 首页 Workbench：System Ready + Login + Tabs。
2. 登录成功：显示 admin 用户和 checklist。
3. Knowledge Space：`MVP Demo Space` 和样例文档。
4. Pipeline Timeline：validate、document-processing、chunking、embedding、done。
5. Document Metadata：language、securityLevel、hash、cleaner metadata。
6. Agent Debug：thought、retrieval、token、citation、done events。
7. Citation Inspector：展示 chunk/document metadata，不展示完整文档正文。
8. Execution Timeline：memory、planner、retrieval、answer、verification。
9. Metrics Breakdown：agent、retrieval、embedding、provider health。
10. README 架构图：说明系统边界。

## 推荐录屏脚本

1. 用一句话介绍项目：企业级 Agentic RAG MVP。
2. 展示登录和 readiness，说明不是纯静态页面。
3. 展示样例文档入库结果，说明 Document Pipeline。
4. 提问“单笔超过10000元的报销需要谁审批？”。
5. 展示 streaming answer、citation、trace。
6. 打开 metrics / timeline，说明可观测性。
7. 展示 README 架构图，说明 DDD 和 infrastructure 隔离。

## 不要拍

- `.env` 文件。
- API key。
- 数据库密码。
- 完整 provider request/response。
- 大段文档正文。

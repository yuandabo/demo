# FE-02 自测报告（IT-04 · portal 教程详情页·阅读主体与导航）

- **任务ID**: IT-04/FE-02
- **测试时间**: 2026-08-21
- **测试方式**: agent-browser（chromium-1161 内核）+ 真实后端 3000（vite 5173 代理）浏览器验证；边界分支（恶意正文 / histories 失败 / 无小节正文）用 network route stub 注入
- **构建**: `npm run build`（tsc --noEmit 0 Error + vite build）通过（首次构建时 admin/RichEditor.tsx 与 m/Detail.tsx 存在并行任务在途错误，等待其稳定后全量构建通过；本任务文件全程 0 Error）
- **交付文件**: `web/src/portal/pages/Detail.tsx`（页面）、`Detail.css`（复刻样式）、`App.tsx`（路由挂载）、`shared/types.ts`（PortalTutorialDetail/DetailNeighbor/RelatedItem/DetailNotVisibleData 共享类型）、`shared/api.ts`（ApiError 携带失败信封 data，支撑 404 提示页负载）

## AC 验证结果

| AC | 结论 | 证据 |
|----|------|------|
| AC-FN-04 继续阅读 | pass | 登录采购用户滚动 66% 保存 → reload 横幅「已完成 2/4 步（66%），建议从「第 3 步 · 执行运算并解读缺料结果」继续」；点击横幅 scrollTo 正文 66% 位置（articleTop 263 + 66%×1155 − 150 = 875，实测 scrollY=875）；✕ 本会话隐藏 |
| AC-FN-20 已下架提示页 | pass | #24（已下架保留快照）→ 横幅「该教程已下架，正文不可见。可能原因…」+ 同类推荐 3 卡可点（offline-related-7 → #/detail/7）+「浏览更多」→ #/list；正文/目录/进度均不渲染 |
| AC-EG-02 视频失效占位 | pass | #3 videoUrl=cdn.example.com 失效外链，点 ▶ 播放 → 占位「📼 视频暂不可用 / 视频暂不可用，可先阅读图文步骤」；4 步图文完整、进度条与其他功能不受阻断；videoUrl=null（stub）→ 视频节整体不渲染 |
| AC-EG-10 不可见分支 | pass | #20（首次待审）与 #99999（不存在）→ 空态「该教程不存在或暂不可见」，无正文 |
| AC-EG-13 弱网可用 | pass（结构口径） | 正文文字随数据即渲染；DOMPurify 钩子给全部正文 img 注入 loading=lazy + decoding=async，CSS 提供渐变占位底（min-height+虚线框）；视频 preload=none 且 autoplay=false（eval 实测属性） |
| AC-EG-17 进度失败回退 | pass | route stub histories→code500：滚动后仅 2 次请求（原发+静默重试 1 次，时间戳 1787316282245 同毫秒对）、无报错弹窗、进度条不打断；unroute 后 reload 回退最近成功值 25%（横幅「已完成 1/4 步（25%）」，未归零） |
| AC-RULE-11 进度单值覆盖 | pass | 滚动 60% 深度 → 单次 POST /api/histories/3 {"progress":66}（3s 节流，连续滚动仅 1 发）；upsert 后 reload myProgress 即最新保存值 |
| AC-RULE-21 字号三档 | pass | 标准/大/特大 → .dt-article 计算字号 15/17/19px；h1 恒 24px、目录恒 13px、步骤标题恒 16px（仅正文变）；localStorage portal_article_fs 记忆，reload 恢复档位与选中态 |
| UI-IXD-03 目录锚点 | pass | 点击目录第 3 项 → scrollIntoView 平滑滚动，sec-3 顶 =151px（scroll-margin-top 150 生效）；IntersectionObserver（rootMargin −150px/−55%）驱动高亮：载入=视频演示、滚底=第 4 步、回顶=视频演示（修复了带内无命中时的回退规则） |
| UI-IXD-04 字号交互 | pass | 同 AC-RULE-21（档位持久化） |
| UI-IXD-05 上下篇 | pass | #3（首篇）上一篇 disabled、下一篇「采购申请到一键下单」可点 → #/detail/7（其上一篇 title=MRP 自动算料）；#17（分类内唯一）两按钮均 disabled |
| AC-NF-05 弱网可读/视频不自动播放 | pass | 视频 preload=none、autoplay=false、角标「视频外链 · mp4 直链」提示流量来源 |
| UI-ELEM-06 视频占位 | pass | 同 AC-EG-02 |

## 富文本安全（AC-NF-04 口径）

stub 注入 content 含 `<script>alert(1)</script><img src=x onerror=alert(2)><a href="javascript:evil()">`：渲染后 DOM script 节点=0、img 无 onerror 属性（且获 loading=lazy）、a 无 javascript: href；白名单 strong 正常保留。DOMPurify ALLOWED_TAGS=p/h3/strong/b/em/i/u/ul/ol/li/br/img/a/code/blockquote/span + ALLOWED_ATTR=src/alt/href/title。

## Mock / 边界注入测试覆盖摘要

- 真实后端覆盖：200（#3）、404 offline（#24 含 related）、404 invisible（#20/#99999）、POST histories 200/upsert、progress 越界 400（服务层校验复核）
- route stub 注入：恶意正文 XSS、histories 业务 500（重试与回退）、无 h3 纯段落正文（目录与进度条隐藏、空标签「—」）、videoUrl=null（视频节不渲染）
- 游客态：滚动后 histories 请求 0 次（network requests --filter 证实）

## 修复记录（开发中自测发现）

1. 目录高亮在「标题带」内无命中时残留最后一节（回顶不停留首项）→ 增加回退规则：带内无命中时取标题顶最后越过阅读线的节，均未越过回首项
2. 勾选步骤即时保存后，点击引发的轻微滚动可能把旧快照（如 54）排到即时值（75）之后覆盖 → 即时保存前 cancelQueuedProgress 清空待发队列（复测：仅 1 发 {"progress":25}，无尾随覆盖）

## 复刻自检

FE-02-impl.png 全页读图对照 ui_portal_detail.html：顶栏/面包屑/标题区+元信息行/工具条（字号三档+上下篇）/两栏布局/继续阅读横幅/视频区（渐变底+▶+角标）/步骤块（圆点序号 3 勾选）/进度条 75%/侧栏目录（首项选中+左指示条）/信息卡 6 行/相关教程卡，结构与样式一致，无错乱无乱码。

## 范围与遗留

- 互动区（收藏/评价/留言/分享）未实现，留 `detail-interaction-slot` 插槽归 FE-03；`myFavorite/myFeedback` 类型已备（PortalTutorialDetail）
- 侧栏关联推荐 4 卡按任务指令由本任务交付（任务文件原划 FE-03，已记 CHANGE-8 pending）
- 「注意事项」无独立数据字段：正文非「第 N 步」h3 小节按注意事项样式渲染（stub 验证「注意事项」小节正常出橙框），种子数据无此类小节时不渲染
- web 工程无单测命令（scripts 仅 dev/build/preview），按 frontend-dev 规范跳过单测，以上浏览器验证为验收依据
- 知识库：工作区未配置 biz-tech-docs，无疑惑转提问项

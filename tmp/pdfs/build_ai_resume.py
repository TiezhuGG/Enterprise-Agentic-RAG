from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "李宏发_AI应用工程师简历.pdf"
FONT_REGULAR = Path(r"C:\Windows\Fonts\simhei.ttf")

PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT = 42
RIGHT = PAGE_WIDTH - 42
CONTENT_WIDTH = RIGHT - LEFT

NAVY = HexColor("#16253D")
BLUE = HexColor("#1F5FAE")
TEAL = HexColor("#0E8F94")
INK = HexColor("#172033")
MUTED = HexColor("#58677A")
LINE = HexColor("#D9E1EA")
LIGHT = HexColor("#F4F7FA")
LIGHT_BLUE = HexColor("#EDF4FD")


def register_fonts() -> None:
    if not FONT_REGULAR.exists():
        raise FileNotFoundError(f"Chinese font not found: {FONT_REGULAR}")
    pdfmetrics.registerFont(TTFont("ResumeCN", str(FONT_REGULAR)))


def width(text: str, size: float) -> float:
    return pdfmetrics.stringWidth(text, "ResumeCN", size)


def wrap(text: str, size: float, max_width: float) -> list[str]:
    lines: list[str] = []
    line = ""
    for char in text:
        candidate = line + char
        if line and width(candidate, size) > max_width:
            lines.append(line)
            line = char
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def draw_text(c: canvas.Canvas, text: str, x: float, y: float, size: float, color=INK) -> None:
    c.setFillColor(color)
    c.setFont("ResumeCN", size)
    c.drawString(x, y, text)


def draw_paragraph(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    size: float,
    max_width: float,
    leading: float,
    color=INK,
) -> float:
    for line in wrap(text, size, max_width):
        draw_text(c, line, x, y, size, color)
        y -= leading
    return y


def section(c: canvas.Canvas, title: str, y: float) -> float:
    c.setStrokeColor(BLUE)
    c.setLineWidth(1.4)
    c.line(LEFT, y, RIGHT, y)
    draw_text(c, title, LEFT, y + 8, 12, NAVY)
    return y - 20


def bullet(c: canvas.Canvas, text: str, y: float, max_width: float = CONTENT_WIDTH) -> float:
    c.setFillColor(TEAL)
    c.circle(LEFT + 3, y + 3, 1.8, fill=1, stroke=0)
    return draw_paragraph(c, text, LEFT + 12, y, 8.7, max_width - 12, 13.2, INK) - 2


def header(c: canvas.Canvas, subtitle: str, page: int) -> float:
    c.setFillColor(NAVY)
    c.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, stroke=0, fill=1)
    draw_text(c, "李宏发", LEFT, PAGE_HEIGHT - 48, 25, NAVY)
    draw_text(c, subtitle, LEFT, PAGE_HEIGHT - 69, 11, BLUE)
    contact = "13559422200  |  woshitiancai1014@gmail.com"
    draw_text(c, contact, LEFT, PAGE_HEIGHT - 88, 8.7, MUTED)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.line(LEFT, PAGE_HEIGHT - 100, RIGHT, PAGE_HEIGHT - 100)
    draw_text(c, f"{page} / 2", RIGHT - 24, 24, 7.5, MUTED)
    return PAGE_HEIGHT - 126


def skill_card(c: canvas.Canvas, x: float, y: float, title: str, body: str, fill) -> None:
    card_width = (CONTENT_WIDTH - 16) / 3
    card_height = 97
    c.setFillColor(fill)
    c.roundRect(x, y - card_height, card_width, card_height, 5, stroke=0, fill=1)
    draw_text(c, title, x + 10, y - 20, 10, NAVY)
    draw_paragraph(c, body, x + 10, y - 38, 7.8, card_width - 20, 11.3, MUTED)


def project_title(c: canvas.Canvas, title: str, period: str, y: float) -> float:
    draw_text(c, title, LEFT, y, 12.2, NAVY)
    period_width = width(period, 8.5)
    draw_text(c, period, RIGHT - period_width, y + 1, 8.5, MUTED)
    return y - 20


def main_page(c: canvas.Canvas) -> None:
    y = header(c, "AI 应用工程师  |  RAG · Agent · 全栈工程化", 1)

    c.setFillColor(LIGHT_BLUE)
    c.roundRect(LEFT, y - 55, CONTENT_WIDTH, 55, 5, stroke=0, fill=1)
    c.setFillColor(TEAL)
    c.rect(LEFT, y - 55, 4, 55, stroke=0, fill=1)
    draw_text(c, "个人概述", LEFT + 13, y - 17, 10, NAVY)
    y = draw_paragraph(
        c,
        "6 年+前端与全栈研发经验，聚焦 RAG、Agent、模型服务集成与 AI 产品工程化落地；具备从企业工作台、后端服务、数据基础设施到部署与可观测性的独立交付能力。",
        LEFT + 13,
        y - 35,
        8.7,
        CONTENT_WIDTH - 26,
        13,
        INK,
    ) - 18

    y = section(c, "核心技能", y)
    card_width = (CONTENT_WIDTH - 16) / 3
    skill_card(c, LEFT, y, "AI / RAG", "LLM 接入\nLangChain / LangGraph\nRAG · Hybrid Retrieval\nRRF · Reranker · GraphRAG", LIGHT_BLUE)
    skill_card(c, LEFT + card_width + 8, y, "后端与数据", "Node.js · NestJS · Python\nPrisma · PostgreSQL / pgvector\nElasticsearch · Redis · MinIO\nNeo4j · 异步任务", LIGHT)
    skill_card(c, LEFT + (card_width + 8) * 2, y, "前端与工程化", "React · Next.js · Vue 3\nTypeScript · ECharts\nSSE 流式交互\nDocker Compose · GitHub Actions", LIGHT_BLUE)
    y -= 117

    y = section(c, "核心项目", y)
    y = project_title(c, "企业智能知识库管理平台（Agentic RAG）", "2026.06 - 至今", y)
    draw_text(c, "角色：全栈开发 / 项目开发", LEFT, y, 8.7, MUTED)
    y -= 15
    y = draw_paragraph(
        c,
        "面向企业制度、流程与业务文档构建 Agentic RAG 平台，形成从文档入库、混合检索到可追溯问答的完整闭环。",
        LEFT,
        y,
        8.8,
        CONTENT_WIDTH,
        13.5,
        INK,
    ) - 4
    for item in [
        "设计文档入库链路：对象存储、解析清洗、语义分块、Embedding、pgvector 向量索引与 Elasticsearch 关键词索引；通过 Pipeline Job/Event 支持异步处理、失败重试与任务追踪。",
        "构建 Hybrid Retrieval：融合向量检索、BM25 与图谱检索，使用 RRF、Reranker 和上下文 Token 预算完成召回融合与上下文构建。",
        "基于 LangGraph 实现单 Agent 工作流，编排 Memory、Planner、Retrieval、Graph、Answer、Verification 节点；提供 SSE 流式问答、执行轨迹与推理路径。",
        "实现 Tenant、组织、部门、知识空间角色及安全等级组合的访问策略，在检索结果进入上下文前执行权限过滤。",
        "抽象 LLM、Embedding、Reranker、OCR、ASR、视频理解 Provider，兼容 OpenAI-compatible 服务并提供 fallback；建设 Health、Readiness、Provider Smoke、Metrics 与 RAG 评估能力。",
        "开发企业工作台，覆盖知识空间、文档管理、智能搜索、AI 问答、图谱浏览、Agent 调试、系统健康与执行记录。",
    ]:
        y = bullet(c, item, y)

    y -= 7
    y = section(c, "工作经历", y)
    experiences = [
        ("远程开发", "全栈开发", "2024.04 - 至今"),
        ("福建探客猫信息技术有限公司", "前端开发", "2022.04 - 2024.04"),
        ("南威软件股份有限公司", "前端开发", "2020.08 - 2022.04"),
        ("触享网络科技有限公司", "前端开发", "2019.10 - 2020.08"),
    ]
    for index, (company, role, period) in enumerate(experiences):
        if index % 2 == 0:
            c.setFillColor(LIGHT)
            c.rect(LEFT, y - 16, CONTENT_WIDTH, 18, stroke=0, fill=1)
        draw_text(c, company, LEFT + 7, y - 4, 8.5, INK)
        draw_text(c, role, LEFT + 255, y - 4, 8.5, MUTED)
        draw_text(c, period, RIGHT - 99, y - 4, 8.3, MUTED)
        y -= 21


def selected_project(c: canvas.Canvas, title: str, period: str, overview: str, items: list[str], y: float) -> float:
    y = project_title(c, title, period, y)
    y = draw_paragraph(c, overview, LEFT, y, 8.7, CONTENT_WIDTH, 13.1, INK) - 2
    for item in items:
        y = bullet(c, item, y)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(LEFT, y - 5, RIGHT, y - 5)
    return y - 25


def second_page(c: canvas.Canvas) -> None:
    y = header(c, "AI 应用工程师  |  精选独立项目", 2)
    y = section(c, "精选独立项目", y)

    y = selected_project(
        c,
        "AI 电商图片设计平台（独立项目 / 可演示）",
        "2026.05 - 至今",
        "面向电商场景的 AI 图片生产工作台，覆盖商品图生成、风格复刻、图片精修、OCR、文字替换、智能分层与画布编辑。",
        [
            "设计商品图生成、风格复刻和画布编辑等业务模块，形成从素材上传、模型分析、内容生成到结果管理的 AIGC 工作流。",
            "封装文本分析、图像理解、图像生成等多模型调用层；实现异步任务、状态查询和事件推送，优化长耗时生成任务体验。",
        ],
        y,
    )

    y = selected_project(
        c,
        "电商智能客服系统（独立项目 / 可演示）",
        "2026.05 - 至今",
        "面向售前与售后场景设计订单、商品、支付、物流、账户、政策与投诉等业务意图，支持多轮对话与后台运营。",
        [
            "基于 LangGraph 设计按业务域拆分的 Agent 路由与状态管理；结合 Qdrant、查询改写和知识库解析建设检索增强问答链路。",
            "为高金额退款、敏感操作和低置信度回复设计分级处理与人工审核入口，并实现 B 端管理与 C 端聊天界面。",
        ],
        y,
    )

    y = selected_project(
        c,
        "小红书笔记诊断平台（独立项目 / 可演示）",
        "2026.03 - 2026.04",
        "AI 驱动的内容诊断平台，基于多模态模型分析笔记截图并输出内容、视觉、增长和互动等维度的优化建议。",
        [
            "结合确定性规则与 LLM 诊断输出五维评分、雷达图和综合等级，降低纯模型输出的不稳定性。",
            "前端使用 React、ECharts、Framer Motion 完成报告可视化；后端使用 FastAPI、asyncio、SSE 提供异步诊断与流式进度反馈。",
        ],
        y,
    )

    y = section(c, "教育背景与补充能力", y)
    draw_text(c, "福建工程学院", LEFT, y, 10, NAVY)
    draw_text(c, "工业工程 | 本科 | 2011.09 - 2015.06", LEFT, y - 17, 8.7, MUTED)
    y -= 48
    c.setFillColor(LIGHT)
    c.roundRect(LEFT, y - 67, CONTENT_WIDTH, 67, 5, stroke=0, fill=1)
    draw_text(c, "面试可展开方向", LEFT + 12, y - 18, 9.5, NAVY)
    draw_paragraph(
        c,
        "文档入库与切分策略、混合检索与重排、Agent 节点编排、GraphRAG、权限过滤、Provider 诊断、执行可观测性与 Docker 部署。",
        LEFT + 12,
        y - 37,
        8.4,
        CONTENT_WIDTH - 24,
        13,
        MUTED,
    )


def build() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("李宏发 - AI应用工程师简历")
    c.setAuthor("李宏发")
    main_page(c)
    c.showPage()
    second_page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()

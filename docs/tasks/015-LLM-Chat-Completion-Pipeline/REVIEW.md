# TASK-015 Review Checklist

# Architecture

- [ ] Chat独立模块

- [ ] Provider存在

- [ ] Controller无业务逻辑

---

# Retrieval

- [ ] Chat调用RetrievalService

- [ ] 不直接查数据库

---

# Prompt

- [ ] PromptBuilder独立

- [ ] Context注入

- [ ] 防止无依据回答

---

# LLM

- [ ] OpenAI Compatible

- [ ] ConfigService

- [ ] 无process.env

---

# Streaming

- [ ] SSE

- [ ] Token级输出

---

# Forbidden

- [ ] Agent

- [ ] Memory

- [ ] LangGraph

- [ ] GraphRAG

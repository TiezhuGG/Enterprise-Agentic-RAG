# TASK-014 Review Checklist

# Architecture

- [ ] Reranker独立模块

- [ ] Provider抽象存在

- [ ] Retrieval不包含rerank逻辑

---

# Provider

- [ ] BGE兼容

- [ ] API配置统一

- [ ] 不读取process.env

---

# Pipeline

- [ ] RRF之后执行

- [ ] TopN限制

- [ ] TopK输出

---

# Context

- [ ] Token Budget

- [ ] Score排序

- [ ] 防止Context爆炸

---

# Forbidden

- [ ] 不生成Answer

- [ ] 不调用Chat Completion

- [ ] 不实现Agent

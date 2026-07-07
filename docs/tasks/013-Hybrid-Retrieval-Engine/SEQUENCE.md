# TASK-013 Retrieval Sequence

# Query Flow

User Query

|

RetrievalService

|

Create Query Context

|

Query Embedding

|

+-------------------+

| |

Vector Search Keyword Search

| |

+---------+---------+

          |

         RRF


          |

Permission Filter

          |

Context Builder

---

# Vector Flow

query

|

EmbeddingProvider

|

VectorClient

|

Candidate Chunks

---

# Keyword Flow

query

|

Full Text Search

|

Candidate Chunks

---

# Final Result

Context[]

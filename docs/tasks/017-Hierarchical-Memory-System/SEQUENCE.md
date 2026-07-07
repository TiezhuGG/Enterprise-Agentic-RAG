# TASK-017 Sequence Diagram

## Chat With Memory

User

|

ChatController

|

ChatService

|

MemoryService

|

+----------------+

| |

Redis Mem0

| |

Recent User Facts

| |

+---------------+

          |

PromptBuilder

          |

RetrievalContext

          |

LlmProvider

          |

Answer

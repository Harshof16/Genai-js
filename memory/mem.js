import "dotenv/config";

import { Memory } from "mem0ai/oss";

const config = {
  vectorStore: {
    provider: "qdrant",
    config: {
      collectionName: "memories",
      embeddingModelDims: 1536,
      host: "localhost",
      port: 6333,
    },
  },
};

const mem = new Memory(config);

mem.add([{role: 'user', content: 'My name is Hola'}], { userId: "harsh" });

const allMemories = await mem.getAll({ userId: "harsh" });
console.log(allMemories);

import "dotenv/config";
import { Memory } from "mem0ai/oss";
import OpenAI from "openai";

const client = new OpenAI();

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
  enableGraph: true,
  graphStore: {
    provider: "neo4j",
    config: {
      url: "neo4j://localhost:7687",
      username: "neo4j",
      password: "reform-william-center-vibrate-press-5829",
    },
  },
};

const mem = new Memory(config);

async function chat(query = "") {
  //searching memories by userId
  const memories = await mem.search(query, { userId: "harsh" });
  const memoryContext = memories.results.map((e) => e.memory).join("\n");

  console.log("memories", memoryContext);

  const SYSTEM_PROMPT = `
    Context About User:
    ${memoryContext}
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
  });

  console.log(`\n\n\nBot:`, response.choices[0].message.content);
  console.log("Adding to memory...");

  await mem.add(
    [
      { role: "user", content: query },
      { role: "assistant", content: response.choices[0].message.content },
    ],
    { userId: "harsh" }
  );

  console.log("Adding to memory done...");
}

chat("Hitesh is a mentor of Harsh. Who is Hitesh?");


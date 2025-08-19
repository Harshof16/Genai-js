import 'dotenv/config';
import OpenAI from "openai";
import { QdrantVectorStore } from '@langchain/qdrant';
import dotenv from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
dotenv.config({ path: '../.env' })

// first we run indexing.js file to index the documents
// then we run this file to retrieve the relevant chunks based on user query

// for retrieval this file is made
const client = new OpenAI();

async function chat() {

    const userQuery = 'Can you tell me about debuggin in Node.js?';

    //have to convert user query into vector embedding

    // Ready the client OpenAI Embedding Model
    const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
    });

    // from existing collection making the vector store
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        collectionName: 'notebook-collection',
        url: 'http://localhost:6333',
    })

    // telling the vector store to search for relevant chunks
    const vectorSearcher = vectorStore.asRetriever({
        k: 3, // number of documents (relevant chunks) to retrieve
    })

    // now have to search for relevant chunks based on user query
    // this will return the relevant chunks based on user query
    const relevantChunks = await vectorSearcher.invoke(userQuery)


    // Given our system prompt
    const SYSTEM_PROMPT = `
    You are an AI assistant who helps resolving user query based on the
    context available to you from a PDF file with the content and page number.

    Only answer based on the available context from file only.

    Context:
    ${JSON.stringify(relevantChunks)}
  `;

    // Now we can use the OpenAI client to create a chat completion
    // with the system prompt and user query
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userQuery },
        ],
    });

    console.log(`> ${response.choices[0].message.content}`);
}

chat();
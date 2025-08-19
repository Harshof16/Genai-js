import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

async function init() {
    const filePath = './nodejs.pdf';
    const loader = new PDFLoader(filePath);

    // 1. Load documents from the PDF file
    const docs = await loader.load();

    // Ready the client OpenAI Embedding Model
    const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
    });

    // now have to make vector embeddings of using above docs, but we've to store that in a vector store
    const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
        collectionName: 'notebook-collection',
        url: 'http://localhost:6333',
    })

    console.log('Indexing of documents done...');
}

init();
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function main() {
    try {
          // These api calls are stateless (Zero Shot)
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {role: 'system', content: 'You are an AI assistant who is expert at selling products.'},
                {role: 'user', content: 'What is the best way to sell a new product?'},
            ]
        })
        console.log('Response:', response.choices[0].message.content);
    }
    catch (error) {
        console.error('Error creating chat completion:', error);
    }
}

main();
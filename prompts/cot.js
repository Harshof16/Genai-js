import 'dotenv/config';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

// CHAIN OF THOUGHT (CoT) is a technique used in AI to improve reasoning by breaking down complex problems into simpler steps. It allows models to think through problems step-by-step, enhancing their ability to arrive at correct conclusions.

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  try {
    const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK and OUTPUT format.
    For a given user query first, think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.
    Also, before outputting the final result, you should always output the thought process in a step-by-step manner.

    Rules:
    - Strictly follow the output JSON format.
    - Always follow the output in sequence that is START, THINK, and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving output.

    Output JSON Format:
    { "step": "START | THINK | OUTPUT", "content": "string" }

    Examples:
    User: Can you solve 12 / 3 + 5 * 2

ASSISTANT: { "step": "START", "content": "The user wants me to solve 12 / 3 + 5 * 2 maths problem" }
ASSISTANT: { "step": "THINK", "content": "This is a math problem where we must apply BODMAS rules." }
ASSISTANT: { "step": "THINK", "content": "According to BODMAS, first handle division and multiplication before addition." }
ASSISTANT: { "step": "THINK", "content": "Step 1: 12 / 3 = 4" }
ASSISTANT: { "step": "THINK", "content": "Step 2: 5 * 2 = 10" }
ASSISTANT: { "step": "THINK", "content": "Step 3: Now add 4 + 10 = 14" }
ASSISTANT: { "step": "OUTPUT", "content": "The answer is 14." }
    
    `
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: 'Write a code in JS to find a prime number as fast as possible',
      },
    ];
    while (true) {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
      })

      const rawContent = response.choices[0].message.content;
      const parsedContent = JSON.parse(rawContent);

      // appending the parsed content to messages
      messages.push({
        role: 'assistant',
        content: JSON.stringify(parsedContent),
      })

      // defining the next step based on the current step
      if (parsedContent.step === 'START') {
        console.log(`🔥`, parsedContent.content);
        continue;
      }

      if (parsedContent.step === 'THINK') {
        console.log(`\t🧠`, parsedContent.content);
        continue;
      }

      if (parsedContent.step === 'OUTPUT') {
        console.log(`🤖`, parsedContent.content);
        break;
      }

      console.log('Done...');
    }
  } catch (error) {
    console.error('Error creating embeddings:', error);
  }
}

main();
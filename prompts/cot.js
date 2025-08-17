import 'dotenv/config';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' })

// CHAIN OF THOUGHT (CoT) is a technique used in AI to improve reasoning by breaking down complex problems into simpler steps. It allows models to think through problems step-by-step, enhancing their ability to arrive at correct conclusions.

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function main() {
  try {
    const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK, EVALUATE and OUTPUT format.
    For a given user query first, think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.
    Also, before outputting the final result, you should always output the thought process in a step-by-step manner.

    Rules:
    - Strictly follow the output JSON format.
    - Always follow the output in sequence that is START, THINK, and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving output.

    Output JSON Format:
    { "step": "START | THINK | EVALUATE | OUTPUT", "content": "string" }

    Examples:
    User: Can you solve 12 / 3 + 5 * 2

ASSISTANT: { "step": "START", "content": "The user wants me to solve 12 / 3 + 5 * 2 maths problem" }

ASSISTANT: { "step": "THINK", "content": "This is a math problem where we must apply BODMAS rules." }
ASSISTANT: { "step": "EVALUATE", "content": "✅ Correct: using BODMAS is the right approach." }

ASSISTANT: { "step": "THINK", "content": "Step 1: 12 / 3 = 6" }
ASSISTANT: { "step": "EVALUATE", "content": "❌ Incorrect: 12 divided by 3 is 4, not 6." }

ASSISTANT: { "step": "THINK", "content": "Correcting: Step 1 should be 12 / 3 = 4." }
ASSISTANT: { "step": "EVALUATE", "content": "✅ Now correct, 12 / 3 = 4." }

ASSISTANT: { "step": "THINK", "content": "Step 2: 5 * 2 = 10" }
ASSISTANT: { "step": "EVALUATE", "content": "✅ Correct: multiplication is fine." }

ASSISTANT: { "step": "THINK", "content": "Step 3: 4 + 10 = 14" }
ASSISTANT: { "step": "EVALUATE", "content": "✅ Correct: addition is valid." }

ASSISTANT: { "step": "EVALUATE", "content": "All steps are now correct. Final output verified." }

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
      });

      const rawContent = response.choices[0].message.content;
      // Stricter regex to match the expected JSON format for step and content
      const jsonMatch = rawContent.match(/\{\s*"step"\s*:\s*"(START|THINK|EVALUATE|OUTPUT)"\s*,\s*"content"\s*:\s*"[^"]*"\s*\}/);

      if (!jsonMatch) {
        console.error("❌ No valid JSON found:", rawContent);
        continue;
      }

      try {
        const parsedContent = JSON.parse(jsonMatch[0]);

        // Push parsed response into conversation history
        messages.push({
          role: 'assistant',
          content: JSON.stringify(parsedContent),
        });

        // Handle steps
        if (parsedContent.step === 'START') {
          console.log(`🔥 START:`, parsedContent.content);
          continue;
        }

        if (parsedContent.step === 'THINK') {
          console.log(`\t🧠 THINK:`, parsedContent.content);

          // Add evaluation request for another LLM
          messages.push({
            role: 'developer',
            content: JSON.stringify({
              step: 'EVALUATE',
              content: `Evaluate the last thought: ${parsedContent.content}`
            })
          });

          // Gemini evaluation (short one-liner verdict only)
          const evalResponse = await gemini.chat.completions.create({
            model: 'gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: `In ONE short sentence, evaluate the reasoning below as either correct (✅) or flawed (❌). 
Do NOT provide code, only a verdict.

Reasoning: ${parsedContent.content}`
              }
            ]
          });

          console.log(`\t✅ EVALUATION:`, evalResponse.choices[0].message.content);

          continue;
        }

        if (parsedContent.step === 'OUTPUT') {
          console.log(`🤖 OUTPUT:`, parsedContent.content);
          break;
        }

        console.log('⚡ Done with step...');
      } catch (error) {
        console.error('🚨 Error parsing JSON:', error);
      }
    }

  } catch (error) {
    console.error('Error creating embeddings:', error);
  }
}

main();
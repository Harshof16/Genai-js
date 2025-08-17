import OpenAI from "openai";
import 'dotenv/config';
import axios from "axios";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getWeatherDetailsByCity(cityname = '') {
    const url = `https://wttr.in/${cityname.toLowerCase()}?format=%C+%t`;
    const { data } = await axios.get(url, { responseType: 'text' });
    return `The current weather of ${cityname} is ${data}`
}

const TOOL_MAP = {
    getWeatherDetailsByCity: getWeatherDetailsByCity
};

async function main() {
    const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK and OUTPUT format.
    For a given user query first, think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.

    Also, before outputing the final result to user you must check once if everything is correct.
    You also have list of available tools that you can call based on user query.

    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - getWeatherDetailsByCity(cityname: string): Returns the current weather data of the city.
    - getGithubUserInfoByUsername(username: string): Retuns the public info about the github user using github api
    - executeCommand(command: string): Takes a linux / unix command as arg and executes the command on user's machine and returns the output

    Rules:
    - Strictly follow the output JSON format.
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Always make sure to do multiple steps of thinking before giving output.
    - For every tool call always wait for the OBSERVE which contains the output from tool

    Output JSON Format:
    { "step": "START | THINK | EVALUATE | OUTPUT | OBSERVE | TOOL", "content": "string", "tool_name": "string", "input": "string" }

    Example:
    User: Hey, can you tell me weather of Lucknow?
    ASSISTANT: { "step": "START", "content": "The user is interested in the current weather details about Lucknow" } 
    ASSISTANT: { "step": "THINK", "content": "Let me see if there is any available tool for this query" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available getWeatherDetailsByCity which returns current weather data" } 
    ASSISTANT: { "step": "THINK", "content": "I need to call getWeatherDetailsByCity for city Lucknow to get weather details" }
    ASSISTANT: { "step": "TOOL", "input": "Lucknow", "tool_name": "getWeatherDetailsByCity" }
    DEVELOPER: { "step": "OBSERVE", "content": "The weather of Lucknow is cloudy with 27 Cel" }
    ASSISTANT: { "step": "THINK", "content": "Great, I got the weather details of Lucknow" }
    ASSISTANT: { "step": "OUTPUT", "content": "The weather in Lucknow is 27 C with little cloud. Please make sure to carry an umbrella with you. ☔️" }
    `
    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT,
        },
        {
            role: 'user',
            content: 'The current weather in lucknow',
        },
    ];

    while (true) {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages
        })
        const rawContent = response.choices[0].message.content;
        const parsedContent = JSON.parse(rawContent);

        messages.push({
            role: 'assistant',
            content: JSON.stringify(parsedContent)
        })

        if (parsedContent.step === 'START') {
            console.log(`🔥`, parsedContent.content);
            continue;
        }

        if (parsedContent.step === 'THINK') {
            console.log(`\t💭`, parsedContent.content);
            continue;
        }

        if (parsedContent.step === 'TOOL') {
            const toolToCall = parsedContent.tool_name;
            if (!TOOL_MAP[toolToCall]) {
                messages.push({
                    role: 'developer',
                    content: `There is no such tool as ${toolToCall}`,
                });
                continue;
            }

            const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
            console.log(
                `🛠️: ${toolToCall}[${parsedContent.input}] = `,
                responseFromTool
            );
            messages.push({
                role: 'developer',
                content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
            });
            continue;
        }

        if (parsedContent.step === 'OUTPUT') {
            console.log(`🤖`, parsedContent.content);
            break;
        }
    }
    console.log('Done...');
}

main();
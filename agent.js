import OpenAI from "openai";
import 'dotenv/config';
import axios from "axios";
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getWeatherDetailsByCity(cityname = '') {
    const url = `https://wttr.in/${cityname.toLowerCase()}?format=%C+%t`;
    const { data } = await axios.get(url, { responseType: 'text' });
    return `The current weather of ${cityname} is ${data}`
}

async function saveWeatherToFile(folderName = "checkWeather", fileName = "weather.txt", content = "") {
    const folderPath = path.join(process.cwd(), folderName);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Write content to file
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, content, "utf-8");

    return `Weather details saved to ${filePath}`;
}

// async function executeCommand(cmd = '') {
//     return new Promise((res, rej) => {
//         exec(cmd, (err, data) => {
//             if (err) {
//                 return res(`Error running command ${err}`);
//             } else {
//                 res(data);
//             }

//         })
//     })
// }

const TOOL_MAP = {
    getWeatherDetailsByCity: getWeatherDetailsByCity,
    // executeCommand: executeCommand,
    saveWeatherToFile: saveWeatherToFile
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    - saveWeatherToFile(folderName: string, fileName: string, content: string): Creates a folder (if it doesn't exist) and saves the provided content into a file inside that folder.

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

    rl.question('Enter the city name: ', async (cityName) => {
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: `Tell me the weather of ${cityName} and creata a folder named "checkWeather" in the same directory and save the weather details in a file named "weather.txt" inside that folder`,
            },
        ];

        mainLoop: while (true) {
            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages
            });
            const rawContent = response.choices[0].message.content;

            let cleaned = rawContent
                .trim()
                .replace(/(ASSISTANT:|DEVELOPER:)/g, '')
                .trim();

            if (!cleaned.startsWith("[")) {
                cleaned = `[${cleaned.replace(/}\s*{/g, '},{')}]`;
            }

            const parsedArray = JSON.parse(cleaned);

            try {
                for (const parsedContent of parsedArray) {
                    messages.push({
                        role: 'assistant',
                        content: JSON.stringify(parsedContent)
                    });

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
                        const input = parsedContent.input;

                        if (!TOOL_MAP[toolToCall]) {
                            messages.push({
                                role: 'developer',
                                content: `There is no such tool as ${toolToCall}`,
                            });
                            continue;
                        }

                        let responseFromTool;

                        // Special handling for saving weather to file
                        if (toolToCall === 'saveWeatherToFile') {
                            if (!global.weatherDetails) {
                                console.error("⚠️ No weather details available to save!");
                                continue;
                            }

                            responseFromTool = await TOOL_MAP[toolToCall](
                                'checkWeather',      // folder
                                'weather.txt',       // file
                                global.weatherDetails // content to write
                            );
                            console.log(`🛠️: saveWeatherToFile =`, responseFromTool);
                        } else {
                            responseFromTool = await TOOL_MAP[toolToCall](input);
                            console.log(`🛠️: ${toolToCall}[${input}] =`, responseFromTool);

                            // Store the latest weather details globally if it's weather tool
                            if (toolToCall === 'getWeatherDetailsByCity') {
                                global.weatherDetails = responseFromTool;
                            }
                        }

                        messages.push({
                            role: 'developer',
                            content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
                        });

                        continue;
                    }

                    if (parsedContent.step === 'OUTPUT') {
                        console.log(`🤖`, parsedContent.content);
                        break mainLoop;  // breaks the outer while loop
                    }
                }
            } catch (error) {
                console.error("❌ Error parsing JSON:", error, rawContent);
                continue;
            }
        }

        console.log('Done...');
        rl.close();
    })
}

main();
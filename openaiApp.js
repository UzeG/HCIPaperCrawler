import fs from 'node:fs';
import OpenAI from "openai";
import { BASE_URL, API_KEY } from './openaiConfig.js'
const openai = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY
});

/**
 * 
 * @param {string} content 
 * @returns 
 */
const getCompletion = async (content) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: content
            },
        ],
    });
    return completion;
}

/**
 * 
 * @param {string} title 
 * @param {string} abstract 
 * @returns 
 */
const getPrompt = (title, abstract) => `
你现在是一名人机交互领域的专家。
我会给你提供 
你需要根据给定的title和abstract总结一些内容。
总结的内容包括论文中文标题，使用的方法，解决的问题，创新点，关键词。
你需要返回给我 json 形式的字符串，示例回复：
{
    "title": "xxx",
    "method": "xxx",
    "solved": "xxx",
    "innovation": "xxx",
    "key": ["a", "b", ...]
}
注释：你需要用中文描述上述字段；请使用人机交互专业领域的相关术语，如在关键词key字段，如果标题和摘要涉及眼动交互则该篇论文的key字段包括了"眼动"这个关键词，同理如果涉及被动触觉则该篇论文的key字段包括了"被动触觉"这个关键词。
title: ${title}
abstract: ${abstract}
`;

const test = async () => {
    const completion = await getCompletion('hello!');
    console.log(completion.choices[0].message['content']);
}

(async function () {
    const paperData = JSON.parse(fs.readFileSync('./chi-lbw-2024-2.json', 'utf-8'));

    let i = 0;
    const analysedData = [];
    for (const item of paperData) {
        const { title, abstract } = item;
        const prompt = getPrompt(title, abstract);

        let paredMsg = undefined;
        while (true) {
            try {
                const completion = await getCompletion(prompt);
                const msg = completion.choices[0].message['content'];
                paredMsg = JSON.parse(msg);
                break;
            } catch { }
        }
        if (paredMsg == undefined) {
            console.log(`索引 ${i} 不明错误`);
            return;
        }
        analysedData.push(paredMsg);
        console.log(`${++i}/${paperData.length}`);
    }

    JSON.parse(fs.writeFileSync('chi-lbw-2024-a.json', JSON.stringify(analysedData), 'utf-8'))
})()
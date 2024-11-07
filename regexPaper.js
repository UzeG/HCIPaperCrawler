import fs from 'node:fs';

// 解析并格式化单个 BibTeX 字符串
function formatBibtex(bibtex) {
    const regex = /@(\w+)\{([^,]+),\s*([^]+)\}$/;
    const match = bibtex.match(regex);

    if (!match) return null;

    const [, entryType, entryKey, entryContent] = match;

    const formattedEntry = { type: entryType, key: entryKey };

    const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(entryContent)) !== null) {
        const fieldKey = fieldMatch[1].trim();
        const fieldValue = fieldMatch[2].trim();
        formattedEntry[fieldKey] = fieldValue;
    }

    formattedEntry['bibtex'] = bibtex;

    return formattedEntry;
}

// 定义包含多个 JSON 文件路径的列表
const fileList = ['chi-ea-2024.json', 'chi-2024.json'];

// 存储合并的 BibTeX 数据
let combinedBibtexList = [];

// 读取每个文件并将内容合并到一个数组中
fileList.forEach(file => {
    const rawData = fs.readFileSync(file, 'utf8');
    const bibtexList = JSON.parse(rawData);
    combinedBibtexList = combinedBibtexList.concat(bibtexList);
});

// 处理 JSON 列表中的每个 BibTeX 字符串
const formattedEntries = combinedBibtexList.map(formatBibtex).filter(entry => entry !== null);

// 将处理后的数据写入新的 JSON 文件
fs.writeFileSync('CHI2024.json', JSON.stringify(formattedEntries, null, 2), 'utf8');

console.log('BibTeX 数据已成功处理并保存为 JSON 格式的文件 "CHI2024.json"');

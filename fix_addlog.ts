import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// Replace !addLog with !setLogs
content = content.replace('if (!quickLogContent.trim() || !addLog) return;', 'if (!quickLogContent.trim() || !setLogs) return;');

// Replace addLog({ ... }) with setLogs([ { ... }, ...logs ])
let addLogReplacement = `setLogs([{
                      id: "log_" + Date.now().toString(),
                      date: selectedDateStr,
                      content: quickLogContent.trim(),
                      location: quickLogLocation.trim() || undefined,
                      emoji: quickLogEmoji,
                      type: quickLogType as 'Reflection' | 'Event',
                      createdAt: Date.now()
                    }, ...logs]);`;

const addLogRegex = /addLog\(\{\s*id: "log_".*\s*date: selectedDateStr,\s*content: quickLogContent.trim\(\),\s*location: quickLogLocation.trim\(\) \|\| undefined,\s*emoji: quickLogEmoji,\s*type: quickLogType,\s*createdAt: Date.now\(\)\s*\}\);/m;

if(addLogRegex.test(content)) {
    content = content.replace(addLogRegex, addLogReplacement);
    fs.writeFileSync('src/components/DigitalJournal.tsx', content);
    console.log("Fixed addLog -> setLogs");
} else {
    // maybe quickLogType as... 
    const fallbackRegex = /addLog\(\{[\s\S]*?\}\);/;
    content = content.replace(fallbackRegex, addLogReplacement);
    fs.writeFileSync('src/components/DigitalJournal.tsx', content);
    console.log("Fixed addLog -> setLogs (fallback regex)");
}

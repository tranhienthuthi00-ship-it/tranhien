import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// The calendar starts after {/* MAIN LAYOUT */}
const calStart = content.indexOf('{/* LEFT: CALENDAR */}');
const calEnd = content.indexOf('{/* MIDDLE: TO DO LIST */}');

if (calStart !== -1 && calEnd !== -1) {
    let calBlock = content.substring(calStart, calEnd);
    calBlock = calBlock.replaceAll('font-hand', 'font-caveat');
    content = content.substring(0, calStart) + calBlock + content.substring(calEnd);
    fs.writeFileSync('src/components/DigitalJournal.tsx', content);
    console.log("Updated font to caveat in Calendar");
}

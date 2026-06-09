import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const mStart = content.indexOf('{/* CALENDAR DETAILS MODAL */}');
const mEnd = content.indexOf('return (', mStart); // wait this is wrong it's at the end of the file

if (mStart !== -1) {
    let mBlock = content.substring(mStart);
    mBlock = mBlock.replaceAll('font-hand', 'font-caveat');
    content = content.substring(0, mStart) + mBlock;
    fs.writeFileSync('src/components/DigitalJournal.tsx', content);
    console.log("Updated font to caveat in Modal");
}

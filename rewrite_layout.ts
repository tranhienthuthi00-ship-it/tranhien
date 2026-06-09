import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const srt1 = content.indexOf('{/* 3-COLUMN MAIN LAYOUT */}');
const end1 = content.indexOf('{/* BOTTOM: PERSONAL FINANCE OVERVIEW */}');

if (srt1 === -1 || end1 === -1) {
    console.error("Not found");
    process.exit(1);
}

let topPart = content.substring(srt1, end1);

// Within topPart, let's separate CALENDAR, TODO, and BUCKET LIST
const ccalS = topPart.indexOf('{/* LEFT: CALENDAR */}');
const ctdoS = topPart.indexOf('{/* MIDDLE: TO DO LIST & EVENTS */}');
const cbucS = topPart.indexOf('{/* RIGHT: BUCKET LIST */}');

// Before cbucS, there is a closing </div> for the grid. Wait!
// The grid ends after bucket list.
// Let's locate the grid div closing tag.
// Actually bucketBlock ends at the closing </div> of the main grid. We need to strip that </div>.
let beforeBucket = topPart.substring(0, cbucS);
let bucketBlock = topPart.substring(cbucS);

// Let's strip the last </div> from bucketBlock, which corresponds to the grid
const lastDivIdx = bucketBlock.lastIndexOf('</div>');
if(lastDivIdx !== -1) {
    bucketBlock = bucketBlock.substring(0, lastDivIdx);
}

const calendarBlock = topPart.substring(ccalS, ctdoS);
const todoBlock = topPart.substring(ctdoS, cbucS);

// Now compose a new layout
const newLayout = `        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr] gap-6 xl:gap-12 items-start max-w-6xl mx-auto">
            ${calendarBlock}
            ${todoBlock}
        </div>

        {/* BOTTOM: BUCKET LIST */}
        <div className="pt-24 z-20 w-full max-w-5xl mx-auto">
            ${bucketBlock.replace('className="relative pt-8 z-20"', 'className="relative pt-8 z-20 w-full"')}
        </div>
`;

content = content.substring(0, srt1) + newLayout + content.substring(end1);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Layout rewritten");

import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const old = `const [localInteractiveTasks, setLocalInteractiveTasks] = useState([
    { id: 't1', text: 'Clean my room', done: false, isReal: false }, 
    { id: 't2', text: 'Study English', done: false, isReal: false }, 
    { id: 't3', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't4', text: 'To do 1', done: false, isReal: false },
    { id: 't5', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't6', text: 'To do 2', done: false, isReal: false },
    { id: 't7', text: 'Clean my room', done: false, isReal: false },
    { id: 't8', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't9', text: 'To do 2', done: false, isReal: false },
  ]);`;
const newS = `const [localInteractiveTasks, setLocalInteractiveTasks] = useSyncedState("studyHub_localInteractiveTasks", [
    { id: 't1', text: 'Clean my room', done: false, isReal: false }, 
    { id: 't2', text: 'Study English', done: false, isReal: false }, 
    { id: 't3', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't4', text: 'To do 1', done: false, isReal: false },
    { id: 't5', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't6', text: 'To do 2', done: false, isReal: false },
    { id: 't7', text: 'Clean my room', done: false, isReal: false },
    { id: 't8', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't9', text: 'To do 2', done: false, isReal: false },
  ]);`;

content = content.replace(old, newS);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Updated localInteractiveTasks");

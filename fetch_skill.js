import fs from 'fs';
async function run() {
  const res = await fetch('https://raw.githubusercontent.com/zarazhangrui/codebase-to-course/main/SKILL.md');
  const text = await res.text();
  fs.writeFileSync('temp.md', text);
}
run();

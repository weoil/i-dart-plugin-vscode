import * as fs from "mz/fs";
import * as path from "path";

export function readFile(src: string) {
  return fs.readFileSync(src, "utf8");
}
export function writeFile(src: string,str:string) {
  return fs.writeFileSync(src, str);
}
export function findMatching(str: string, startChar: string, endChar: string) {
  let count = 1;
  let startIndex = str.indexOf(startChar) + 1;
  for (let i = startIndex; i <= str.length; i++) {
    const char = str.charAt(i);
    if (char === startChar) {
      count++;
    } else if (char === endChar) {
      count--;
      if (count === 0) {
        console.log(str.slice(0,i));
        return i;
      }
    }
  }
  throw new Error("not found");
}
export function insertText(str:string,i:number,s:string) {
  return str.slice(0,i)+s+str.slice(i);
}
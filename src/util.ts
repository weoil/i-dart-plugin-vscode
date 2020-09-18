import * as fs from "mz/fs";
import * as path from "path";
import * as vscode from "vscode";

export function readFile(src: string) {
  return fs.readFileSync(src, "utf8");
}
export function writeFile(src: string, str: string) {
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
        return i;
      }
    }
  }
  throw new Error("not found");
}
export function insertText(str: string, i: number, s: string) {
  return str.slice(0, i) + s + str.slice(i);
}

export function toFirstUpper(str: string) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

export function getPosition(str: string, index: number) {
  let over = 0;
  let col = 0;
  for (let i = 0; i <= index; i++) {
    const char = str.charAt(i);
    if (char === "\n") {
      col++;
      over = over + (i - over);
    }
  }
  return new vscode.Position(col, index - over);
  // return {
  //   col: col,
  //   row: index - over,
  // };
}

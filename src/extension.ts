// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import {
  readFile,
  writeFile,
  findMatching,
  insertText,
  toFirstUpper,
  getPosition,
  useEditBuilder,
} from "./util";
import { execSync } from "mz/child_process";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "i-dart-plugin" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  let newAction = vscode.commands.registerCommand(
    "extension.NewAction",
    async (uri) => {
      const dirPath = path.parse(uri?.path).dir.substr(1);
      const effectPath = path.resolve(dirPath, "effect.dart");
      const actionPath = path.resolve(dirPath, "action.dart");
      const reducerPath = path.resolve(dirPath, "reducer.dart");
      try {
        let newActionName = await vscode.window.showInputBox({
          password: false,
          ignoreFocusOut: false,
          placeHolder: "New Action Name",
        });
        if (!newActionName) {
          return;
        }
        newActionName = newActionName.trim();
        // const newActionName = "ffff";
        const outFile = await vscode.window.showQuickPick([
          "Reducer",
          "Effect",
        ]);

        if (!outFile || (outFile !== "Reducer" && outFile !== "Effect")) return;

        // const outFile: "Reducer" | "Effect" = "Effect";
        const baseName = await modifyAction(actionPath, newActionName);
        if ((outFile as any) === "Reducer") {
          await modifyReducer(reducerPath, baseName, newActionName);
        } else if (outFile === "Effect") {
          await modifyEffect(effectPath, baseName, newActionName);
        }
      } catch (e) {
        console.error(e);
      }
    }
  );
  context.subscriptions.push(newAction);
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function modifyAction(
  src: string,
  newActionName: string
): Promise<string> {
  const doc = await vscode.workspace.openTextDocument(src);
  let file = doc.getText();
  const editor = await vscode.window.showTextDocument(doc);

  const actionName = /enum(.*)\{/.exec(file)?.[1].trim();
  if (!actionName) {
    throw new Error("没有找到Action声明");
  }
  const baseName = actionName.replace("Action", "");
  const globalActinName = `${baseName}Action`;
  const upperActionName = toFirstUpper(newActionName);
  const actionCreatorText = `
  static Action on${upperActionName}() {
  return const Action(${globalActinName}.${newActionName});
  }
  `;
  return new Promise((resolve) => {
    editor.edit((builder) => {
      let enumIndex = file.indexOf("enum ");
      let lastIndex = file.indexOf("}", enumIndex);
      const lastHasComma = file
        .substring(enumIndex, lastIndex + 1)
        .replace(/[ \n]/g, "")
        .includes(",}");
      let pos = getPosition(file, lastIndex - 1);
      builder.insert(pos, `${lastHasComma ? "" : ","}${newActionName}`);
      let classIndex = file.indexOf("class");
      let okIndex = findMatching(file.substr(classIndex), "{", "}");
      builder.insert(
        getPosition(file, classIndex + okIndex - 1),
        actionCreatorText
      );
      formatFile(doc.uri, editor).then(() => {
        resolve(baseName);
      });
    });
  });
}

async function modifyReducer(
  src: string,
  baseName: string,
  newActionName: string
) {
  const doc = await vscode.workspace.openTextDocument(src);
  const editor = await vscode.window.showTextDocument(doc);
  const file = doc.getText();
  const globalActinName = `${baseName}Action`;
  const globalStateName = `${baseName}State`;
  const upperActionName = toFirstUpper(newActionName);
  const funcName = `_on${upperActionName}`;
  const funcContent = `
  ${globalStateName} _on${upperActionName}(${globalStateName} state, Action action) {
    final ${globalStateName} newState = state.clone();
    return newState;
  }
`;
  editor.edit((builder) => {
    let startIndex = file.indexOf("asReducer");
    let lastIndex = file.indexOf("}", startIndex);
    const lastHasComma = file
      .substring(startIndex, lastIndex + 1)
      .replace(/[ \n]/g, "")
      .includes(",}");
    let pos = getPosition(file, lastIndex - 1);
    builder.insert(
      pos,
      `${
        lastHasComma ? "" : ","
      } ${globalActinName}.${newActionName}: ${funcName}`
    );
    builder.insert(new vscode.Position(doc.lineCount + 1, 0), funcContent);
    formatFile(doc.uri, editor);
  });
}
async function modifyEffect(
  src: string,
  baseName: string,
  newActionName: string
) {
  const doc = await vscode.workspace.openTextDocument(src);
  const editor = await vscode.window.showTextDocument(doc);
  const file = doc.getText();
  const globalActinName = `${baseName}Action`;
  const globalStateName = `${baseName}State`;
  const upperActionName = toFirstUpper(newActionName);
  const funcName = `_on${upperActionName}`;
  const funcContent = `
  void ${funcName}(Action action, Context<${globalStateName}> ctx) {
  }
  
`;
  editor.edit((builder) => {
    let startIndex = file.indexOf("combineEffects");
    let lastIndex = file.indexOf("}", startIndex);
    const lastHasComma = file
      .substring(startIndex, lastIndex + 1)
      .replace(/[ \n]/g, "")
      .includes(",}");
    let pos = getPosition(file, lastIndex - 1);
    builder.insert(
      pos,
      `${
        lastHasComma ? "" : ","
      } ${globalActinName}.${newActionName}: ${funcName}`
    );
    builder.insert(new vscode.Position(doc.lineCount + 1, 0), funcContent);
    formatFile(doc.uri, editor);
  });
}

function formatFile(uri: vscode.Uri, editor: vscode.TextEditor) {
  return new Promise((r) => {
    vscode.commands
      .executeCommand(
        "vscode.executeFormatDocumentProvider",
        uri,
        new vscode.Position(0, 0),
        ""
      )
      .then(
        (value: any) => {
          editor.edit((builder) => {
            for (let f of value) {
              const range = f.range;
              const str = f.newText;
              if (str == "") {
                builder.delete(range);
              } else {
                builder.insert(range.start, str);
              }
            }
            r();
          });
        },
        (err) => {
          console.error(`err:${err}`);
        }
      );
  });
}

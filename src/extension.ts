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

      // let newActionName = await vscode.window.showInputBox({
      //   password: false,
      //   ignoreFocusOut: true,
      //   placeHolder: "New Action Name",
      // });
      // if (!newActionName) {
      //   return;
      // }
      // newActionName = newActionName.trim();
      const newActionName = "ffff";
      // const outFile = await vscode.window.showQuickPick(["Reducer", "Effect"]);
      // if (!outFile) return;
      // const outFile: "Reducer" | "Effect" = "Effect";
      const baseName = await modifyAction(actionPath, newActionName);
      // if ((outFile as any) === "Reducer") {
      //   await modifyReducer(reducerPath, baseName, newActionName);
      // } else if (outFile === "Effect") {
      //   await modifyEffect(effectPath, baseName, newActionName);
      // }
      // execSync(`flutter format ${dirPath}`);
    }
  );

  let disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    async (uri) => {
      const doc = await vscode.workspace.openTextDocument(uri);
      doc.save();
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage(
      //   "Hello World from i_dart_plugin1111!"
      // );
      // const editor = vscode.window.activeTextEditor;
      // const text = editor?.document.getText();
      // console.log("text", text);
    }
  );
  context.subscriptions.push(newAction);
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function modifyAction(src: string, newActionName: string) {
  const doc = await vscode.workspace.openTextDocument(src);
  const file = doc.getText();
  const editor = await vscode.window.showTextDocument(doc);

  const actionName = /enum(.*)\{/.exec(file)?.[1].trim();
  if (!actionName) {
    throw new Error("没有找到Action声明");
  }
  const baseName = actionName.replace("Action", "");
  const globalActinName = `${baseName}Action`;
  const upperActionName = toFirstUpper(newActionName);
  // let newActionFile = file.replace(/(enum [^}]*)}/g, `$1, ${newActionName}} `);
  let enumIndex = file.indexOf("enum ");
  let pos = getPosition(file, file.indexOf("}", enumIndex) - 1);
  editor.edit((editorBuilder) => {
    editorBuilder.insert(pos, `,${newActionName}`);
    vscode.commands.executeCommand(
      "vscode.executeFormatDocumentProvider",
      doc.uri
    );
  });
  //   let classIndex = newActionFile.indexOf("class");
  //   console.log(newActionFile.substr(classIndex), "----");
  //   let okIndex = findMatching(newActionFile.substr(classIndex), "{", "}");
  //   newActionFile = insertText(
  //     newActionFile,
  //     classIndex + okIndex,
  //     `
  // static Action on${upperActionName}() {
  // return const Action(${globalActinName}.${newActionName});
  // }
  // `
  //   );

  // editor.edit((b) => {
  //   b.replace(
  //     new vscode.Range(new vscode.Position(0, 0), doc.eol),
  //     newActionFile
  //   );
  //   vscode.commands.executeCommand(
  //     "vscode.executeFormatDocumentProvider",
  //     editor.document.uri
  //   );
  // });
  // writeFile(src, newActionFile);
  return baseName;
}

async function modifyReducer(
  src: string,
  baseName: string,
  newActionName: string
) {
  const doc = await vscode.workspace.openTextDocument(src);
  await doc.save();
  const file = doc.getText();
  const globalActinName = `${baseName}Action`;
  const globalStateName = `${baseName}State`;
  const upperActionName = toFirstUpper(newActionName);
  const funcName = `_on${upperActionName}`;
  let newFile = file.replace(
    /(asReducer[^}]*)}/g,
    `$1, ${globalActinName}.${newActionName}: ${funcName}} `
  );
  newFile = newFile.replace(/,[\r\n\t ]*,/g, ",");
  newFile =
    newFile +
    `
  ${globalStateName} _on${upperActionName}(${globalStateName} state, Action action) {
    final ${globalStateName} newState = state.clone();
    return newState;
  }
`;
  writeFile(src, newFile);
}
async function modifyEffect(
  src: string,
  baseName: string,
  newActionName: string
) {
  const doc = await vscode.workspace.openTextDocument(src);
  await doc.save();
  const file = doc.getText();
  const globalActinName = `${baseName}Action`;
  const globalStateName = `${baseName}State`;
  const upperActionName = toFirstUpper(newActionName);
  const funcName = `_on${upperActionName}`;
  let newFile = file.replace(
    /(combineEffects[^}]*)}/g,
    `$1, ${globalActinName}.${newActionName}: ${funcName}} `
  );
  newFile = newFile.replace(/,[\r\n\t ]*,/g, ",");
  newFile =
    newFile +
    `
    void ${funcName}(Action action, Context<${globalStateName}> ctx) {
    }
    
`;
  writeFile(src, newFile);
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { readFile, writeFile, findMatching, insertText } from "./util";
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
      // const editor = vscode.window.activeTextEditor;
      // const text = editor?.document.getText();
      // console.log("text", text);
      const dirPath = path.parse(uri?.path).dir.substr(1);
      const effectPath = path.resolve(dirPath, "effect.dart");
      const actionPath = path.resolve(dirPath, "action.dart");
      const reducerPath = path.resolve(dirPath, "reducer.dart");

      const effectFile = readFile(effectPath);
      const actionFile = readFile(actionPath);
      const reducerFile = readFile(reducerPath);
      const actionName = /enum(.*)\{/.exec(actionFile)?.[1].trim();
      if (!actionName) {
        return;
      }
      const baseName = actionName.replace("Action", "");
      // const newActionName = await vscode.window.showInputBox({
      //   password: false,
      //   ignoreFocusOut: true,
      //   placeHolder: "New Action Name",
      // });
      // if (!newActionName) {
      //   return;
      // }
      const newActionName = "ffff";
      const upperActionName = newActionName.toUpperCase().trim();

      let newActionFile = actionFile.replace(
        /(enum [^}]*)}/g,
        `$1, ${newActionName}} `
      );

      // newActionFile = actionFile.replace(
      //   /(class [^}]*)}/g,
      //   `$1\n
      // 	static Action on${upperActionName}() {
      // 		return const Action(${actionName}.${newActionName});
      // 	}
      // }`
      // );
      let classIndex = newActionFile.indexOf("class");
      console.log(newActionFile.substr(classIndex), "----");
      let okIndex = findMatching(newActionFile.substr(classIndex), "{", "}");
      newActionFile = insertText(
        newActionFile,
        classIndex + okIndex, //4 =  5(= 'class'.length) - 1(字符本身位置)
        `
	static Action on${upperActionName}() {
    return const Action(${actionName}.${newActionName});
	}
`
      );
      writeFile(actionPath, newActionFile);
      console.log(newActionFile);
    }
  );

  let disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from i_dart_plugin1111!"
      );
      const editor = vscode.window.activeTextEditor;
      const text = editor?.document.getText();
      console.log("text", text);
    }
  );
  context.subscriptions.push(newAction);
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

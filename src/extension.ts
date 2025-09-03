import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from "fs";

type SaveData = {
	fetchList?: string[]
}

function reasure(context: vscode.ExtensionContext): SaveData{
	const extentionPath = context.extensionPath;
	const saveFilePath = path.join(extentionPath, "data.json");

	let data: SaveData = {};

	if (!fs.existsSync(saveFilePath)) {
		fs.writeFileSync(saveFilePath, JSON.stringify({
			'fetchList': []
		}));
		data.fetchList = [];
	} else {
		data = JSON.parse(fs.readFileSync(saveFilePath, "utf-8"));
		if(!data.fetchList) data.fetchList = [];
	}

	return data;
}

export function activate(context: vscode.ExtensionContext) {
	
	let data = reasure(context);

	const fetchList = vscode.commands.registerCommand('fetchit.fetchlist', () => {

		const editor = vscode.window.activeTextEditor;

		if(!editor) return;

		const panel = vscode.window.createWebviewPanel(
			'fetchit',
			'FetchIt',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		)

		const html = fs.readFileSync(path.join(context.extensionPath, "src", "html", "fetchList.html")).toString();

		if(!data.fetchList) data.fetchList = [];

		const htmlWithFetchList = html.replace("{{fetchList}}", `{"fetchList": ["${data.fetchList.join('","').replaceAll("\\", "/")}"]}`);
		panel.webview.html = htmlWithFetchList;
	});

	const addFetch = vscode.commands.registerCommand('fetchit.addfetch', () => {
		const editor = vscode.window.activeTextEditor;

		if(!editor) return;

		const currentFilePath = editor.document.fileName;
		
		if(!data.fetchList) data.fetchList = [];

		if(!data.fetchList.includes(currentFilePath)) {
			data.fetchList.push(currentFilePath);
			fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
		}

	});

	context.subscriptions.push(fetchList);
	context.subscriptions.push(addFetch);
}

export function deactivate() {}

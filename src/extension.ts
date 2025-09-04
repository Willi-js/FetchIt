import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from "fs";

type SaveData = {
	fetchList?: string[],
	currentlySelected?: number
}

function reasure(context: vscode.ExtensionContext): SaveData{
	const extentionPath = context.extensionPath;
	const saveFilePath = path.join(extentionPath, "data.json");

	let data: SaveData = {};

	if (!fs.existsSync(saveFilePath)) {
		fs.writeFileSync(saveFilePath, JSON.stringify({
			'fetchList': [],
			'currentlySelected': 0
		}));
		data.fetchList = [];
		data.currentlySelected = 0;
	} else {
		data = JSON.parse(fs.readFileSync(saveFilePath, "utf-8"));
		if(!data.fetchList) data.fetchList = [];
		if(!data.currentlySelected) data.currentlySelected = 0;
	}

	return data;
}

export function activate(context: vscode.ExtensionContext) {

	function getKeybindings() {
    	const config = vscode.workspace.getConfiguration('fetchit.keybindings');

  	  	return {
  	    	fetchlist: config.get<string>('fetchlist'),
  	    	addfetch: config.get<string>('addfetch'),
  	    	selectnext: config.get<string>('selectnext'),
  	    	selectprevious: config.get<string>('selectprevious'),
  	    	clearall: config.get<string>('clearall')
  	  	};
  	}

  	const currentKeybindings = getKeybindings();
	
	let data = reasure(context);

	const fetchList = vscode.commands.registerCommand('fetchit.fetchlist', () => {

		const editor = vscode.window.activeTextEditor;

		if(!editor) return;

		const panel = vscode.window.createWebviewPanel(
			'fetchit',
			'FetchIt',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
			}
		)

		panel.webview.onDidReceiveMessage(e => {
			if(e.command === "openFile") {
				vscode.workspace.openTextDocument(vscode.Uri.file(e.path)).then(doc => {
					vscode.window.showTextDocument(doc);

					data.currentlySelected = data.fetchList!.indexOf(e.path.replaceAll("/", "\\"));
					fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
				});
			}
		})

		const html = fs.readFileSync(path.join(context.extensionPath, "src", "html", "fetchList.html")).toString();

		if(!data.fetchList) data.fetchList = [];

		const htmlWithFetchList = html.replace("{{fetchList}}", `{"fetchList": ["${data.fetchList.join('","').replaceAll("\\", "/")}"]}`).replaceAll("'{{currentlySelected}}'", data.currentlySelected ? data.currentlySelected.toString() : "0");
		panel.webview.html = htmlWithFetchList;
	});

	const addFetch = vscode.commands.registerCommand('fetchit.addfetch', () => {
		const editor = vscode.window.activeTextEditor;

		if(!editor) return;

		
		const currentFilePath = editor.document.fileName;
		
		if(!data.fetchList) data.fetchList = [];

		if(!data.fetchList.includes(currentFilePath)) {
			data.fetchList.push(currentFilePath);
			data.currentlySelected = data.fetchList.length - 1;
			fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
		}

	});

	const selectNext = vscode.commands.registerCommand('fetchit.selectnext', () => {
		if(!data.fetchList) data.fetchList = [];
		if(!data.currentlySelected) data.currentlySelected = 0;

		if(data.currentlySelected < data.fetchList.length - 1) {
			data.currentlySelected++;
		} else {
			data.currentlySelected = 0;
		}

		vscode.workspace.openTextDocument(vscode.Uri.file(data.fetchList[data.currentlySelected])).then(doc => {
			vscode.window.showTextDocument(doc);
		});
		
		fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
	});

	const selectPrev = vscode.commands.registerCommand('fetchit.selectprevious', () => {
		if(!data.fetchList) data.fetchList = [];
		if(!data.currentlySelected) data.currentlySelected = 0;

		if(data.currentlySelected > 0) {
			data.currentlySelected--;
		} else {
			data.currentlySelected = data.fetchList.length - 1;
		}

		vscode.workspace.openTextDocument(vscode.Uri.file(data.fetchList[data.currentlySelected])).then(doc => {
			vscode.window.showTextDocument(doc);
		});
		
		fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
	});

	const clearAll = vscode.commands.registerCommand('fetchit.clearall', () => {
		data.fetchList = [];
		data.currentlySelected = 0;
		fs.writeFileSync(path.join(context.extensionPath, "data.json"), JSON.stringify(data));
	});

	context.subscriptions.push(fetchList);
	context.subscriptions.push(addFetch);
	context.subscriptions.push(selectNext);
	context.subscriptions.push(selectPrev);
	context.subscriptions.push(clearAll);
}

export function deactivate() {}

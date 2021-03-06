"use strict"
const http = require('http');
const url = require('url');
const fs = require('fs');
const readline = require('readline');
const querystring = require('querystring');
const spawnSync = require('child_process').spawnSync;
let currentMonth = new Date().getMonth() + 1;

http.createServer((req, res) => {
	let urlData = url.parse(req.url);
	//console.dir(urlData);
	let queryObj = querystring.parse(urlData.query);
	console.dir(queryObj);
	queryObj.title && queryObj.url && writeToMarKdownDoc(queryObj);
	res.writeHead(200, {"Content-Type": "application/json"});
	res.end(JSON.stringify({
		code: 0,
		msg : 'success'
	}));
}).listen(3117);


function changeFilename () {
	let fileName = 'README.md';
	let name = '';
	let date = new Date();
	if (date.getMonth() + 1 !== currentMonth) {
		name = date.getFullYear() + '-' + date.getMonth() + '.md';
		try {
			let state = fs.state(name);
			!state.isFile() && fs.renameSync(fileName, name);
		}
		catch (e){
		    fs.renameSync(fileName, name);
		}
		currentMonth = date.getMonth() + 1;
	}
	return fileName;
}

function isNewFile(filename) {
	try {
		let fileState = fs.statSync(filename);
		let result = fileState.isFile();
		return result;
	}
	catch(e) {
		//console.error(e);
		return false;
	}
}

function writeToFile(filename, data, title) {
	fs.writeFile(filename, data, (err) => {
		if (err) console.err(err);
		console.log('saved ' + filename);
		//pushToGit(title);
	});
}

function writeToMarKdownDoc(obj) {
	let fileName = changeFilename();
	let data = [];
	let inserted = false;
	const date = new Date();
	if (!isNewFile(fileName)) {
		data.push(`### ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}<br />`)
		data.push(`+ [${obj.title}](${obj.url})<br />\n`);
		writeToFile(fileName, data.join('\n'), obj.title);
		return;
	}
	const rl = readline.createInterface({
	    input: fs.createReadStream(fileName)
	});

	rl.on('line', (line) => {
		if (!inserted && line.startsWith('###')) {

			let date_str = line.match(/\d{4}-\d{1,2}-\d{1,2}/)[0];
			if (date_str && (new Date(date_str).getDate() === date.getDate())) {
				data.push(line);
				data.push(`+ [${obj.title}](${obj.url})<br />`);
			}
			else {
				data.push(`### ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}<br />`)
				data.push(`+ [${obj.title}](${obj.url})<br />\n`);
				data.push(line);
			}
			inserted = true;
		}
		else {
			data.push(line);
		}
	});
	rl.on('close', () => {
		if (!inserted) { //新建的文件
			data.push(`### ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}<br />`)
			data.push(`+ [${obj.title}](${obj.url})<br />\n`);
		}
		writeToFile(fileName, data.join('\n'), obj.title);
	});
}

function pushToGit(title) {
	var title = title || '';
	var cmds = [
	    ['git', ['add', '.']],
	    ['git', ['commit', '-am', `"add ${title}"`]],
	    ['git', ['pull', '--rebase']],
	    ['git', ['push', 'origin', 'master']]
	];
	cmds.forEach((cmd) => {
		let result = spawnSync(cmd[0], cmd[1]);
		console.log(result.output.join('\n'));
	});
}

setInterval(function(){
	console.log('push to github');
	pushToGit(new Date().toString());
}, 1000 * 60 * 60 * 2);

console.log('server start at 3117');

#!/usr/bin/env node
var childProcessExec = require('child_process').exec;
var format = require('util').format;
var moment = require('moment');
var async = require('async');

function exec(command, cb) {
	childProcessExec(command, function (err, stdout, stderr) {
			if (err) {
				console.error(command);
				console.error(stderr);
				console.error(err);
				process.exit(1);
			}
			cb(stdout);
	});
}

exec('git remote prune origin', cleanup);

function cleanup() {
	exec('git gc --prune=now', fetch);
}

function fetch() {
	exec('git fetch --prune', getBranches);
}

function getBranches() {
	exec(
		"git for-each-ref --sort=-committerdate refs/remotes/origin --format=\"%(refname)%09%(committerdate:rfc2822)\"",
		pruneBranches
	);
}

function pruneBranches(stdout) {
	var now = Date.now();
	var tasks = stdout.split('\n')
		.filter(Boolean)
		.map(function (branchText) {
			return branchText.split('\t');
		})
		.map(function (parts) {
			return {
				name: parts[0].replace(/^refs\/remotes\/origin\//, ''),
				ageInDays: -moment(new Date(parts[1])).diff(now, 'days')
			};
		})
		.filter(function (branch) {
			return !/^pullrequest|master|HEAD/.test(branch.name);
		})
		.filter(function (branch) {
			if (/^ready\//.test(branch.name)) {
				if (branch.ageInDays > 1) {
					return true;
				}
			} else {
				if (branch.ageInDays > 30) {
					return true;
				}
			}
			return false;
		}).map(function(branch){
			return function(cb) {
				exec(
					format('git push origin --delete "%s"', branch.name),
					function(){
						console.log('Deleted the branch "%s" because it\'s %d days old', branch.name, branch.ageInDays);
						cb();
					}
				);
			};
		});
	if(!tasks.length){
		console.log('Nothing to clean up');
		process.exit(0);
	}
	async.parallel(tasks, function(){
		process.exit(0);
	});
}
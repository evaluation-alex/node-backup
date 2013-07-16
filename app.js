var config = require('./config'),
	os = require('os'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	temp = require('temp'),
	zlib = require('zlib'),
	targz = require('tar.gz'),
	cronJob = require('cron').CronJob,
	knox = require('knox');

var s3 = new knox.createClient({key: config.s3.id, secret: config.s3.key, bucket: config.s3.bucket});

var handleError = function(where, err) {
	console.log('Error occurred while ' + where, err);
	debugger;
}

var backupPaths = function() {
	console.log('Beginning backup operations');
	var date = new Date();

	// Iterate each backup target
	async.eachSeries(config.paths, function(path, callback) {
		try {
			backupPath({path: path, date: date, complete: callback});
		} catch(exception) {
			console.log("Unhandled Exception: " + exception);
		}
	}, function(err) { 
		console.log('Backup operation complete'); 
	});
}

var backupPath = function(backupInfo) {
	// If it is a folder tar.gz the whole thing and upload it
	// If it is a file just gzip it and upload
	backupInfo.isDirectory = fs.statSync(backupInfo.path).isDirectory();
	if(backupInfo.isDirectory) {
		backupInfo.extension = '.tar.gz';
		backupInfo.tempFile = temp.path({suffix: backupInfo.extension});
		new targz().compress(backupInfo.path, backupInfo.tempFile, function(err) {
			if(err)
				handleError('creating tar.gz', err);
			else
				sendToS3(backupInfo);
		});
	} else {
		backupInfo.extension = '.gz';
		backupInfo.tempFile = temp.path({suffix: backupInfo.extension});
		var gzip = zlib.createGzip();
		var reader = fs.createReadStream(backupInfo.path);
		var writer = fs.createWriteStream(backupInfo.tempFile);

		writer.on('close', function() {
			sendToS3(backupInfo);
		});

		reader.pipe(gzip).pipe(writer);
	}
}

var getS3HostPath = function(backupInfo) {
	var date = backupInfo.date;
	var pad = function(val) { return val.length === 1 ? '0' + val : val; }
	var dateString = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDay());

	var fileName = path.basename(backupInfo.path) + backupInfo.extension;
	return os.hostname() + '/' + date.toISOString() + '/' + fileName;
}

var sendToS3 = function(backupInfo) {
	console.log('Uploading ' + backupInfo.path);

	var uploader = s3.putFile(backupInfo.tempFile, getS3HostPath(backupInfo), function(err, res) {
		if(err)
			handleError('completing putFile', err);
			
		if(res.statusCode != 200) {
			handleError('uploading file', 's3 responded with bad status code: ' + res.statusCode);
		}

		console.log('Upload completed');
		fs.unlinkSync(backupInfo.tempFile);
		backupInfo.complete();
	});

	uploader.on('progress', function(data) { 
		console.log('Upload progress: ' + data.percent);
	}).on('error', function(err) {
		//handleError('uploading', err);
	});
}

var job = new cronJob(config.frequency, backupPaths, function(){}, true);

//exports.backupPaths = backupPaths;

var streamy = require('streamy-data'),
	pesticide = require('./bin/pesticide'),
	gulp = require('gulp'),
	File = require('vinyl'),
	pathUtil = require('path'),
	fs = require('fs');

gulp.task('data.download', [
	'data.download.pesticide'
]);

gulp.task('data.download.pesticide', function (callback) {
	
	// TODO: clear
	
	// callback is invoked when end is called twice
	var end = streamy.util.wait(2, callback);
	
	// grab index json data from the website
	pesticide.index({ order: 'name' }, function (list) {
		
		// TODO: use mkdirp or writefile
		
		// write index file
		fs.writeFile('./raw/download/pesticide/index.json', 
			JSON.stringify(list, null, '\t'), end);
		
		// sort list by id
		list = list.sort(function (x, y) {
			return x.id.localeCompare(y.id);
		});
		
		// transform the list into an object stream
		streamy.array(list)
			// transform them into detailed data object from the website
			.pipe(streamy.map(pesticide.detail))
			// transform them into vinyl file format (to work with gulp.dest)
			.pipe(streamy.file.vinylify(function (data) {
				return './' + data.id + '.json';
			}, {
				stringify: { space: '\t' }
			}))
			// write file to specified destination
			.pipe(gulp.dest('./raw/download/pesticide/entries'))
			.on('data', function () {})
			.on('end', end);
	});
	
});

gulp.task('data.build', [
	'data.build.pesticide'
]);

gulp.task('data.build.pesticide', [
	'data.build.pesticide.index', 
	'data.build.pesticide.entries'
]);

gulp.task('data.build.pesticide.index', function (callback) {
	
	fs.readFile('./raw/download/pesticide/index.json', 'utf8', function (err, data) {
		
		var list = JSON.parse(data).map(function (data) {
			return { id: data.id, name: data.name };
		}).sort(function (x, y) {
			return x.name.localeCompare(y.name);
		});
		
		fs.writeFile('./pesticide/index.html', 
			jekyllify('pesticide-index', list), callback);
	});
	
});

gulp.task('data.build.pesticide.entries', function (callback) {
	
	// TODO: wire up clear
	
	// read all entries files
	gulp.src(['./raw/download/pesticide/entries/*'])
		// map to a new vinyl file
		.pipe(streamy.map.sync(function (file) {
			return new File({
				path: './' + pathUtil.basename(file.path, '.json') + '/index.html',
				contents: new Buffer(jekyllify('pesticide-entry', file.contents.toString()))
			});
		}))
		.pipe(gulp.dest('./pesticide'))
		.on('data', function () {})
		.on('end', callback);
	
});

gulp.task('data.build.pesticide.entries.clear', function (callback) {
	
	var rmEntryDir = function (path, callback) {
		fs.unlink(path + '/' + index.html, function () {
			fs.rmdir(path, callback);
		});
	};
	
	fs.readdir('./pesticide', function(err, files) {
		var end = streamy.util.wait(files.length, callback);
		files.forEach(function (fname) {
			var fpath = './pesticide/' + fname;
			fs.stat(fpath, function (err, stats) {
				if (stats.isDirectory())
					rmEntryDir(fpath, end);
				else
					end();
			});
		});
	});
	
});

gulp.task('data.build.pesticide.uses', function (callback) {
	
	var list = [];
	
	gulp.src(['./raw/download/pesticide/entries/*'])
		.pipe(streamy.file.unvinylify())
		.on('data', function (data) {
			list = list.concat(data.uses);
		})
		.on('end', function () {
			fs.writeFile('./raw/download/pesticide/uses.json', 
				JSON.stringify(list, null, '\t'), callback);
		});
	
});

// helper //
function jekyllify(template, data) {
	var cnt = typeof data === 'string' ? data : JSON.stringify(data, null, '\t');
	return '---\nlayout: ' + template + '\ndata: ' + cnt + '\n---\n';
}

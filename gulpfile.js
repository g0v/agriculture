var streamy = require('streamy-data'),
	pesticide = require('./bin/pesticide'),
	gulp = require('gulp'),
	File = require('vinyl'),
	fs = require('fs');

gulp.task('default', ['build']);

gulp.task('build', function() {
	gulp.src(['*.html'])
		.on('data', console.log);
});

gulp.task('data.pesticide', ['data.pesticide.index', 'data.pesticide.entry']);

gulp.task('data.pesticide.index', function(callback) {
	pesticide.index({ order: 'name' }, function (list) {
		
		console.log(list.length + " pesticide entries found.");
		
		var endCount = 0,
			end = function () { if (++endCount == 2) callback(); },
			indexList = list.map(function (data) {
				return { id: data.id, name: data.name };
			});
		
		fs.writeFile('./raw/pesticide/index.json', JSON.stringify(list), end);
		fs.writeFile('./pesticide/index.html', 
			'---\nlayout: pesticide-index\ndata: ' + JSON.stringify(indexList) +'\n---\n', end);
	});
});

gulp.task('data.pesticide.entry', function(callback) {
	
	// TODO: clear old files
	
	pesticide.index({ order: 'id' }, function (list) {
		
		var endCount = 0,
			end = function () { if (++endCount == 2) callback(); },
			indexList = list.map(function (data) {
				return { id: data.id, name: data.name };
			});
		
		var s = streamy.array(list)
			.pipe(streamy.map(pesticide.detail))
			.pipe(streamy.map.sync(function (data) {
				return {
					id: data.id,
					content: JSON.stringify(data)
				};
			}));
		
		s.pipe(streamy.map.sync(function (data) {
				return new File({
					path: './' + data.id + '.json',
					contents: new Buffer(data.content)
				});
			}))
			.pipe(gulp.dest('./raw/pesticide'))
			.on('data', function () {})
			.on('end', end);
		
		s.pipe(streamy.map.sync(function (data) {
				return new File({
					path: './' + data.id + '/index.html',
					contents: new Buffer('---\nlayout: pesticide-entry\ndata: ' + data.content +'\n---\n')
				});
			}))
			.pipe(gulp.dest('./pesticide'))
			.on('data', function () {})
			.on('end', end);
	});
	
});

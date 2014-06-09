var streamy = require('streamy-data'),
	pesticide = require('./bin/pesticide'),
	gulp = require('gulp'),
	File = require('vinyl'),
	pathUtil = require('path'),
	fs = require('fs');

gulp.task('data.download', [
	'data.download.pesticide'
]);

/* This task shall write the following files:
 * + /_raw/download/licenses.json
 * + /_raw/download/index.json
 * + /_raw/download/entries/{id}.json
 */
gulp.task('data.download.pesticide', function (callback) {
	
	// TODO: clear
	
	// callback is invoked when end is called three times
	var end = streamy.util.wait(3, callback);
	
	// grab index json data from the website
	pesticide.download.licenses(function (licenses) {
		
		console.log('license file downloaded.');
		
		// TODO: use mkdirp or writefile
		
		// write licenses file
		fs.writeFile('./_raw/download/pesticide/licenses.json', 
			JSON.stringify(licenses, null, '\t'), end); // end 1
		
		/* Write index file. We could have deferred this part to 
		 * building phase, but this will make everything easier.
		 */
		var index = pesticide.build.indexFromLicenses(licenses);
		fs.writeFile('./_raw/download/pesticide/index.json', 
			JSON.stringify(index, null, '\t'), end); // end 2
		
		// transform the index list into an object stream
		var ids = index.map(function (data) { return data.id });
		streamy.array(ids)
			// transform them into detailed data object from the website
			.pipe(streamy.map(pesticide.download.entry))
			// transform them into vinyl file format (to work with gulp.dest)
			.pipe(streamy.file.vinylify(function (data) {
				return './' + data.id + '.json';
			}, {
				stringify: { space: '\t' }
			}))
			// write file to specified destination
			.pipe(gulp.dest('./_raw/download/pesticide/entries'))
			.on('data', function () {})
			.on('end', end); // end 3
	});
	
});



/* In hopes of manually calling download tasks, we keep build tasks away from 
 * dependencies to them.
 */
gulp.task('data.build', [
	'data.build.pesticide'
]);

/* Precondition: all downloaded raw files are available, which includes:
 * + /_raw/download/licenses.json
 * + /_raw/download/index.json
 * + /_raw/download/entries/{id}.json
 * 
 * This task shall write the following files:
 * + /pesticide/index.html
 * + /pesticide/{id}/index.html
 * + /data/pesticide/usages.json
 */
gulp.task('data.build.pesticide', function (callback) {
	
	// callback is invoked when end is called three times
	var end = streamy.util.wait(3, callback);
	
	fs.readFile('./_raw/download/pesticide/index.json', 'utf8', function (err, data) {
		
		var index = JSON.parse(data),
			m = {},
			indexPageStr;
		
		indexPageStr = jekyllify('pesticide-index', index.sort(function (x, y) {
			return x.name.localeCompare(y.name);
		}));
		
		// write index page file, which only contains id and name
		fs.writeFile('./pesticide/index.html', indexPageStr, end); // end 1
		
		// initialize entry objects
		index.forEach(function (entry) {
			entry.licenses = [];
			m[entry.id] = entry;
		});
		
		fs.readFile('./_raw/download/pesticide/licenses.json', 'utf8', function (err, data) {
			
			var licenses = JSON.parse(data),
				usageSearchData = {},
				usages = usageSearchData.usages = [],
				pesticideMap = usageSearchData.pesticides = {},
				id, entry;
			
			usageSearchData.corpMap = {};
			
			// TODO: move these to bin/util
			var clone = function (tar, src) {
				if (!src) {
					src = tar;
					tar = {};
				}
				Object.keys(src).forEach(function (k) {
					tar[k] = src[k];
				});
				return tar;
			};
			
			var copyIfAbsent = function (tar, src, field) {
				var vo = tar[field],
					vn = src[field];
				if (!vo)
					tar[field] = vn;
				else if (vo != vn)
					console.log("Conflict field values: \n" + vo + ", \n" + vn);
			};
			
			// include information from license data
			licenses.forEach(function (lic) {
				id = lic['農藥代號'];
				entry = m[id];
				
				copyIfAbsent(entry, lic, '英文名稱');
				// the composition ratio might be different per license
				//copyIfAbsent(entry, lic, '化學成分');
				
				entry.licenses.push({
					'許可證號': lic['許可證號'],
					'化學成分': lic['化學成分'],
					'廠牌名稱': lic['廠牌名稱'],
					'國外原製造廠商': lic['國外原製造廠商'],
					'有效期限': lic['有效期限'],
					'廠商名稱': lic['廠商名稱']
				});
				
			});
			
			// collect pesticide search: pesticide entries
			index.forEach(function (entry) {
				var products = {};
				entry.licenses.forEach(function (lic) {
					if (lic['廠牌名稱'])
						products[lic['廠牌名稱']] = 1;
				});
				pesticideMap[entry.id] = {
					id: entry.id,
					name: entry.name || '',
					engName: entry['英文名稱'] || '',
					products: Object.keys(products).join('#')
				};
			});
			
			// include information from entry files
			gulp.src(['./_raw/download/pesticide/entries/*'])
				.pipe(streamy.file.unvinylify())
				.on('data', function (data) {
					// merge into pesticide entries
					var entry = m[data.id];
					copyIfAbsent(entry, data, '廠牌名稱');
					copyIfAbsent(entry, data, '通過日期');
					entry.usages = data.usages;
					
					// collect pesticide search: usage entries
					data.usages.forEach(function (u) {
						usages.push(clone({ pesticideId: data.id }, u));
					});
				})
				.on('end', function () {
					// write usages-search.json
					fs.writeFile('./data/pesticide/usages-search.json', 
						JSON.stringify(usageSearchData, null, '\t'), end); // end 2
					
					// write pesticide entry pages
					streamy.array(index)
						.pipe(streamy.map.sync(function (data) {
							return new File({
								path: './' + data.id + '.html',
								contents: new Buffer(jekyllify('pesticide-entry', data))
							});
						}))
						.pipe(gulp.dest('./pesticide'))
						.on('data', function () {})
						.on('end', end); // end 3
				});
			
		});
		
	});
	
});

// helper //
// TODO: keep gulp file clear, move to bin/jekyll
function jekyllify(template, data) {
	var cnt = typeof data === 'string' ? data : JSON.stringify(data, null, '\t');
	return '---\nlayout: ' + template + '\ndata: ' + cnt + '\n---\n';
}

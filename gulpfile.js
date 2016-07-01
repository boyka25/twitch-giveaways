/*jshint node:true */
var gulp = require('gulp');

// tasks config
var argv = require('minimist')(process.argv.slice(2), { alias: {
	production: 'P',
	type: 't'
}});
var destination = 'build';

// exit with a correct code
var errorOccurred = false;
process.once('exit', function (code) {
	if (errorOccurred && code === 0) process.exit(1);
});

/**
 * Error handler.
 * @param  {Error} err
 */
function handleError(err) {
	var maxStackLines = 10;
	errorOccurred = true;
	if (err.name && err.stack) {
		err = err.plugin + ': ' + err.name + ': ' + err.message + '\n'
		+ err.stack.replace(err.message, '').split('\n').slice(0, maxStackLines).join('\n');
	}
	console.error(err);
	if (this.emit) this.emit('end');
}

function stylesStream() {
	return contentStylesStream();
}

function contentStylesStream() {
	var stylus = require('gulp-stylus');
	var autoprefixer = require('gulp-autoprefixer');
	var minifyCSS = require('gulp-minify-css');
	var rename = require('gulp-rename');
	var gulpif = require('gulp-if');
	return gulp.src('src/styl/main.styl')
		.pipe(stylus({ errors: false })).on('error', handleError)
		.pipe(rename('content.css'))
		.pipe(autoprefixer('last 2 Chrome versions')).on('error', handleError)
		.pipe(gulpif(argv.production, minifyCSS({ noAdvanced: true })));
}

function scriptsStream() {
	return contentScriptsStream();
}

function contentScriptsStream() {
	var resolve = require('component-resolver');
	var Builder = require('component-build');
	var gulpif = require('gulp-if');
	var uglify = require('gulp-uglify');
	var File = require('vinyl');
	var stream = new require('stream').Readable({ objectMode: true });
	var done = false;
	stream._read = function () {
		if (done) return stream.push(null);
		resolve('.', { development: !argv.production }, build);
	};
	function build(err, tree) {
		done = true;
		if (err) return stream.emit('error', err);
		new Builder(tree, {
			autorequire: true,
			development: !argv.production
		}).scripts(pushFile);
	}
	function pushFile(err, string) {
		if (err) return stream.emit('error', err);
		stream.push(new File({
			cwd: '/',
			base: '/',
			path: '/content.js',
			contents: new Buffer(string)
		}));
	}
	return stream.on('error', handleError)
		.pipe(gulpif(argv.production, uglify()))
		.on('error', handleError);
}

function iconsStream() {
	var svgmin = require('gulp-svgmin');
	var rename = require('gulp-rename');
	var svgstore = require('gulp-svgstore');

	return gulp.src('src/icon/*.svg')
		.pipe(svgmin())
		.pipe(rename({prefix: 'icon-'}))
		.pipe(svgstore())
		.pipe(rename({basename: 'icons'}));
}

function assetsStream() {
	var streamqueue = require('streamqueue');
	return streamqueue({ objectMode: true },
		gulp.src(['./manifest.json', './src/img/**/*']),
		gulp.src('./banner/*', {base: process.cwd()})
	);
}

gulp.task('assets', function () {
	return assetsStream().pipe(gulp.dest(destination));
});

gulp.task('icons', function () {
	return iconsStream().pipe(gulp.dest(destination));
});

gulp.task('clean', function (cb) {
	require('rimraf')(destination, cb);
});

gulp.task('scripts:content', function () {
	return contentScriptsStream().pipe(gulp.dest(destination));
});

gulp.task('scripts', ['scripts:content']);

gulp.task('styles:content', function () {
	return contentStylesStream().pipe(gulp.dest(destination));
});

gulp.task('styles', ['styles:content']);

gulp.task('build', ['clean'], function () {
	gulp.start('assets', 'icons', 'scripts', 'styles');
});

gulp.task('bump', function () {
	var bump = require('gulp-bump');
	var type = argv.type ? argv.type : 'patch';
	var isType = ~['major', 'minor', 'patch'].indexOf(type);
	return gulp.src('manifest.json')
		.pipe(bump(isType ? { type: type } : { version: type }))
		.pipe(gulp.dest('.'));
});

gulp.task('package', function () {
	var version = require('./manifest.json').version;
	var streamqueue = require('streamqueue');
	var zip = require('gulp-zip');
	argv.production = true;
	return streamqueue({ objectMode: true },
		assetsStream(),
		iconsStream(),
		scriptsStream(),
		stylesStream()
	).pipe(zip('tga-' + version + '.zip')).pipe(gulp.dest('.'));
});

gulp.task('release', ['bump'], function () {
	gulp.start('package');
});

gulp.task('watch', function () {
	gulp.watch(['manifest.json', 'src/img/**/*', 'banner/*'], ['assets']);
	gulp.watch(['component.json', 'data/*.json', 'src/js/**/*.js'], ['scripts']);
	gulp.watch('src/styl/**/*.styl', ['styles']);
	gulp.watch(['src/icon/*.svg'], ['icons']);
});

gulp.task('default', ['build'], function () {
	gulp.start('watch');
});
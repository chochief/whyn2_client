'use strict';

var gulp = require('gulp'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	cleanCSS = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	babel = require('gulp-babel'),
	uglify = require('gulp-uglify'),
	jade = require('gulp-jade'),
	strip = require('gulp-strip-comments'), // удаляет комменты из любых файлов
	jshint = require('gulp-jshint')
;

gulp.task('sass', function () {
	gulp.src('assets/sass/style.sass')
		.pipe(sass())
		.pipe(autoprefixer('last 15 versions', '> 1%', 'ie 9'))
		.pipe(cleanCSS())
		.pipe(gulp.dest('public/css/'))
	;
});

// gulp.task('js-lib', function () {
// 	return gulp.src([
// 			'assets/lib/min/angular.min.js',
// 			'assets/lib/min/angular-route.min.js',
// 			'assets/lib/min/lodash.min.js',
// 			'assets/lib/min/ngStorage.min.js',
// 		])
// 		.pipe(concat('lib.js'))
// 		.pipe(gulp.dest('public/js/'))
// 	;
// });

gulp.task('js', function () {
	var options = {
		mangle: true, // false
	};	
	return gulp.src([
			'assets/js/init.js',
			'assets/js/app/**/*.js',
			'assets/js/run.js'
		])
		.pipe(concat('app.js'))
		.pipe(strip()) //удаляем комментарии (хотя uglify тоже это делает)
		.pipe(babel({presets: ['es2015']}))
		//
		// .pipe(uglify(options).on('error', function(e){
		// 	console.log(e);
		// }))
		//
		.pipe(gulp.dest('public/js/'))
	;
});


gulp.task('jade-app-ru', function() {
	return gulp.src('assets/index.jade')
		.pipe(jade({
			locals: {lang: 'ru', l: 1},
			pretty: false,
		}))
		// .pipe(rename('app-ru.php'))
		.pipe(gulp.dest('public/'));
});

// Следить за папкой css, и при изменении внутри запускать task default
gulp.task('watch', function() {
	// gulp.watch('assets/scss/*.scss', ['sass']);
	gulp.watch('assets/sass/*.*', ['sass']);
	// gulp.watch('assets/lib/min/*.js', ['js-lib']);
	gulp.watch('assets/js/**', ['js']);	
	// gulp.watch('assets/js/*.js', ['js']);	
	// gulp.watch('assets/js/**/*.js', ['js']);
	gulp.watch('assets/index.jade', ['jade-app-ru']);
});

gulp.task('default', 
	[
		'sass', 
		'js-lib', 
		'js', 
		'jade-app-ru',
	]
);

// // js validate
// gulp.task('lint', function() {
// 	return gulp.src('resources/assets/js/**/*.js')
// 	.pipe(jshint())
// 	.pipe(jshint.reporter('default'));
// });
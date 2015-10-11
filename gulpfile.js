var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    notify = require('gulp-notify'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    concat = require('gulp-concat'),
    del = require('del'),
    vulcanize = require('gulp-vulcanize');

// Styles
gulp.task('styles', function() {
    return sass('style.sass', { style: 'compressed' })
        .pipe(gulp.dest('.'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('.'))
        .pipe(notify({ message: 'CSS updated' }));
})

// Imports
gulp.task('imports', function () {
    return gulp.src('imports.html')
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('.'))
        .pipe(vulcanize())
        .pipe(notify({ message: 'Imports vulcanized' }));
});

// Scripts
gulp.task('scripts', function () {
    return gulp.src('scripts.html')
        .pipe(vulcanize({inlineScripts: true}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('.'))
        .pipe(notify({ message: 'Scripts vulcanized' }));
});
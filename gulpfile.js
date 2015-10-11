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
        .pipe(gulp.dest('./public'))
        .pipe(notify({ message: 'CSS updated' }));
})

// Imports
gulp.task('imports', function () {
    return gulp.src('public/imports.html')
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./public'))
        .pipe(vulcanize())
        .pipe(notify({ message: 'Imports vulcanized' }));
});

// Scripts
// TODO: place all these files in a JSON file so the list can be loaded from both
// node (here) and PHP (for dev purposes)
gulp.task('scripts', function () {
    return gulp.src([
            'public/scripts/config.js',
            'public/scripts/editorstate.js',
            'public/scripts/imagelist.js',
            'public/scripts/utils.js',
            'public/scripts/kickerio.js',
            'public/scripts/kickeriofromdom.js',
            'public/scripts/kickeriofromjson.js',
            'public/scripts/kickermodel.js',
            'public/scripts/kicker.js',
            'public/scripts/ColladaLoader.js', 
            'public/scripts/THREEx.GeometryUtils.js', 
            'public/scripts/representation3d.js',
            'public/scripts/scene.js',
            'public/scripts/orbitcontrols.js',

            'public/models/parts/part.js',
            'public/models/parts/angle.js',
            'public/models/parts/annotation.js',
            'public/models/parts/arrow.js',
            'public/models/parts/board.js',
            'public/models/parts/curvedarrow.js',
            'public/models/parts/grid.js',
            'public/models/parts/side.js',
            'public/models/parts/slat.js',
            'public/models/parts/strut.js',
            'public/models/parts/surface.js',
            'public/models/parts/text.js',

            'public/scripts/box.js',
            'public/scripts/bboxhelper.js',

            'public/scripts/CanvasRenderer.js',
            'public/scripts/SoftwareRenderer.js',
            'public/scripts/Projector.js',
             
            'public/scripts/sequencer.js',
            'public/scripts/renderer3d.js',
            'public/scripts/blueprintborderrenderer.js',
            'public/scripts/mergedrenderer.js'        
        ])
        .pipe(concat('scripts.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/'))
        .pipe(notify({ message: 'Scripts concatenated and uglified'}));
});


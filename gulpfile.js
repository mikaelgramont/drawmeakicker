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
// TODO: place all these files in a JSON file so the list can be loaded from both
// node (here) and PHP (for dev purposes)
gulp.task('scripts', function () {
    return gulp.src([
            'scripts/config.js',
            'scripts/editorstate.js',
            'scripts/imagelist.js',
            'scripts/utils.js',
            'scripts/kickerio.js',
            'scripts/kickeriofromdom.js',
            'scripts/kickeriofromjson.js',
            'scripts/kickermodel.js',
            'scripts/kicker.js',
            'scripts/ColladaLoader.js', 
            'scripts/THREEx.GeometryUtils.js', 
            'scripts/representation3d.js',
            'scripts/scene.js',
            'scripts/orbitcontrols.js',

            'models/parts/part.js',
            'models/parts/angle.js',
            'models/parts/annotation.js',
            'models/parts/arrow.js',
            'models/parts/board.js',
            'models/parts/curvedarrow.js',
            'models/parts/grid.js',
            'models/parts/side.js',
            'models/parts/slat.js',
            'models/parts/strut.js',
            'models/parts/surface.js',
            'models/parts/text.js',

            'scripts/box.js',
            'scripts/bboxhelper.js',

            'scripts/CanvasRenderer.js',
            'scripts/SoftwareRenderer.js',
            'scripts/Projector.js',
             
            'scripts/sequencer.js',
            'scripts/renderer3d.js',
            'scripts/blueprintborderrenderer.js',
            'scripts/mergedrenderer.js'        
        ])
        .pipe(concat('scripts.min.js'))
        .pipe(uglify({compress:''}))
        .pipe(gulp.dest('.'))
        .pipe(notify({ message: 'Scripts concatenated and uglified'}));
});


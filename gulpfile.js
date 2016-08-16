const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
gulp.task('babel', () => {
  return browserify({ entries: './index.js' })
  .transform('babelify', { presets: ['es2015'] })
  .bundle()
  .pipe(source('smallfoot.js'))
  .pipe(gulp.dest('dist/'));
});

gulp.task('minify', () => {
  return gulp.src('dist/smallfoot.js')
    .pipe(uglify())
    .pipe(rename('smallfoot.min.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['babel', 'minify']);

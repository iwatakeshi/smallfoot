const gulp = require('gulp');
const babel = require('gulp-babel');
const minify = require('gulp-babel-minify');
const rename = require('gulp-rename');

gulp.task('babel', () => {
  return gulp.src('index.js')
  .pipe(babel({
    presets: ['es2015'],
  }))
  .pipe(rename('smallfoot.js'))
  .pipe(gulp.dest('dist/'));
});

gulp.task('minify', () => {
  return gulp.src('index.js')
    .pipe(minify())
    .pipe(rename('smallfoot.min.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['babel', 'minify']);

var gulp       = require('gulp');
var sourceMaps = require('gulp-sourcemaps');
var filter     = require('gulp-filter');
var coffee     = require('gulp-coffee');
var awspublish = require('gulp-awspublish');
var concat     = require('gulp-concat');
var uglify     = require('gulp-uglify');
var RevAll     = require('gulp-rev-all');
var gutil      = require('gulp-util');
var del        = require('del');
var awspublishRouter = require("gulp-awspublish-router");

var revAll = new RevAll({ dontRenameFile: [/^\/favicon.ico$/g, '.html'] });
var coffeeFilter = filter(["**/*.coffee"]);

gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('html', ['clean'], function() {
  return gulp.src("./html/**/*.html")
    .pipe(gulp.dest("build"));
});

gulp.task('js', ['clean'], function() {
  var stream = gulp.src("./js/**/*.js")
      .pipe(sourceMaps.init())
      .pipe(coffeeFilter)
      .pipe(coffee())
      .pipe(coffeeFilter.restore())
      .pipe(concat("application.js"))
      .pipe(gutil.env.production ? uglify({mangle: {toplevel: true}}) : gutil.noop())
      .pipe(gulp.dest("build/assets"))
      .pipe(sourceMaps.write("."));
});

gulp.task('css', ['clean'], function() {
  return gulp.src("./css/**/*.css")
      .pipe(concat("application.css"))
      .pipe(gulp.dest("build/assets"));
});

gulp.task('images', ['clean'], function() {
  return gulp.src("./images/**/*", {base: "./images"})
    .pipe(gulp.dest("build/assets/images"));
});

gulp.task('compile_assets', ['html', 'css', 'js', 'images']);

gulp.task('cache-bust', ['compile_assets'], function() {
  return gulp.src(["./build/**"])
      .pipe(revAll.revision())
      .pipe(gulp.dest("./build/production"))
      .pipe(gulp.dest("./build/production"));
});

gulp.task('publish', ['cache-bust'], function() {
  var publisher = awspublish.create({bucket: 'www.getwandering.com'});

  gulp.src("**/*", { cwd: "./build/production" })
    .pipe(awspublishRouter({
        cache: {
            // cache for 5 minutes by default
            cacheTime: 300
        },

        routes: {
            "^assets/(?:.+)\\.(?:js|css|svg|ttf)$": {
                // don't modify original key. this is the default
                key: "$&",
                // use gzip for assets that benefit from it
                gzip: true,
                // cache static assets for 20 years
                cacheTime: 630720000
            },

            "^assets/.+$": {
                // cache static assets for 20 years
                cacheTime: 630720000
            },

            "^.+\\.html": {
              cacheTime: 0,
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Expires": 0
              }
            },

            // pass-through for anything that wasn't matched by routes above, to be uploaded with default options
            "^.+$": "$&"
        }
    }))
    .pipe(publisher.publish())
    .pipe(publisher.sync())
    .pipe(awspublish.reporter())
});

gulp.task('default', ['compile_assets']);

import { argv } from 'yargs';
import browsersync from 'browser-sync';
import del from 'del';
import dotenv from 'dotenv';
import fs from 'fs';
import gulp from 'gulp';
import markdown from 'nunjucks-markdown';
import marked from 'marked';
import nunjucks from 'nunjucks';
import pngquant from 'imagemin-pngquant';
import pumpify from 'pumpify';
import webpack from 'webpack';

import { paths, servers, debug } from './config/AppConfig.js';
import { i18n } from './config/i18n.js';
import webpackConfig from './webpack.config.babel.js';

const $ = require(`gulp-load-plugins`)({
  rename: {
    'gulp-yaml-validate': `yamlLint`,
    'gulp-merge-json': `merge`,
    'gulp-webpack': `gulpWebpack`,
  },
});

const browserSync = browsersync.create();
const reload = browserSync.reload;

const env = dotenv.config();
const njkEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader([ `app/views/`, `app/modules/` ]));

// Markdown plugin configuration. Used in compile task
markdown.register(njkEnv, marked);

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pendantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
});

/* Flags for gulp cli */
const production = argv.production;
const staging = argv.staging;

/* Internal flag not for use with gulp cli */
const build = production || staging;

/**
 * Compiles yaml content files into one json files
*/
gulp.task(`data`, () => {
  return gulp.src(`content/**/*.yml`)
  .pipe($.plumber())
  .pipe($.yamlLint({safe: true}))
  .pipe($.yaml())
  .pipe($.merge(`data.json`))
  .pipe(gulp.dest(paths.tmp));
});

/**
 * Task to Optimize SVG, PNG, GIF images
 * If deploying to staging or production, images are hashed
 */

gulp.task(`copy-images`, () =>{
  return gulp.src([
    `app/assets/img/*`,
  ])
  .pipe(gulp.dest(`.tmp/assets/img`));
});

gulp.task(`images`, () => {
  return gulp.src([
    `app/assets/img/**/*.{svg,png,gif}`,
    `app/views/*/img/*.{svg,png,gif}`,
  ])
    .pipe($.rename({
      dirname: ``,
    }))
    .pipe($.size({
      title: `images`,
      showFiles: true,
    }))
    .pipe(gulp.dest(`.tmp/assets/img`))

    .pipe($.if(build, pumpify.obj(
      $.imagemin({
        interlaced: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant({quality: `86`})],
      }),
      $.size({
        title: `images:optimized`,
      }),
      $.rev(),
      gulp.dest(paths.imageDist),
      $.rev.manifest(`rev-manifest-img.json`),
      gulp.dest(paths.manifests)
    )));
});

/**
 * Convert PostCSS to CSS
 *
*/
const postimport = require(`postcss-import`)({
  path: [`./app/assets`, `./app/`]
});
const postcustom = require(`postcss-custom-properties`);
const postcalc = require(`postcss-calc`);
const postmedia = require(`postcss-custom-media`);
const postmodular = require(`postcss-modular-scale`);
const postnested = require(`postcss-nested`);
const autoprefixer = require(`autoprefixer`);

const postplugins = [
  postimport,
  postcustom,
  postcalc,
  postmedia,
  postmodular,
  postnested,
  autoprefixer
];

gulp.task(`styles`, () => {
  return gulp.src([
    `app/assets/styles/**/*.css`,
    `app/views/**/*.css`,
  ])
    .pipe($.rename({dirname: ``}))
    .pipe($.sourcemaps.init())
    .pipe($.postcss(postplugins))
    .pipe($.if(!build, $.sourcemaps.write(`maps`)))
    .pipe($.size({
      title: `styles`,
      showFiles: true,
    }))
    .pipe(gulp.dest(paths.css))

    .pipe($.if(build, pumpify.obj(
      $.cssnano(),
      $.size({
        title: `styles:optimized`,
        showFiles: true,
      }),
      $.rev(),
      gulp.dest(paths.cssDist),
      $.rev.manifest(`rev-manifest-css.json`),
      gulp.dest(paths.manifests)
    )));
});

gulp.task(`styles:watch`, [`styles`], (cb) => {
  browserSync.reload();
  cb();
});


/**
 * Transpile ES and bundle scripts
 *
*/
gulp.task(`scripts`, () => {
  return gulp.src([`app/views/**/*.js`])
    .pipe($.plumber())
    .pipe($.gulpWebpack(webpackConfig, webpack))
    .pipe(gulp.dest(`.tmp/assets/js`))

    .pipe($.if(build, pumpify.obj(
      $.uglify(),
      $.size({
        title: `scripts:optimized`,
        showFiles: true,
      }),
      $.rev(),
      gulp.dest(paths.jsDist),
      $.rev.manifest(`rev-manifest-js.json`),
      gulp.dest(paths.manifests)
    )));
});

/**
 * Compile Nunjucks to HTML.
 * If build, replace assets with rev versions
 * @todo Use default language if data is not available
*/
gulp.task(`html`, () => {
  const locales = Object.keys(i18n);
  const data = JSON.parse(fs.readFileSync(`${paths.tmp}/data.json`));

  for (const locale of locales) {
    const localeData = i18n[locale];

    for (const route of localeData.routes) {
      gulp.src([
        `app/views/${route.view}/[^_]*.html`,
        `app/views/*.html`,
      ])
      .pipe($.plumber())
      .pipe($.data(function() {
        return data[locale];
      }))
      .pipe($.nunjucks.compile(
        {
          lang: `${localeData.lang}_${localeData.country}`,
          dir: localeData.dir
        },
        {
          env: njkEnv,
        }
      ))
      .pipe(gulp.dest(`.tmp/${localeData.lang}${route.path}`));
    }
  }
});

gulp.task(`html:optimize`, () => {
  const assetPath = `/static-assets/`;

  return gulp.src([
    `.tmp/**/*.html`,
    `.tmp/manifests/*.json`,
  ])
  .pipe($.revCollector({
    returnplaceReved: true,
    dirReplacements: {
      '/assets/css/'(hash) {
        return `${assetPath}css/${hash}`;
      },
      '/assets/js/'(hash) {
        return `${assetPath}js/${hash}`;
      },
      '/assets/img/'(hash) {
        return `${assetPath}img/${hash}`;
      },
    },
  }))
  .pipe($.htmlmin({
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
    removeEmptyElements: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  }))
  .pipe(gulp.dest(`dist`));
});

gulp.task(`html:update`, (cb) => {
  $.runSequence(
    `data`,
    `html`,
     cb);
});

gulp.task(`html:watch`, [`html`], (cb) => {
  browserSync.reload();
  cb();
});

gulp.task(`serve`, () => {
  browserSync.init({
    server: {
      baseDir: [ `.tmp`]
    },
    port: 8000,
    open: false,
    notify: false,
    logPrefix: `${debug.appName}`,
    middleware(req, res, next) {
      res.setHeader(`Access-Control-Allow-Origin`, `*`);

      if (req.url === '/') {
        req.url = '/en/home/index.html';
      };

      return next();
    },
  });

  gulp.watch([
    `app/assets/js/**/*.js`,
    `app/views/**/*.js`,
  ], [`scripts`]).on(`change`, reload);

  gulp.watch([
    `app/assets/styles/**/*.css`,
    `app/views/**/*.css`,
    `app/modules/**/*.css`,
  ], [`styles:watch`])

  gulp.watch([
    `app/views/**/*.{html,md}`,
    `app/modules/**/*.{html,md}`,
  ], [`html:watch`]);

  gulp.watch([
    `content/**/*.yml`,
  ], [`html:update`]).on(`change`, reload);
});

gulp.task(`serve:dist`, () => {
  browserSync.init({
    logPrefix: `${debug.appName} Preview`,
    server: [`dist`],
    port: 9000,
    middleware(req, res, next) {
      res.setHeader(`Access-Control-Allow-Origin`, `*`);
      next();
    },

  });
});

gulp.task(`clean:dist`, () => {
  del([`dist/*`]);
});

gulp.task(`clean:tmp`, () => {
  del([`.tmp/*`]);
});

gulp.task(`clean`, [ `clean:tmp`, `clean:dist` ]);

/**
 * Task to publish dist directory to AWS.
 * To prepare an build run `gulp build:prod`
 */
gulp.task(`publish`, () => {
  /*
    Cloudflare/front set their own max-age headers so we don't have to set a
    far future expiry.
   */
  // const day = 86400;
  const future = {'Cache-Control': `max-age=600, must-revalidate, public` };
  // const farFuture = {'Cache-Control': `max-age=${day * 365}, must-revalidate, public'`};
  const noCache = {'Cache-Control': `no-cache`};

  const gzipTypes = `**/*.{html,css,js,svg,ico,json,txt}`;
  const cacheBustedTypes = `**/*.{css,js}`;
  const cachedTypes = `**/*.{gif,jpeg,jpg,png,svg,webp,ico,woff,woff2}`;
  const noCacheTypes = `**/*.{html,json,xml,txt}`;
  const otherTypes = [
    `**/*`,
    `!${cacheBustedTypes}`,
    `!${cachedTypes}`,
    `!${noCacheTypes}`,
  ];

  // Creates a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  const publisher = $.awspublish.create({
    params: {
      region: production ? servers.production.s3.region : servers.staging.s3.region,
      Bucket: production ? servers.production.s3.bucket : servers.staging.s3.bucket,
    },
    accessKeyId: env.S3_ACCESSID,
    secretAccessKey: env.S3_KEY,
  });

  return gulp.src(`dist/**/*`)
    .pipe($.plumber())
    .pipe($.if(gzipTypes, $.awspublish.gzip()))
    .pipe($.if(cacheBustedTypes, publisher.publish(future)))
    .pipe($.if(cachedTypes, publisher.publish(future)))
    .pipe($.if(noCacheTypes, publisher.publish(noCache)))
    .pipe($.if(otherTypes, publisher.publish(future)))
    .pipe($.awspublish.reporter());
});

/**
 * Task to build application files.
 * Does not start server.
 */
gulp.task(`build`, (cb) => {
  $.runSequence(
    `clean`,
    `data`,
    `images`,
    `styles`,
    `scripts`,
    `html`,
     cb);
});

/**
 * Task to start the application.
 * Mapped to script `start`
 */
gulp.task(`default`, (cb) => {
  $.runSequence(
    `clean:tmp`,
    `data`,
    `images`,
    `copy-images`,
    `styles`,
    `scripts`,
    `html`,
    `serve`,
     cb);
});

/**
 * Builds site with production optimization. Publishes site.
 */
gulp.task(`deploy`, (cb) => {
  $.runSequence(
    `clean:dist`,
    `data`,
    `styles`,
    `scripts`,
    `images`,
    `html`,
    `html:optimize`,
    `publish`,
     cb);
});

/**
 * Build and preview application.
 * gulp preview [--staging | --production]
 */
gulp.task(`preview`, (cb) => {
  $.runSequence(
    `clean:dist`,
    `data`,
    `images`,
    `styles`,
    `scripts`,
    `html`,
    `html:optimize`,
    `serve:dist`,
     cb);
});

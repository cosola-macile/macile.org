export const debug = {
  appName: `macile.org`,
}
};


export const config = {
  en: {
    langtag: `en_US`,
    dir: `ltr`,
    lang: `en`,
    views: [
      {tpl: `home`, name: `home`},
      {tpl: `example`, name: `example`},
    ],
  },
  es: {
    langtag: `en_ES`,
    dir: `ltr`,
    lang: `es`,
    views: [

      {tpl: `home`, name: `inicio`},
      {tpl: `example`, name: `ejemplo`},
    ],
  },
};

export const paths = {
  css: `./.tmp/assets/css/`,
  cssDist: `./dist/assets/css`,
  tmp: `./.tmp`,
  jsDist: `./dist/assets/js`,
  imageDist: `./dist/static-assets/img`,
  manifests: `./.tmp/manifests`,
};

export const server = {
  staging: {
    s3: {
      region: `website-us-east-1`,
      bucket: ``,
    },
  },
  production: {
    s3: {
      region: `website-us-east-1`,
      bucket: ``,
    },
  },
};

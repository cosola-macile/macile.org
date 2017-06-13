export const debug = {
  appName: `macile.org`,
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

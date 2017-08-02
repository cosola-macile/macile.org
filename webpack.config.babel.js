import path from 'path';

export default {
  context: path.resolve(__dirname, `./app`),
  entry: {
    app: `./assets/js/App.js`,
  },
  output: {
    path: path.resolve(__dirname, `./.tmp/assets/js`),
    filename: `[name].bundle.js`,
  },
  module: {
    loaders: [
      {
        test: /\.svg$/,
        loader: `file-loader`,
      },
      {
        test: /\.js$/,
        loader: `babel-loader`,
        query:{
          presets: [`es2015`],
        },
      },
    ],
  },
  resolve: {
    extensions: [`.js`],
    modules: [
      `./node_modules`,
      `./app/assets/js`,
      `./app/modules`
    ],
    alias: {
      feature: `feature/index.js`,
      waypoints: `waypoints/lib/noframework.waypoints.min.js`
    },
  },
};

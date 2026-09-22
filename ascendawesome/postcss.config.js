import postcssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default (ctx) => ({
  plugins: [
    postcssImport(),
    autoprefixer(),
    ctx.env === 'production' ? cssnano({ preset: 'default' }) : false,
  ].filter(Boolean),
});

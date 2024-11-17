import { parse } from "@barelyhuman/resume-lang";
import { build } from "esbuild";
import postcss from "esbuild-postcss";
import fs from "node:fs";
import { dirname } from "path";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import { join, resolve } from "node:path";
import { compile } from "tempura";
import glob from "tiny-glob";

const entryPoints = await glob("./content/**/*.{jsx,ts,js}", {
  filesOnly: true,
});

/**
 * convert files into html
 * involve preact if need to pre-render
 * allow importing `.resume` files as JSON files
 */
const compiledBuildOutput = await build({
  entryPoints: entryPoints,
  platform: "browser",
  outdir: ".tmp-dist",
  bundle: true,
  splitting: true,
  treeShaking: true,
  format: "esm",
  loader: {
    ".js": "jsx",
  },
  metafile: true,
  jsx: "automatic",
  jsxImportSource: "preact",
  plugins: [resumeLang(), postcss()],
});

function resumeLang() {
  return {
    name: "resume-lang/esbuild",
    setup(builder) {
      builder.onResolve({ filter: /\.resume$/ }, async (args) => {
        const path = resolve(join(args.resolveDir, args.path));
        return {
          path: path,
          namespace: "resume-lang",
          watchDirs: [dirname(path)],
        };
      });

      builder.onLoad(
        {
          filter: /\.resume$/,
          namespace: "resume-lang",
        },
        async (args) => {
          const contents = fs.readFileSync(args.path, "utf8");
          const ast = parse(contents, {
            rootDir: join(dirname(args.path)),
            readFile(path) {
              return fs.readFileSync(path, "utf8");
            },
          });
          return {
            loader: "json",
            contents: JSON.stringify(
              ast,
              (k, v) => (k === "parent" ? undefined : v),
              2
            ),
          };
        }
      );
    },
  };
}

const template = await fs.promises.readFile("index.html", "utf8");
const compiledTemplate = compile(template);

const preRenderPromises = entryPoints.map(async (file) => {
  const reCompiledEntry = Object.keys(
    compiledBuildOutput.metafile.outputs
  ).find((d) => compiledBuildOutput.metafile.outputs[d].entryPoint === file);

  const cssBundle =
    compiledBuildOutput.metafile.outputs[reCompiledEntry].cssBundle;
  const module = await import(resolve(reCompiledEntry));
  const str = renderToString(h(module.default), {});
  const outputPath = reCompiledEntry
    .replace(/\.js$/, ".html")
    .replace(/\.tmp-dist/, "dist");
  await fs.promises.mkdir(dirname(outputPath), { recursive: true });
  const cssBundleData = await fs.promises.readFile(cssBundle, "utf8");
  const outputHTML = compiledTemplate({
    head: `
      <style>${cssBundleData}</style>
    `,
    content: str,
  });
  await fs.promises.writeFile(outputPath, outputHTML, "utf8");
});

await Promise.all(preRenderPromises);

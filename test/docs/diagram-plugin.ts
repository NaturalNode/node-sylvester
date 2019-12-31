import { Converter } from 'typedoc/dist/lib/converter';
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Context } from 'typedoc/dist/lib/converter/context';
import { CommentTag } from 'typedoc/dist/lib/models/comments';
import { PageEvent, RendererEvent } from 'typedoc/dist/lib/output/events';
import { IRecording, RecordedValue, IBenchmarks } from './record';
import { renderToString } from 'katex';
import { copySync, readJsonSync } from 'fs-extra';
import { join } from 'path';
import { highlight } from 'highlight.js';
import * as prettier from 'prettier';

const magicNumbers: [number, string][] = [
  [Math.PI, '\\pi'],
  [Math.PI / 2, '\\frac{\\pi}{2}'],
  [Math.PI / 3, '\\frac{\\pi}{3}'],
  [Math.PI / 4, '\\frac{\\pi}{4}'],
];

const numberToTex = (v: number, digits: number = 2) => {
  for (const [magic, tex] of magicNumbers) {
    if (Math.abs(v - magic) < 1e-6) {
      return tex;
    }
  }

  let places = 0;
  const original = v;
  for (; places < digits; places++) {
    if (Math.abs(Math.round(v) - v) < 1e-6) {
      break;
    }

    v *= 10;
  }

  return original.toFixed(places);
};

type TexVars = { [key: string]: string | { tex: string; decorated: string } };

const getPreferredVarName = (char: string, existing: TexVars) => {
  // If we have a character we want to use for this, try to get n, n_1, n_2, etc.
  let increment = 1;
  const initial = `${char}_1`;
  if (existing[char] !== undefined) {
    existing[initial] = existing[char];
  }

  if (existing[initial] === undefined) {
    return char;
  }

  for (; existing[`${char}_${increment}`] === undefined; increment++) {}

  return `${char}_${increment}`;
};

const nameVar = (existing: TexVars) => {
  let chr = 'A'.charCodeAt(0);
  while (existing[String.fromCharCode(chr)] !== undefined) {
    chr++;
  }

  return String.fromCharCode(chr);
};

const vectorToTex = (elements: ReadonlyArray<number>) => `\\begin{bmatrix}
${elements.map(v => numberToTex(v)).join(' & ')}
\\end{bmatrix}`;

function symbolToTex(data: RecordedValue, vars: TexVars): string {
  switch (data.type) {
    case 'Matrix':
      return `\\begin{bmatrix}
      ${data.elements.map(r => r.map(v => numberToTex(v)).join(' & ')).join('\\\\\n')}
      \\end{bmatrix}`;
    case 'Vector':
      return vectorToTex(data.elements);
    case 'Object':
      const obj = data.value;
      return (
        '\\left\\{' +
        Object.keys(obj)
          .map(key => `\\mathrm{${key}\\!:}\\,${symbolToTex(obj[key], vars)}`)
          .join(', ') +
        '\\right\\}'
      );
    case 'Primitive':
      switch (typeof data.value) {
        case 'string':
          return data.value;
        case 'number':
          return numberToTex(data.value);
        default:
          return `\\mathbf{${data.value}}`;
      }
    case 'Constructor':
      return data.name;
    case 'Line':
      const anchor = nameVar(vars);
      vars[anchor] = vectorToTex(data.anchor);
      const direction = nameVar(vars);
      vars[direction] = vectorToTex(data.direction);
      return `\\overleftrightarrow{${anchor}${direction}}`;
    case 'Segment':
      const start = nameVar(vars);
      vars[start] = vectorToTex(data.start);
      const end = nameVar(vars);
      vars[end] = vectorToTex(data.end);
      return `\\overline{${start}${end}}`;
    case 'Plane':
      const point = nameVar(vars);
      vars[point] = vectorToTex(data.anchor);
      const normal = getPreferredVarName('n', vars);
      const decoNormal = `\\overrightarrow{${normal}}`;
      vars[normal] = { tex: vectorToTex(data.norm), decorated: decoNormal };
      return `\\mathrm{Plane} \\lbrace ${point}, ${decoNormal} \\rbrace`;
    case 'Polygon':
      const poly = nameVar(vars);
      const points = data.verticies.map(v => {
        const name = getPreferredVarName(poly, vars);
        vars[name] = vectorToTex(v);
        return name;
      });

      return `\\mathrm{Polygon} \\lbrace ${points.join(' \\rightarrow ')} \\rbrace`;
    default:
      return `${data} not implemented`;
  }
}

let data: { [key: string]: IRecording };
try {
  data = readJsonSync(`${__dirname}/recorded-tests.json`);
} catch (e) {
  throw new Error('cannot load recorded diagrams, run npm test first');
}

const benchmarkFormat = Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 });
let benchmarks: IBenchmarks;
try {
  benchmarks = readJsonSync(`${__dirname}/../../../benchmark-results.json`);
} catch (e) {
  throw new Error('cannot load recorded benchmarks, run npm test --benchmark first');
}

let diagramId = 0;

@Component({ name: 'diagram' })
export class DiagramPlugin extends ConverterComponent {
  public convertCommentTagText(tagText: string): string {
    if (tagText.startsWith('<div')) {
      return tagText; // already converted
    }

    tagText = tagText.trim();

    const diagrams = Object.keys(data)
      .filter(k => k === tagText || k.replace(/-[0-9]+$/, '') === tagText)
      .map(k => ({ speed: benchmarks.data[k], ...data[k] }));

    if (diagrams.length === 0) {
      throw new Error(`Diagram for ${tagText} not found`);
    }

    return (
      diagrams
        // Generate tex for the diagram
        .map(({ speed, callee, method, args, retValue, code }) => {
          const vars: TexVars = {};
          const body =
            symbolToTex(callee, vars) +
            `\\!\\!{.}\\mathrm{${method}}` +
            `(${args.map(a => symbolToTex(a, vars)).join(', ')}) =` +
            symbolToTex(retValue, vars);

          const head = Object.keys(vars)
            .filter(v => !!vars[v])
            .map(v => {
              const value = vars[v];
              return typeof value === 'string'
                ? `${v}=${value}`
                : `${value.decorated}=${value.tex}`;
            })
            .join(' \\enspace ');

          const texHtml = renderToString(head + '\\\\[0.5em]\n' + body);
          const codeHtml = highlight(
            'js',
            prettier.format(code, {
              parser: 'babel',
              printWidth: 100,
              singleQuote: true,
            }),
          );

          const id = `example-${diagramId++}`;
          return `<div class="example" id="${id}">
            <button onClick="document.getElementById('${id}').classList.toggle('show-code')">
              <span class="button-code">Code</span>
              <span class="button-tex">Diagram</span>
            </button>${
              speed ? `<div class="speed">${benchmarkFormat.format(speed)} ops/sec</div>` : ''
            }
            <pre><code>${codeHtml.value}</code></pre>
            <div class="tex">${texHtml}</div>
          </div>`;
        })
        .join('')
    );
  }

  /**
   * listen to event on initialisation
   */
  public initialize() {
    this.listenTo(this.owner, {
      [Converter.EVENT_RESOLVE_BEGIN]: this.onResolveBegin,
    }).listenTo(this.application.renderer, {
      [RendererEvent.BEGIN]: this.onRendererBegin,
      [PageEvent.END]: this.onPageEnd,
    });
  }

  /**
   * Triggered when the converter begins converting a project.
   */
  public onResolveBegin(context: Context) {
    Object
      // get reflection from context
      .values(context.project.reflections)
      // get CommentTags from Comment
      .map(reflection => reflection.comment?.tags)
      // filter only CommentTags exist
      .filter((tag): tag is CommentTag[] => !!tag)
      // merge all CommentTags
      .reduce((a, b) => a.concat(b), [])
      // filter tag that paramName is 'mermaid'
      .filter(tag => tag.tagName === 'diagram')
      // Swap out the tag text with the appropriate LaTeX
      .forEach(tag => (tag.text = this.convertCommentTagText(tag.text)));
  }

  public onRendererBegin(event: RendererEvent) {
    copySync(
      `${__dirname}/../../../test/docs/custom.css`,
      join(event.outputDirectory, 'assets', 'css', 'custom.css'),
    );
    copySync(
      `${__dirname}/../../../node_modules/katex/dist/katex.min.css`,
      join(event.outputDirectory, 'assets', 'katex', 'katex.min.css'),
    );
    copySync(
      `${__dirname}/../../../node_modules/katex/dist/fonts`,
      join(event.outputDirectory, 'assets', 'katex', 'fonts'),
    );
  }

  /**
   * Hijack the page end to write custom CSS. Doesn't appear to be a better way
   * to do this...
   * @see https://github.com/TypeStrong/typedoc/issues/1060
   */
  private onPageEnd(page: PageEvent) {
    if (!page.contents) {
      return;
    }

    const assetPath = /<link.+href=.(.*assets\/)/.exec(page.contents);
    if (!assetPath) {
      return;
    }

    page.contents = page.contents.replace(
      '</head>',
      ` <link rel="stylesheet" href="${assetPath[1]}katex/katex.min.css">
        <link rel="stylesheet" href="${assetPath[1]}css/custom.css">
      </head>`,
    );
  }
}

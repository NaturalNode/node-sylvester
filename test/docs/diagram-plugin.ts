import { Converter } from 'typedoc/dist/lib/converter';
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Context } from 'typedoc/dist/lib/converter/context';
import { CommentTag } from 'typedoc/dist/lib/models/comments';
import { PageEvent, RendererEvent } from 'typedoc/dist/lib/output/events';
import { IRecording, RecordedValue } from './record';
import { renderToString } from 'katex';
import { copySync } from 'fs-extra';
import { join } from 'path';

const numberToTex = (v: number, digits: number = 2) => {
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

function symbolToTex(data: RecordedValue): string {
  switch (data.type) {
    case 'Matrix':
      return `\\begin{bmatrix}
      ${data.elements.map(r => r.map(v => numberToTex(v)).join(' & ')).join('\\\\\n')}
      \\end{bmatrix}`;
    case 'Vector':
      return `\\begin{bmatrix}
      ${data.elements.map(v => numberToTex(v)).join(' & ')}
      \\end{bmatrix}`;
    case 'Object':
      const obj = data.value;
      return (
        '\\left\\{' +
        Object.keys(obj)
          .map(key => `\\mathrm{${key}\\!:}\\,${symbolToTex(obj[key])}`)
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
    default:
      return `${data.type} not implemented`;
  }
}

let data: { [key: string]: IRecording };
try {
  data = require('./recorded-tests.json');
} catch (e) {
  throw new Error('cannot load recorded diagrams, run npm test first');
}

/**
 * Mermaid plugin component.
 */
@Component({ name: 'diagram' })
export class DiagramPlugin extends ConverterComponent {
  public convertCommentTagText(tagText: string): string {
    if (tagText.startsWith('<div class="tex">')) {
      return tagText; // already converted
    }

    tagText = tagText.trim();

    const diagrams = Object.keys(data)
      .filter(k => k === tagText || k.replace(/-[0-9]+$/, '') === tagText)
      .map(k => data[k]);

    if (diagrams.length === 0) {
      throw new Error(`Diagram for ${tagText} not found`);
    }

    return (
      diagrams
        // Generate tex for the diagram
        .map(
          ({ callee, method, args, retValue }) =>
            symbolToTex(callee) +
            `\\!\\!{.}\\mathrm{${method}}` +
            `(${args.map(a => symbolToTex(a)).join(', ')}) =` +
            symbolToTex(retValue),
        )
        // Render it in KaTeX
        .map(tex => renderToString(tex))
        // Create the final html
        .map(html => `<div class="tex">${html}</div>`)
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

import { DiagramPlugin } from './diagram-plugin';
import { Application } from 'typedoc';

const app = new Application({
  mode: 'file',
  tsconfig: 'tsconfig.json',
  excludePrivate: true,
});

app.converter.addComponent('diagram', new DiagramPlugin(app.converter));

const project = app.convert(app.expandInputFiles(['src']));
if (project) {
  app.generateDocs(project, 'doc');
}

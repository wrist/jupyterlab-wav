import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { WavWidget, MIME_TYPE } from './widget';

/**
 * A mime renderer factory for wav data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new WavWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab-wav:plugin',
  rendererFactory,
  rank: 0,
  dataType: 'string',
  fileTypes: [
    {
      name: 'wav',
      fileFormat: 'base64',
      mimeTypes: [MIME_TYPE],
      extensions: ['.wav']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'JupyterLab wav viewer',
    primaryFileType: 'wav',
    modelName: 'base64',
    fileTypes: ['wav'],
    defaultFor: ['wav']
  }
};

export default extension;

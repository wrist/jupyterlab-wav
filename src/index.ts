import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { WavWidget } from './widget';

/**
 * The default mime type for the extension.
 */
const MIME_TYPES = ['audio/wav', 'audio/mp3', 'audio/flac'];

/**
 * A mime renderer factory for wav data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: MIME_TYPES,
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
      mimeTypes: [MIME_TYPES[0]],
      extensions: ['.wav']
    },
    {
      name: 'mp3',
      fileFormat: 'base64',
      mimeTypes: [MIME_TYPES[1]],
      extensions: ['.mp3']
    },
    {
      name: 'flac',
      fileFormat: 'base64',
      mimeTypes: [MIME_TYPES[2]],
      extensions: ['.flac']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'JupyterLab wav viewer',
    primaryFileType: 'wav',
    modelName: 'base64',
    fileTypes: ['wav', 'mp3', 'flac'],
    defaultFor: ['wav', 'mp3', 'flac']
  }
};

export default extension;

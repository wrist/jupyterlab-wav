import { IRenderMime } from '@jupyterlab/rendermime-interfaces';



import { Widget } from '@lumino/widgets';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'audio/wav';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-wav';

/**
 * A widget for rendering wav.
 */
export class WavWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    this._audio = document.createElement('audio');
    this._audio.setAttribute('controls', '');
    this.node.appendChild(this._audio);
  }

  /**
   * Render wav into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    
    let data = model.data[this._mimeType] as string;
    this._audio.src = `data:${MIME_TYPE};base64,${data}`
    
    return Promise.resolve();
  }

  private _audio: HTMLAudioElement;
  private _mimeType: string;
}

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

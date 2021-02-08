import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import React from 'react';
import AudioComponent from './AudioComponent';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-wav';

/**
 * A widget for rendering wav.
 */
export class WavWidget extends ReactWidget implements IRenderMime.IRenderer {
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this._src = '';
    this.addClass(CLASS_NAME);

    console.log('WavWidget created');
    console.log(`options.mimeType: ${this._mimeType}`);
  }

  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    console.log('WavWidget renderModel called');

    const data = model.data[this._mimeType] as string;
    this._src = `data:${this._mimeType};base64,${data}`;

    this.update();

    return Promise.resolve();
  }

  render() {
    console.log('WavWidget render called');
    return <AudioComponent src={this._src} />;
  }

  private _src: string;
  private _mimeType: string;
}

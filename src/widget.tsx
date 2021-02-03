import { Widget } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import React from 'react';
import AudioComponent from './AudioComponent';

/**
 * The default mime type for the extension.
 */
export const MIME_TYPE = 'audio/wav';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-wav';

/**
 * A widget for rendering wav.
 */
//export class WavWidget extends ReactWidget implements IRenderMime.IRenderer {
export class WavWidget extends Widget implements IRenderMime.IRenderer {
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this._widget = undefined;
    this.addClass(CLASS_NAME);

    console.log('WavWidget created');
  }

  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    console.log('WavWidget renderModel called');

    const data = model.data[this._mimeType] as string;
    const src = `data:${MIME_TYPE};base64,${data}`;

    if (this._widget) {
      Widget.detach(this._widget);
      console.log('this._widget is detached');
    }

    this._widget = ReactWidget.create(<AudioComponent src={src} />);

    Widget.attach(this._widget, this.node);

    console.log('ReactWidget is created and attached to this.node');

    return Promise.resolve();
  }

  private _mimeType: string;
  private _widget?: Widget;
}

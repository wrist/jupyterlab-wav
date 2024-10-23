import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';

import WaveSurfer from 'wavesurfer.js';
import TimeLine from 'wavesurfer.js/dist/plugins/timeline';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';
import RegionsPlugin, {Region} from 'wavesurfer.js/dist/plugins/regions';

import colormap from 'colormap';

import {getDumpText, getUint32LE, getInt16LE} from './binutils';

type AudioProps = { src?: string };

type AnalysisParams = {
  nyquistFrequency: number;
  fftsize: number;
  maxFrequency: number|undefined;
  freqScale: string|any;
  colormapName: string;
};

/**
 * @returns The React component
 */
const AudioComponent = (props: AudioProps): JSX.Element => {
  const zoomRange = { min: 100, max: 1000, initial: 400 };
  const heightRange = { min: 100, max: 400, initial: 160 };
  // const fftWindows = [
  //   { value: 'bartlett', label: 'Bartlett'},
  //   { value: 'bartlettHann', label: 'Bartlett-Hann'},
  //   { value: 'blackman', label: 'Blackman'},
  //   { value: 'cosine', label: 'Cosine'},
  //   { value: 'gauss', label: 'Gaussian'},
  //   { value: 'hamming', label: 'Hamming'},
  //   { value: 'hann', label: 'Hann(ing)'},
  //   { value: 'lanczoz', label: 'Lanczoz'},
  //   { value: 'rectangular', label: 'Rectangular (no window)'},
  //   { value: 'triangular', label='Triangular'}
  // ];
  const nyquistFrequencyOptions = [
    { value:  4000, label: '4000' },
    { value:  8000, label: '8000' },
    { value: 16000, label: '16000' },
    { value: 22050, label: '22050' },
    { value: 24000, label: '24000' },
    { value: 44100, label: '44100' },
    { value: 48000, label: '48000' },
  ];
  const fftSizeOptions = [
    { value:  256, label: '256' },
    { value:  512, label: '512' },
    { value: 1024, label: '1024' },
  ];
  const maxFrequencyOptions = [
    { value: undefined, label: 'all' },
    { value:  1000, label:  '1000' },
    { value:  2000, label:  '2000' },
    { value:  5000, label:  '5000' },
    { value: 10000, label: '10000' },
    { value: 12000, label: '12000' },
    { value: 15000, label: '15000' },
    { value: 20000, label: '20000' },
  ];
  const freqScaleOptions = [
    { value: 'linear', label: 'Linear scale'},
    { value: 'mel', label: 'Mel scale'},
  ];
  const colormapNameOptions = [
    { value: 'gray', label: 'Grayscale (ws)' },
    { value: 'gray', label: 'Inversed Grayscale (ws)' },
    { value: 'roseus', label: 'roseus (ws)' },
    { value: 'viridis', label: 'viridis' },
    { value: 'plasma', label: 'plasma' },
    { value: 'inferno', label: 'inferno' },
    { value: 'magma', label: 'magma' },
    { value: 'jet', label: 'jet (not recommended)' },
  ]

  const [isPlaying, setPlaying] = useState<boolean|undefined>(undefined);
  const [zoom, setZoom] = useState(zoomRange.initial);
  const [height, setHeight] = useState(heightRange.initial);

  const [fftSize, setFftSize] = useState(fftSizeOptions[1]);
  const [nyquistFrequency, setNyquistFrequency] = useState(nyquistFrequencyOptions[4]);
  const [maxFrequency, setMaxFrequency] = useState(maxFrequencyOptions[5]);
  const [freqScale, setFreqScale] = useState(freqScaleOptions[0]);
  const [colormapName, setColormapName] = useState(colormapNameOptions[3]);
  // const fftWindow:any = fftWindows[7];
  const lastParams = useRef<AnalysisParams>({
    nyquistFrequency: nyquistFrequencyOptions[4].value,
    fftsize: fftSizeOptions[1].value,
    maxFrequency: maxFrequencyOptions[5].value,
    freqScale: freqScaleOptions[0].value,
    colormapName: colormapNameOptions[3].value
  });

  // const [keypress, setKeyPress] = useState(false);

  const [wavedataBlob, setWavedataBlob] = useState<string|undefined>(undefined);


  const wavesurferRef = useRef<WaveSurfer>();
  //const spectrogramRef = useRef<Spectrogram>();
  const wsRegionsRef = useRef<RegionsPlugin>();
  const [activeRegion, setActiveRegion] = useState<Region|undefined>(undefined);

  const waveContainerRef = useRef<HTMLDivElement>(null);
  const spectrogramContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const dumpWavefileView = useRef<HTMLDivElement>(null)

  const [audioSampleRate, setAudioSampleRate] = useState<number>(-1);

  const waveColor = '#4BF2A7';

  const [isAudioLoaded, setAudioLoaded] = useState(false);
  const regexBase64Text = /base64,/g;

  useEffect(() => {
    if (! dumpWavefileView.current) { return; }
    if (! wavedataBlob) { return; }

    const text:string = wavedataBlob;

    let pos = text.slice(0, 64).search(regexBase64Text);
    if(pos === -1) { return; }
    pos = pos + 7;  // len("base64,") == 7
  
    // Dump small data.
    // - 192 chars (144 bytes) ==> 8 columns x 16 bytes
    const rawdata128 = atob(text.slice(pos, pos+192));

    // Dump 1: Hex dump
    const html_dump_raw = '<code>' + getDumpText(rawdata128, 8) + '</code>';

    // Dump 2: Extract WAVEFORMATEX structure
    // https://learn.microsoft.com/ja-jp/windows/win32/medfound/tutorial--decoding-audio
    let html_waveinfo = '';

    if('RIFF' !== rawdata128.slice(0, 4)) { return; }

    const filesize = getUint32LE(rawdata128, 4) + 8;
    console.log(filesize);

    if(rawdata128.slice(8, 12) === 'WAVE') {
      let offset = 12;
      let format, nChannel, nSamplesPerSec, nAvgBytesPerSec, nBlockAlign,
          wBitsPerSample; //, cbSize;
      let datalength = 0;
      while(offset < 128) {
        if(rawdata128.slice(offset, offset+4) === 'fmt ') {
          const chunk_size = getUint32LE(rawdata128, offset+4);
          offset += 8;
          format          =  getInt16LE(rawdata128, offset+0);
          nChannel        =  getInt16LE(rawdata128, offset+2);
          nSamplesPerSec  = getUint32LE(rawdata128, offset+4);
          nAvgBytesPerSec = getUint32LE(rawdata128, offset+8);
          nBlockAlign     =  getInt16LE(rawdata128, offset+12);
          wBitsPerSample  =  getInt16LE(rawdata128, offset+14);
          //cbSize          =  getInt16LE(rawdata128, offset+16); // not used.
          offset += chunk_size;
          continue;
        }
        if(rawdata128.slice(offset, offset+4) === 'data') {
          datalength = getUint32LE(rawdata128, offset+4);
          offset += datalength + 8;
          continue;
        }
      }
      setAudioSampleRate(nSamplesPerSec);

      const len_second = datalength / nAvgBytesPerSec;
      const len_sample = datalength / nBlockAlign;

      html_waveinfo = 'Format = ' + format.toString() + ';'
        + nChannel.toString() + 'ch, ' + (wBitsPerSample).toString() + ' bit, '
        + nSamplesPerSec.toString() + ' Hz; ' 
        + 'Data Length: ' + len_sample.toString() + ' sample'
        + ' (' + len_second.toFixed(3).toString() + ' sec)';
    }


    dumpWavefileView.current.innerHTML = '<div>' + html_waveinfo + '</div>'
                                        + '<div>' + html_dump_raw + '</div>';

  }, [dumpWavefileView, wavedataBlob])

  // construct wavesurfer
  useEffect(() => {
    if(!waveContainerRef.current) { return; }
    // if(timelineContainerRef.current == null) return;
    // if(spectrogramContainerRef.current == null) return;

    if (wavesurferRef.current &&
        (
          lastParams.current.fftsize !== fftSize.value ||
          lastParams.current.nyquistFrequency !== nyquistFrequency.value ||
          lastParams.current.maxFrequency !== maxFrequency.value ||
          lastParams.current.freqScale !== freqScale.value ||
          lastParams.current.colormapName !== colormapName.value
        )
    ){
        // Redraw with another analysis parameter
        wavesurferRef.current.destroy();
        wavesurferRef.current = undefined;
        console.log('WaveSurfer was destroyed.');
    }

    if(wavesurferRef.current) { return; }

    let colors:any = undefined;
    if(colormapName.value === 'gray' || colormapName.value === 'igray' || colormapName.value === 'roseus') {
      colors = colormapName.value
    } else {
      colors = colormap({
        colormap: colormapName.value,
        nshades: 256, format: 'float'
      });
    }

    console.log('WaveSurfer.create called');

    const wsRegions:RegionsPlugin = RegionsPlugin.create();

    const ws = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: waveColor,
      fillParent: true,
      hideScrollbar: false,
      minPxPerSec: 100,
      splitChannels: [ { overlay: false } ],
      sampleRate: 2 * nyquistFrequency.value,
      plugins: [
        TimeLine.create({
          //container: timelineContainerRef.current
          height: 20,
          primaryLabelInterval: 1,
          style: {
            fontSize: '20px',
            color: '#2D5B88',
          }
        }),
        Spectrogram.create({
          // container: spectrogramContainerRef.current,
          labels: true,
          colorMap: colors,
          fftSamples: fftSize.value,
          frequencyMax: maxFrequency.value,
          windowFunc: 'hann',
          scale: freqScale.value as any,
          splitChannels: true,
          height: fftSize.value   // height < fftSamples would be cause invalid freq axis.
                        // Anyway, Preferably a power of 2 for Y-axis label.
                        // See also the variable 'labelIndex' in Spectrogram.loadLabels().
        }),
        wsRegions
      ]
    });

    wsRegions.enableDragSelection({
      color: 'rgba(255, 64, 64, 0.3)',
    });
    wsRegions.on('region-out', (region) => {
      // console.log('region-out', region);
      if(ws.isPlaying() && ws.getCurrentTime() > region.end) {
        ws.pause();
      }
      console.log(wsRegions.getRegions());
    });
    wsRegions.on('region-created', (region) => {
      // console.log('region-created', region);
      wsRegions.getRegions().forEach((r) => {
        if(region.id !== r.id) { r.remove(); }
      });
      setActiveRegion(region);
      // console.log(wsRegions.getRegions());
    });
    wsRegions.on('region-updated', (region) => {
      // console.log('region-updated', region);
      setActiveRegion(undefined);
      setActiveRegion(region);
    });
    ws.on('interaction', (newTime) => {
      // console.log('interaction', newTime);
      const r = wsRegions.getRegions();
      if(r.length > 0) {
        if(newTime < r[0].start || r[0].end < newTime) {
          wsRegions.clearRegions();
          setActiveRegion(undefined);
        }
      }
     });
  

    wavesurferRef.current = ws;
    wsRegionsRef.current = wsRegions;

    lastParams.current.nyquistFrequency = nyquistFrequency.value;
    lastParams.current.fftsize = fftSize.value;
    lastParams.current.maxFrequency = maxFrequency.value;
    lastParams.current.freqScale = freqScale.value;
    lastParams.current.colormapName = colormapName.value;

    setAudioLoaded(false);

  }, [
    wavesurferRef, wsRegionsRef,
    waveContainerRef, spectrogramContainerRef, timelineContainerRef,
    nyquistFrequency, fftSize, maxFrequency, freqScale, colormapName
  ]);

  // load a wave file
  useEffect(() => {
    console.log('wavesurfer.set data');
    setWavedataBlob(props.src)
    setAudioLoaded(false)
  }, [props.src]);

  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && wavedataBlob && !isAudioLoaded) {
      console.log('wavesurfer.load called');
      wavesurfer.load(wavedataBlob)
        .then(()=> {
          setAudioLoaded(true);
        });
    }
  }, [wavesurferRef, wavedataBlob, isAudioLoaded]);

  // play/pause based on the state
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer) { return; }
    if (!wsRegionsRef.current) { return; }

    if (isPlaying) {
      const r = wsRegionsRef.current.getRegions();
      if (r.length > 0) {
        const ct = wavesurfer.getCurrentTime();
        if (ct < r[0].start || r[0].end < ct) {
          wavesurfer.setTime(r[0].start);
        }
      }
      wavesurfer.play();
      wavesurfer.once('pause', () => {
        setPlaying(false);
      });
    } else {
      wavesurfer.pause();
    }
  }, [wavesurferRef, wsRegionsRef, isPlaying]);

  // control zoom
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isAudioLoaded) {
      wavesurfer.zoom(/*pxPerSec=*/ zoom);
      // wavesurfer.getActivePlugins()[0]._init(wavesurfer);
      // wavesurfer.getActivePlugins()[1]._init(wavesurfer);

      wavesurfer.setOptions({
        height: height
      })
    }
  }, [wavesurferRef, zoom, height, isAudioLoaded]);

  /*
  // space key handling
  const downHandler = e => {
    if (e.key === ' ') {
      setKeyPress(true);
    }
  };
  const upHandler = e => {
    if (e.key === ' ') {
      setKeyPress(false);
    }
  };

  useEffect(() => {
    // register
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    // cleanup
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);

  // toggle isPlaying for every keyPress
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer) {
      if (keypress) {
        setPlaying(!isPlaying);
      }
    }
  }, [wavesurferRef, keypress]);
  */

  return (
    <div style={{ width: '100%' }}>
      {/* <div id="timeline" ref={timelineContainerRef} /> */}
      <div id="waveform" ref={waveContainerRef} />
      {/* <div id="spectrogram" ref={spectrogramContainerRef} /> */}
      <div>
        <button
          onClick={() => {
            isPlaying ? setPlaying(false) : setPlaying(true);
          }}
        >
          {' '}
          Play/Pause{' '}
        </button>
        <span> {isPlaying ? 'Playing' : 'Pause'} </span>
      </div>
      <hr />
      <div id="zoom" className={'analysis_params'}>
        <input
          type="range"
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          min={zoomRange.min}
          max={zoomRange.max}
          style={{ width: '200px' }}
        />
        x-zoom: {zoom} [pixel/sec]
      </div>
      <div id="height" className={'analysis_params'}>
        <input
          type="range"
          value={height}
          onChange={e => setHeight(Number(e.target.value))}
          min={heightRange.min}
          max={heightRange.max}
          style={{ width: '200px' }}
        />
        height: {height} [pixel]
      </div>
      <div id="option_panel" style={{ margin: '20px' }}>
        <div><strong>Sample rate:</strong> <code>{audioSampleRate}</code> Hz</div>
        <div id="region">
          <strong>Region:</strong>
          <code>({(activeRegion) ? activeRegion.start.toFixed(3) : ''},
                {(activeRegion) ? activeRegion.end.toFixed(3) : ''})</code> sec.
          /
          <code>[{(activeRegion) ? (activeRegion.start * audioSampleRate).toFixed(0) : ''},
                {(activeRegion) ? (activeRegion.end * audioSampleRate).toFixed(0) : ''}]</code> sample
        </div>

        <details open>
          <summary><strong>Analysis paramters</strong></summary>

          <label className={'analysis_params'}>
            <div>Nyquist frequency (sampling_rate / 2)</div>
            <Select
              options={nyquistFrequencyOptions}
              defaultValue={nyquistFrequency}
              onChange={(value) => { value ? setNyquistFrequency(value) : null;}}
            />
          </label>

          <label className={'analysis_params'}>
            <div>FFT size</div>
            <Select
              options={fftSizeOptions}
              defaultValue={fftSize}
              onChange={(value) => { value ? setFftSize(value) : null;}}
            />
          </label>

          <label className={'analysis_params'}>
            <div>Max frequency to visualize (not hicut filter)</div>
            <Select
              options={maxFrequencyOptions}
              defaultValue={maxFrequency}
              onChange={(value) => { value ? setMaxFrequency(value) : null;}}
            />
          </label>

          <label className={'analysis_params'}>
            <div>Frequency scale</div>
            <Select
              options={freqScaleOptions}
              defaultValue={freqScale}
              onChange={(value) => { value ? setFreqScale(value) : null;}}
            />
          </label>

          <label className={'analysis_params'}>
            <div>Colormap</div>
            <Select
              options={colormapNameOptions}
              defaultValue={colormapName}
              onChange={(value) => { value ? setColormapName(value) : null;}}
            />
          </label>
        </details>
        <details>
          <summary><strong>WAV dump</strong></summary>
          <div id="dump" ref={dumpWavefileView}></div>
        </details>
      </div>{/* option_panel */}
    </div>
  );
};

export default AudioComponent;

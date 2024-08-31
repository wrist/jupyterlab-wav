import React, { useState, useEffect, useRef } from 'react';
import Select from "react-select";

import WaveSurfer from 'wavesurfer.js';
import TimeLine from 'wavesurfer.js/dist/plugins/timeline';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';

import colormap from 'colormap';

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
    { value:  4000, label: "4000" },
    { value:  8000, label: "8000" },
    { value: 16000, label: "16000" },
    { value: 22050, label: "22050" },
    { value: 24000, label: "24000" },
    { value: 44100, label: "44100" },
    { value: 48000, label: "48000" },
  ];
  const fftSizeOptions = [
    { value:  256, label: "256" },
    { value:  512, label: "512" },
    { value: 1024, label: "1024" },
    { value: 2048, label: "2048" },
    { value: 4096, label: "4096" },
  ];
  const maxFrequencyOptions = [
    { value: undefined, label: "all" },
    { value:  1000, label:  "1000" },
    { value:  2000, label:  "2000" },
    { value:  4000, label:  "4000" },
    { value:  8000, label:  "8000" },
    { value: 12000, label: "12000" },
    { value: 16000, label: "16000" },
    { value: 20000, label: "20000" },
  ];
  const freqScaleOptions = [
    { value: "linear", label: "Linear scale"},
    { value: "mel", label: "Mel scale"},
  ];
  const colormapNameOptions = [
    { value: "gray", label: "Grayscale (ws)" },
    { value: "igray", label: "Inversed Grayscale (ws)" },
    { value: "roseus", label: "roseus (ws)" },
    { value: "viridis", label: "viridis" },
    { value: "plasma", label: "plasma" },
    { value: "inferno", label: "inferno" },
    { value: "magma", label: "magma" },
    { value: "jet", label: "jet (not recommended)" },
  ]

  const [isPlaying, setPlaying] = useState<boolean|undefined>(undefined);
  const [zoom, setZoom] = useState(zoomRange.initial);

  const [fftSize, setFftSize] = useState(fftSizeOptions[2]);
  const [nyquistFrequency, setNyquistFrequency] = useState(nyquistFrequencyOptions[4]);
  const [maxFrequency, setMaxFrequency] = useState(maxFrequencyOptions[5]);
  const [freqScale, setFreqScale] = useState(freqScaleOptions[0]);
  const [colormapName, setColormapName] = useState(colormapNameOptions[3]);
  // const fftWindow:any = fftWindows[7];
  const lastParams = useRef<AnalysisParams>({
    nyquistFrequency: nyquistFrequencyOptions[4].value,
    fftsize: fftSizeOptions[2].value,
    maxFrequency: maxFrequencyOptions[5].value,
    freqScale: freqScaleOptions[0].value,
    colormapName: colormapNameOptions[3].value
  });

  // const [keypress, setKeyPress] = useState(false);

  const [wavedataBlob, setWavedataBlob] = useState<string|undefined>(undefined);


  const wavesurferRef = useRef<WaveSurfer>();
  //const spectrogramRef = useRef<Spectrogram>();

  const waveContainerRef = useRef<HTMLDivElement>(null);
  const spectrogramContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const waveColor = '#4BF2A7';

  // const colors = colormap({
  //   colormap: 'plasma',
  //   nshades: 256,
  //   format: 'float'
  // });

  const [isAudioLoaded, setAudioLoaded] = useState(false);

  // construct wavesurfer
  useEffect(() => {
    if(waveContainerRef.current == null) return;
    // if(timelineContainerRef.current == null) return;
    // if(spectrogramContainerRef.current == null) return;

    if (wavesurferRef.current &&
        (
          lastParams.current.fftsize != fftSize.value ||
          lastParams.current.nyquistFrequency != nyquistFrequency.value ||
          lastParams.current.maxFrequency != maxFrequency.value ||
          lastParams.current.freqScale != freqScale.value ||
          lastParams.current.colormapName != colormapName.value
        )
    ){
        // Redraw with another analysis parameter
        wavesurferRef.current.destroy();
        wavesurferRef.current = undefined;
        console.log('WaveSurfer was destroyed.');
    }

    if(wavesurferRef.current) return;

    let colors:any = undefined;
    if(colormapName.value == 'gray' || colormapName.value == 'igray' || colormapName.value == 'roseus') {
      colors = colormapName.value
    } else {
      colors = colormap({
        colormap: colormapName.value,
        nshades: 256, format: 'float'
      });
    }

    console.log('WaveSurfer.create called');
    wavesurferRef.current = WaveSurfer.create({
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
          height: 400
        })
      ]
    });

    lastParams.current.nyquistFrequency = nyquistFrequency.value;
    lastParams.current.fftsize = fftSize.value;
    lastParams.current.maxFrequency = maxFrequency.value;
    lastParams.current.freqScale = freqScale.value;
    lastParams.current.colormapName = colormapName.value;

    setAudioLoaded(false);

  }, [
    wavesurferRef,
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
        .then(()=> {setAudioLoaded(true);});
    }
  }, [wavesurferRef, wavedataBlob, isAudioLoaded]);

  // play/pause based on the state
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer) {
      if (isPlaying) {
        wavesurfer.play();
      } else {
        wavesurfer.pause();
      }
    }
  }, [wavesurferRef, isPlaying]);

  // control zoom
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isAudioLoaded) {
      wavesurfer.zoom(/*pxPerSec=*/ zoom);
      // wavesurfer.getActivePlugins()[0]._init(wavesurfer);
      // wavesurfer.getActivePlugins()[1]._init(wavesurfer);
    }
  }, [wavesurferRef, zoom, isAudioLoaded]);

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
      <button
        onClick={() => {
          isPlaying ? setPlaying(false) : setPlaying(true);
        }}
      >
        {' '}
        Play/Pause{' '}
      </button>
      <div> {isPlaying ? 'Playing' : 'Pause'} </div>
      <div id="zoom">
        <input
          type="range"
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          min={zoomRange.min}
          max={zoomRange.max}
          style={{ width: '100%' }}
        />
        zoom: {zoom} [pixel/sec]
      </div>
      <div>Analysis paramters</div>
      <div style={{ margin: "50px" }}>
        <div className={"analysis_params"}>
          <div>Nyquist frequency (sampling_rate / 2)</div>
          <Select
            options={nyquistFrequencyOptions}
            defaultValue={nyquistFrequency}
            onChange={(value) => { value ? setNyquistFrequency(value) : null;}}
          />
        </div>

        <div className={"analysis_params"}>
          <div>FFT size</div>
          <Select
            options={fftSizeOptions}
            defaultValue={fftSize}
            onChange={(value) => { value ? setFftSize(value) : null;}}
          />
        </div>

        <div className={"analysis_params"}>
          <div>Max frequency to visualize (not hicut filter)</div>
          <Select
            options={maxFrequencyOptions}
            defaultValue={maxFrequency}
            onChange={(value) => { value ? setMaxFrequency(value) : null;}}
          />
        </div>

        <div className={"analysis_params"}>
          <div>Frequency scale</div>
          <Select
            options={freqScaleOptions}
            defaultValue={freqScale}
            onChange={(value) => { value ? setFreqScale(value) : null;}}
          />
        </div>

        <div className={"analysis_params"}>
          <div>Colormap</div>
          <Select
            options={colormapNameOptions}
            defaultValue={colormapName}
            onChange={(value) => { value ? setColormapName(value) : null;}}
          />
        </div>
      </div>
              {/* <div id="fftSamples">
                    FFT size:
                    <select value={fftSamples} onChange={(e) => setFftSamples(Number(e.target.value))} >
                      {fftSamplesArray.map((value, index) => <option value={value} >{value}</option>)}
                    </select>
              </div> */}
    </div>
  );
};

export default AudioComponent;

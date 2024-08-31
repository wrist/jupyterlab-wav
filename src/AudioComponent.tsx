import React, { useState, useEffect, useRef } from 'react';

import WaveSurfer from 'wavesurfer.js';
import TimeLine from 'wavesurfer.js/dist/plugins/timeline';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram';

import colormap from 'colormap';

type AudioProps = { src?: string };

/**
 * @returns The React component
 */
const AudioComponent = (props: AudioProps): JSX.Element => {
  const zoomRange = { min: 1, max: 10000, initial: 1 };
  const fftSamplesArray = [...Array(18)].map((_, i) => Math.pow(2, i));
  const fftWindows = [
    'bartlett',
    'bartlettHann',
    'blackman',
    'cosine',
    'gauss',
    'hamming',
    'hann',
    'lanczoz',
    'rectangular',
    'triangular'
  ];

  const [isPlaying, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(zoomRange.initial);
  //const [fftSamples, setFftSamples] = useState(fftSamplesArray[8]);
  const fftSamples = fftSamplesArray[8];
  const fftWindow:any = fftWindows[6];
  // const [keypress, setKeyPress] = useState(false);
  const wavesurferRef = useRef<WaveSurfer>();

  const waveContainerRef = useRef<HTMLDivElement>(null);
  const spectrogramContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const waveColor = '#4BF2A7';

  const colors = colormap({
    colormap: 'plasma',
    nshades: 256,
    format: 'float'
  });

  const [isAudioLoaded, setAudioLoaded] = useState(false);

  // construct wavesurfer
  useEffect(() => {
    if (
      !wavesurferRef.current &&
      waveContainerRef.current !== null &&
      spectrogramContainerRef.current !== null &&
      timelineContainerRef.current !== null
    ) {
      console.log('WaveSurfer.create called');
      wavesurferRef.current = WaveSurfer.create({
        container: waveContainerRef.current,
        waveColor: waveColor,
        fillParent: true,
        hideScrollbar: false,
        splitChannels: [ { overlay: false } ],
        plugins: [
          TimeLine.create({
            container: timelineContainerRef.current
          }),
          Spectrogram.create({
            // wavesurfer: wavesurferRef.current,
            container: spectrogramContainerRef.current,
            labels: true,
            colorMap: colors,
            fftSamples: fftSamples,
            windowFunc: fftWindow,
            splitChannels: true,
            height: 120
          })
        ]
      });
      setAudioLoaded(false);

    }

    // return () => {
    //   const wavesurfer = wavesurferRef.current;
    //   console.log("WaveSurfer unmounted");
    //   if (wavesurfer){
    //     if(wavesurfer.isPlaying()) { wavesurfer.pause(); }
    //     // wavesurfer.destroy();
    //   }
    // };
  }, [
    wavesurferRef,
    waveContainerRef,
    spectrogramContainerRef,
    timelineContainerRef,
    colors,
    fftSamples
  ]);

  // load a wave file
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && props.src) {
      console.log('wavesurfer.load called');
      wavesurfer.load(props.src)
        .then(()=> {setAudioLoaded(true);});
    }
  }, [wavesurferRef, props.src]);

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
      // wavesurfer.spectrogram.init();
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
      <div id="timeline" ref={timelineContainerRef} />
      <div id="waveform" ref={waveContainerRef} />
      <div id="spectrogram" ref={spectrogramContainerRef} />
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
      {/*
              <div id="fftSamples">
                    FFT size:
                    <select value={fftSamples} onChange={(e) => setFftSamples(Number(e.target.value))} >
                      {fftSamplesArray.map((value, index) => <option value={value} >{value}</option>)}
                    </select>
              </div>
              */}
    </div>
  );
};

export default AudioComponent;

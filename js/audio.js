var CHANNEL_MAP = (function(data) {
  var obj = {};
  for(var key in data) {
    ogg = key.split(" ");
    webAudio = data[key].split(" ");
    obj[ogg.length] = ogg.map(x => webAudio.indexOf(x))
  }
  return obj;
})({
  // Ogg spec: WebAudio spec
  "M": "M",
  "L R": "L R",
  "L C R": "L C R",             // undefined in webaudio
  "L R SL SR": "L R SL SR",
  "L C R SL SR": "L C R SL SR", // undefined in webaudio
  "L C R SL SR LFE": "L R C LFE SL SR"
  // 7+ channels unsupported
});

class AudioWrapper extends EventEmitter {
  constructor(audio, data) {
    super();
    this.audio = audio;
    this.gain = this.audio.createGain();
    this.data = data;

    this.gain.connect(this.audio.destination);
  }
  play(layer) {
    this._load().then(buffers => {
      if(!buffers[layer]) {
        layer = 0;
      }

      this._startTime = !this._source ? this.audio.currentTime : this._startTime;
      this.stop(true);

      this._source = this.audio.createBufferSource();
      this._source.buffer = buffers[layer];
      this._source.loop = true;
      if(this.data['loopStart'] !== undefined) {
        this._source.loopStart = this.data.loopStart / this.data.frequency;
        this._source.loopEnd = this.data.loopEnd / this.data.frequency;
      }

      this._source.connect(this.gain);
      this._source.start(0, this.audio.currentTime - this._startTime);

      window.clearTimeout(this._gcTimeout);
    });
  }
  stop(disableGc) {
    if(this._source) {
      this._source.stop();
      delete this._source;
    }
    if(!disableGc) {
      this._gcTimeout = window.setTimeout(() => {
        this._unload();
      }, 30000);
    }
  }
  volume(value) {
    this.gain.gain.value = value / 100;
  }
  _load(callback) {
    if(this._buffers) {
      return Promise.resolve(this._buffers);
    }

    this.emit('loadstart');
    return fetch(this.data.path)
    .then(response => response.arrayBuffer())
    .then(buffer => audio.decodeAudioData(buffer))
    .then(buffer => {
      this._buffers = [];
      for(var i = 0; i < buffer.numberOfChannels; i += 2) {
        var tempBuffer = audio.createBuffer(2, buffer.length, buffer.sampleRate);
        tempBuffer.copyToChannel(buffer.getChannelData(CHANNEL_MAP[buffer.numberOfChannels][i]), 0);
        tempBuffer.copyToChannel(buffer.getChannelData(CHANNEL_MAP[buffer.numberOfChannels][i + 1]), 1);
        this._buffers.push(tempBuffer);
      }
      this.emit("loadend");
      return this._buffers;
    });
  }
  _unload() {
    delete this._buffers;
  }
}

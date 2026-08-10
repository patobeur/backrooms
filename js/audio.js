export class BackroomsAudio {
  constructor(){this.context=null;this.master=null;this.sources=[];this.running=false;this.following=false;}
  async start(){
    if(this.running){if(this.context.state==="suspended")await this.context.resume();return;}
    this.context=new AudioContext(); await this.context.resume(); this.running=true;
    this.master=this.context.createGain();this.master.gain.value=.22;this.master.connect(this.context.destination);
    const filter=this.context.createBiquadFilter();filter.type="lowpass";filter.frequency.value=700;filter.connect(this.master);
    [50,100,150].forEach((frequency,index)=>{const oscillator=this.context.createOscillator(),gain=this.context.createGain();oscillator.type=index?"triangle":"sine";oscillator.frequency.value=frequency;gain.gain.value=.045/(index+1);oscillator.connect(gain).connect(filter);oscillator.start();this.sources.push(oscillator);});
    const length=this.context.sampleRate*2,buffer=this.context.createBuffer(1,length,this.context.sampleRate),data=buffer.getChannelData(0);let brown=0;
    for(let i=0;i<length;i++){brown=(brown+.018*(Math.random()*2-1))/1.018;data[i]=brown*3;}
    const noise=this.context.createBufferSource(),noiseFilter=this.context.createBiquadFilter(),noiseGain=this.context.createGain();noise.buffer=buffer;noise.loop=true;noiseFilter.type="bandpass";noiseFilter.frequency.value=115;noiseGain.gain.value=.1;noise.connect(noiseFilter).connect(noiseGain).connect(this.master);noise.start();this.sources.push(noise);
  }
  electrical(){if(!this.context)return;const now=this.context.currentTime,o=this.context.createOscillator(),g=this.context.createGain();o.type="sawtooth";o.frequency.setValueAtTime(180,now);o.frequency.exponentialRampToValueAtTime(45,now+.45);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.18,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.5);o.connect(g).connect(this.context.destination);o.start(now);o.stop(now+.52);}
  setFollowing(value){if(value===this.following)return;this.following=value;if(!value||!this.context)return;const now=this.context.currentTime;[0,.065].forEach((delay,index)=>{const o=this.context.createOscillator(),g=this.context.createGain();o.type="triangle";o.frequency.value=index?1568:1175;g.gain.setValueAtTime(.0001,now+delay);g.gain.exponentialRampToValueAtTime(.16,now+delay+.008);g.gain.exponentialRampToValueAtTime(.0001,now+delay+.095);o.connect(g).connect(this.context.destination);o.start(now+delay);o.stop(now+delay+.11);});}
  mute(value){if(!this.master)return;this.master.gain.setTargetAtTime(value?.0001:.22,this.context.currentTime,.04);}
}

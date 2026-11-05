const axis=value=>Math.sign(value)*Math.max(0,Math.abs(value)-.16)/.84;
export function gamepadInput(api){
  let previous=[],wasMining=false;
  return {
    reset(){previous=[];wasMining=false},
    read(dt){
      let pads;
      try{pads=navigator.getGamepads?.()}catch{}
      const pad=pads&&Array.from(pads).find(p=>p?.connected&&p.mapping==='standard');
      if(!pad){if(wasMining)api.mine(false);wasMining=false;previous=[];return {}}
      const buttons=pad.buttons.map(b=>b.pressed),pressed=i=>buttons[i]&&!previous[i];
      if(pressed(0))api.jump();
      if(pressed(4))api.cycle(-1);
      if(pressed(5))api.cycle(1);
      if(pressed(6))api.build();
      if(wasMining!==buttons[7])api.mine(buttons[7]);
      wasMining=buttons[7];
      const dx=axis(pad.axes[2]||0),dy=axis(pad.axes[3]||0);
      if(dx||dy)api.turn(dx*dt*760,dy*dt*590);
      if(pressed(3))api.pack();
      else if(pressed(9))api.pause();
      previous=buttons;
      return {f:-axis(pad.axes[1]||0),r:axis(pad.axes[0]||0),up:buttons[0],down:buttons[1],sprint:buttons[10]};
    }
  };
}

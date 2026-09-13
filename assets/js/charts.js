(function(){
  if(typeof Chart === 'undefined') return;

  var COLOR_TEXT = '#8C8A82';
  var COLOR_GRID = 'rgba(244,242,236,0.06)';
  var COLOR_WHITE = '#F4F2EC';
  var COLOR_LIME = '#A6FF2E';
  var COLOR_CYAN = '#21E8D8';

  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 10.5;
  Chart.defaults.color = COLOR_TEXT;

  function fmtPace(v){
    var m = Math.floor(v);
    var s = Math.round((v-m)*60);
    if(s===60){ m+=1; s=0; }
    return m+':'+(s<10?'0':'')+s;
  }

  function baseScales(yExtra, xExtra){
    var s = {
      x:{ grid:{ color:COLOR_GRID, drawTicks:false }, border:{ color:'rgba(244,242,236,0.12)' }, ticks:{ color:COLOR_TEXT } },
      y:{ grid:{ color:COLOR_GRID, drawTicks:false }, border:{ display:false }, ticks:{ color:COLOR_TEXT } }
    };
    if(yExtra) Object.assign(s.y, yExtra);
    if(xExtra) Object.assign(s.x, xExtra);
    return s;
  }

  var builders = {

    'chart-vo2': function(ctx){
      var weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
      var vals = [44.2,44.6,45.1,45.7,46.2,46.9,47.3,48.0,48.7,49.5,50.3,51.1];
      return new Chart(ctx, {
        type:'line',
        data:{ labels:weeks, datasets:[{
          data:vals, borderColor:COLOR_LIME, backgroundColor:'rgba(166,255,46,0.08)',
          borderWidth:2, pointRadius:0, tension:0.35, fill:true
        }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1400, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.parsed.y.toFixed(1)+' ml/kg/min'; } } } },
          scales: baseScales({ suggestedMin:42 })
        }
      });
    },

    'chart-load': function(ctx){
      var weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
      var vals  = [420,460,500,300,480,520,560,340,540,580,620,360];
      var colors = vals.map(function(v,i){ return (i+1)%4===0 ? COLOR_CYAN : COLOR_LIME; });
      return new Chart(ctx, {
        type:'bar',
        data:{ labels:weeks, datasets:[{ data:vals, backgroundColor:colors, borderRadius:2, maxBarThickness:22 }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1200, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.parsed.y+' load units'; } } } },
          scales: baseScales()
        }
      });
    },

    'chart-hrv': function(ctx){
      var labels = [], vals = [];
      for(var i=0;i<30;i++){
        labels.push('D'+(i+1));
        var v = 61 + 7*Math.sin(i/4.2) + 3*Math.sin(i*1.3);
        if(i%9===4 || i%9===5) v -= 9;
        vals.push(Math.round(v*10)/10);
      }
      return new Chart(ctx, {
        type:'line',
        data:{ labels:labels, datasets:[{
          data:vals, borderColor:COLOR_CYAN, backgroundColor:'rgba(33,232,216,0.08)',
          borderWidth:1.6, pointRadius:0, tension:0.3, fill:true
        }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1400, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.parsed.y+' ms'; } } } },
          scales: baseScales({ suggestedMin:40 }, { ticks:{ color:COLOR_TEXT, maxTicksLimit:6 } })
        }
      });
    },

    'chart-zones': function(ctx){
      var labels = ['Z1','Z2','Z3','Z4','Z5'];
      var vals = [38,34,12,11,5];
      var colors = [COLOR_TEXT, COLOR_LIME, COLOR_TEXT, COLOR_CYAN, COLOR_CYAN];
      return new Chart(ctx, {
        type:'bar',
        data:{ labels:labels, datasets:[{ data:vals, backgroundColor:colors, borderRadius:2 }]},
        options:{
          indexAxis:'y',
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1200, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.parsed.x+'% of time'; } } } },
          scales: baseScales()
        }
      });
    },

    'chart-cadence': function(ctx){
      var labels = ['158','162','166','170','174','178','182','186','190'];
      var vals =   [2,5,11,22,34,26,13,5,2];
      return new Chart(ctx, {
        type:'bar',
        data:{ labels:labels, datasets:[{ data:vals, backgroundColor:COLOR_LIME, borderRadius:2, maxBarThickness:26 }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1200, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{
            title:function(c){ return c[0].label+' spm'; },
            label:function(c){ return c.parsed.y+' runs'; }
          } } },
          scales: baseScales()
        }
      });
    },

    'chart-pace': function(ctx){
      var labels = ['400m','1mi','5K','10K','Half','Marathon'];
      var vals = [3.25, 3.85, 4.35, 4.60, 4.95, 5.25];
      return new Chart(ctx, {
        type:'line',
        data:{ labels:labels, datasets:[{
          data:vals, borderColor:COLOR_WHITE, backgroundColor:'rgba(244,242,236,0.06)',
          borderWidth:2, pointRadius:3, pointBackgroundColor:COLOR_WHITE, tension:0.25, fill:true
        }]},
        options:{
          responsive:true, maintainAspectRatio:false,
          animation:{ duration:1400, easing:'easeOutCubic' },
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return fmtPace(c.parsed.y)+' /km'; } } } },
          scales: baseScales({ ticks:{ color:COLOR_TEXT, callback:function(v){ return fmtPace(v); } } })
        }
      });
    }
  };

  var created = {};
  var canvases = document.querySelectorAll('.chart-box canvas');
  if(!('IntersectionObserver' in window)){
    canvases.forEach(function(c){ if(builders[c.id] && !created[c.id]){ created[c.id]=true; builders[c.id](c.getContext('2d')); } });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var id = entry.target.id;
      if(entry.isIntersecting && builders[id] && !created[id]){
        created[id] = true;
        builders[id](entry.target.getContext('2d'));
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.25 });
  canvases.forEach(function(c){ io.observe(c); });
})();

import {copyFileSync,mkdirSync,readdirSync,statSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dest='site/background';
mkdirSync(dest,{recursive:true});
for(let i=0;i<9;i++){
  const name='reel-hd-'+i+'.bin';
  copyFileSync(join('video-parts',name),join(dest,name));
}
function verify(dir){
  for(const item of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,item.name);
    if(item.isDirectory()) verify(path);
    else if(statSync(path).size>25*1024*1024) throw Error('File exceeds EdgeOne limit: '+path);
  }
}
verify('site');
// The EdgeOne and GitHub deployments use separate build commands.
const script = '<script defer src="/portfolio-analytics.js"></script>';
function includeTracker(directory) {
  for (const entry of readdirSync(directory,{withFileTypes:true})) {
    const path=join(directory,entry.name);
    if(entry.isDirectory()) includeTracker(path);
    else if(entry.name.endsWith('.html')) {
      const html=readFileSync(path,'utf8');
      if(html.includes('<div id="root">') && !html.includes(script)) {
        if(!html.includes('</head>')) throw Error('Missing document head in '+path);
        writeFileSync(path,html.replace('</head>',script+'</head>'));
      }
    }
  }
}
includeTracker('site');

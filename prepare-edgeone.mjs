import {copyFileSync,mkdirSync,readdirSync,statSync} from 'node:fs';
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
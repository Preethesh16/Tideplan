import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const chapters=JSON.parse(await readFile('public/demo/chapters.json','utf8'));
const start=String(chapters[4].start+1);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',start,'-t','11','-i','public/demo/tideplan-demo.mp4','-filter_complex','fps=8,scale=840:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0','docs/images/demo-preview.gif']);
console.log('README motion preview created.');

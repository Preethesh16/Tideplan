"""Media generation: pip install edge-tts; python scripts/generate-voice.py"""
import asyncio, json
from pathlib import Path
import edge_tts

async def main():
    scenes=json.loads(Path('scripts/demo-scenes.json').read_text())
    Path('work/voice').mkdir(parents=True,exist_ok=True)
    for i,scene in enumerate(scenes):
        await edge_tts.Communicate(scene['text'],'en-IN-PrabhatNeural',rate='+2%').save(f'work/voice/{i:02d}.mp3')
        print(f"Voice {i+1}/{len(scenes)}: {scene['id']}",flush=True)
asyncio.run(main())

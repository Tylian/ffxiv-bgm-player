# Final Fantasy XIV Web Player
Throw a bunch of ogg's and data extracted from the game at it and it'll loop music files for you.

## How to use
1. Extract all the music from the game, as well as the BGM file (BGM.csv)
2. Place them somewhere where the script can access it. The app itself expects the music to be in the `bgm/` folder of the root. So you should have the following folder at least: `bgm/music/ffxiv/`
3. Run `cd scripts && npm i`
4. Run `node bgm ../bgm ../bgm.csv ../bgm.json`, modify this command if you moved any of the files
5. Upload everything but the scripts folder to a web host.
const { promises: fs } = require('fs');
const mm = require('music-metadata');
const path = require('path');

const inputDirectory = path.resolve(process.argv[2]);
const dataFile = path.resolve(process.argv[3])
const outputFile = path.resolve(process.argv[4]);

async function* walk(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(res);
    } else {
      yield res;
    }
  }
}

function CSVtoArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  if (!re_valid.test(text)) return null;
  var a = [];                     // Initialize array to receive values.
  text.replace(re_value, // "Walk" the string using replace with callback.
      function(m0, m1, m2, m3) {
          // Remove backslash from \' in single quoted values.
          if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
          // Remove backslash from \" in double quoted values.
          else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
          else if (m3 !== undefined) a.push(m3);
          return ''; // Return empty string.
      });
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push('');
  return a;
};

function findTag(tags, name, defaultValue = 0) {
  return tags.find(tag => tag.id == name) !== undefined
    ? tags.find(tag => tag.id == name).value
    : defaultValue;
}

(async () => {
  const output = [];
  const file = await fs.readFile(dataFile, { encoding: 'UTF-8' });
  for(let line of file.split("\n")) {
    let [id, file] = CSVtoArray(line);

    if(isNaN(id) || file == "") continue;

    const input = path.join(inputDirectory, file).replace(/\.scd$/, '.ogg');
    const exists = await fs.stat(input)
      .then(stat => stat.isFile(), err => {
        if(err.code == "ENOENT") {
          return false;
        }
        throw err;
      });

    if(!exists) {
      console.log(`File ${input} doesn't exist, skipping...`);
      continue;
    }

    const metadata = await mm.parseFile(input);
    const layers = metadata.format.numberOfChannels == 1 ? 1 : metadata.format.numberOfChannels / 2;
    console.log(`File ${file} has ${layers} layers`);
    output.push({
      "id": parseInt(id, 10),
      "file": file.replace(/\.scd$/, ""),
      "frequency": metadata.format.sampleRate,
      "layers": layers,
      "loopStart": metadata.native.vorbis !== undefined ? parseInt(findTag(metadata.native.vorbis, "LOOPSTART"), 10) : 0,
      "loopEnd": metadata.native.vorbis !== undefined ? parseInt(findTag(metadata.native.vorbis, "LOOPEND"), 10) : 0
    });
  }

  await fs.writeFile(outputFile, JSON.stringify({ "bgm": output }, null, '  '));
})();
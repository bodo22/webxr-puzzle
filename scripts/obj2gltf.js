import obj2gltf from "obj2gltf";
import fs from "fs";
const options = {
  binary: true,
  inputUpAxis: "Z",
};
// obj2gltf("model.obj", options).then(function (glb) {
//   fs.writeFileSync("model.glb", glb);
// });

const basePath = "./public/models/simplified/all";

async function ls(path) {
  const dir = await fs.promises.opendir(path);
  const promises = [];
  for await (const dirent of dir) {
    if (dirent.isDirectory()) {
      continue;
    }
    console.log(dirent);
    const objPath = `${basePath}/${dirent.name}`;
    const glbPath = `${basePath}/glbs/${dirent.name.slice(0, -4)}.glb`;
    async function convert(objPath, glbPath) {
      dirent.name.startsWith("120_") ? options.inputUpAxis = "Y" : options.inputUpAxis = "Z";
      const glb = await obj2gltf(objPath, options);
      console.log("writing", glbPath);
      // fs.writeFileSync(glbPath, glb);
      fs.writeFile(glbPath, glb, () => {});
    }
    promises.push(convert(objPath, glbPath));
  }
  await Promise.all(promises);
}

ls(basePath).catch(console.error);

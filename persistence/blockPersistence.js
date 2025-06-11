const fs = require("fs");
const path = require("path");
const blockDir = "database/blocks";

const saveBlock = async (block) => {
  const fileName = `${block.height}.json`;
  const filePath = path.join(blockDir, fileName);

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(block, null, 3));
    return true;
  } catch (e) {
    console.error("Failed to save block:", e);
    throw e;
  }
};

const getAllBlocks = async () => {
  try {
    const files = await fs.promises.readdir(blockDir);

    // Only .json files, sorted by height /implement the logic of Each block is stored as an individual file.
    const jsonFiles = files
      .filter(f => f.endsWith(".json"))
      .sort((a, b) => parseInt(a) - parseInt(b));

    const blocks = await Promise.all(
      jsonFiles.map(async file => {
        const data = await fs.promises.readFile(path.join(blockDir, file), 'utf-8');
        return JSON.parse(data);
      })
    );

    return blocks;
  } catch (e) {
    console.error("Failed to load blocks:", e);
    return [];
  }
};

module.exports = {
  saveBlock,
  getAllBlocks
};

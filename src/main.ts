#!/usr/bin/env node

import chalk from "chalk";
import os from "os";
import fs from "fs/promises";

const currentDir = process.cwd();

async function main() {
  let envFileContents = await getEnvFile();
  console.log(envFileContents.match(/^###.*/gm));
}

async function getEnvFile(name = ".env") {
  try {
    return await fs.readFile(`${currentDir}/${name}`, { encoding: "utf8" });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();

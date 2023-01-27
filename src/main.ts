#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs/promises";
import { OptionValues, program } from "commander";
import figlet from "figlet";

main();

async function main() {
  /* Global Constants */
  const version = "0.0.1";
  const currentDir = process.cwd();

  /* Nice header when init */
  console.log(figlet.textSync("CLI Env Toggler"));

  /* Program config using Commander.js */
  program
    .version(version)
    .description("Toggle between your most used environment variables.")
    .argument("<group>", "The name of the group to toggle, keyed in the .env file like: '###-A' for group A.")
    .option("-l, --list-only", "List the changes and do not proceed")
    .option(
      "-n, --name  <value>",
      "The name of the .env file. This does not need to be passed if the file name is '.env'",
      ".env"
    )
    .option(
      "-p, --path  <value>",
      "The path to the .env file, defaults to the current directory. Note: Overrides the 'name' parameter when passes."
    )
    .showHelpAfterError("Add -h for help.")
    .parse();

  program.parse();

  /* Show help if no arguments are passed */
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

  const options = program.opts();
  console.log(options);

  const pathToEnv = computePathToEnv(options);
  const listOnly = options.listOnly ?? false;
  const groupName = options.groupName;

  handle();

  /* Functions */

  async function handle() {
    const envFileContents = await getEnvFile();
    const envByLine = envFileContents.split("\n");
    envByLine.forEach((val, idx) => {
      console.log(envFileContents.match(/^###.*/));
    });

    envByLine.push("test");
    let newEnvFile = envByLine.join("\n");
    await fs.writeFile(pathToEnv, newEnvFile);
  }

  function computePathToEnv(options: OptionValues) {
    if (options.path) {
      return options.path;
    }
    return `${currentDir}/${options.name}`;
  }

  async function getEnvFile() {
    try {
      return await fs.readFile(pathToEnv, { encoding: "utf8" });
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }
}

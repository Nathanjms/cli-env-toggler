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
    .description("Toggle between your most used environment variables by keying them.")
    .argument("<groupName>", "The name of the group to toggle, keyed in the .env file like: '###-A' for group A.")
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

  /* Show help if no arguments are passed */
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

  const options = program.opts();
  const listOnly = options.listOnly ?? false;
  const groupName = program.args[0];
  const pathToEnv = computePathToEnv(options);
  handle();

  /* Functions */

  async function handle() {
    const envFileContents = await getEnvFile();
    const envByLine = envFileContents.split("\n"); // Multiline env variables won't like this - future dev?
    const regexString = "^###-" + escapeRegExp(groupName) + `\\s*(.*)=(.*)$`;

    const envVarsToToggle: string[] = Array.from(envFileContents.matchAll(new RegExp(regexString, "gm")), (x) => x[1]);

    // Go through each line and check whether it qualifies for the toggle
    const matchedLines: EnvLine[] = [];
    const linesToCommentOut: EnvLine[] = [];

    envByLine.forEach((variable: string, idx: number) => {
      let line = variable.trim();

      // First check whether it is one of the variables, but in its uncommented out form:
      if (envVarsToToggle.some((envVar) => line.startsWith(envVar))) {
        // We could optimise here by removing this key from the envVarsToToggle Array?
        let [key, val] = line.split(/\=(.*)/);
        console.log(line, key, val, line.split("=", 1));
        
        linesToCommentOut.push({
          line: idx,
          lineInFile: idx + 1,
          envKey: key,
          envVal: val,
        });
        // if we have found a match here, it doesn't begin with ###.
        return;
      }

      // Check whether this line is a match to be un-commented out.
      let match = line.match(new RegExp(regexString));
      if (match) {
        matchedLines.push({
          line: idx,
          lineInFile: idx + 1,
          envKey: match[1],
          envVal: match[2],
        });
      }
    });

    console.log(chalk.green("Toggle On"));
    console.table(matchedLines, ["lineInFile", "envKey", "envVal"]);
    console.log(chalk.red("Toggle Out:"));
    console.table(linesToCommentOut, ["lineInFile", "envKey", "envVal"]);

    console.log("TODO: Write to file if -l was not passed here!");
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

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }
}

interface EnvLine {
  line: number;
  lineInFile: number;
  envKey: string;
  envVal: string;
}

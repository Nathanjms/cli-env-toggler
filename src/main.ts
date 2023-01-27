#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs/promises";
import { OptionValues, program } from "commander";
import figlet from "figlet";
import inquirer from "inquirer";

main();

async function main() {
  /* Global Constants */
  const version = "0.0.5";
  const currentDir = process.cwd();

  /* Nice header when init */
  console.log(figlet.textSync("CLI Env Toggler"));

  /* Program config using Commander.js */
  program
    .version(version)
    .description("Toggle between your most used environment variables by keying them.")
    .option(
      "-g, --group-name <value>",
      "The name of the group to toggle, keyed in the .env file like: '###-A' for group A."
    )
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
    .option("-y, --yes-to-all", "Skip the question asking you to confirm you are happy for the toggling to go ahead.")
    .showHelpAfterError("Add -h for help.")
    .parse();

  const options = program.opts();
  const listOnly = options.listOnly ?? false;
  const skipConfirmation = options.yesToAll ?? false;
  const pathToEnv = computePathToEnv(options);
  handle();

  /* Functions */

  async function handle() {
    const envFileContents = await getEnvFile();
    const groupName = await computeGroupName(envFileContents);

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

    outputTogglesToTerminal(matchedLines, linesToCommentOut);

    if (!listOnly) {
      let decision = skipConfirmation
        ? true
        : await inquirer.prompt({
            type: "confirm",
            default: "true",
            message: "Do you wish to proceed?",
            name: "decision",
          });

      if (decision) {
        matchedLines.forEach((l) => {
          envByLine[l.line] = envByLine[l.line].replace(new RegExp("^###-" + escapeRegExp(groupName) + "\\s*"), ""); // Why is a new space being added each time?
        });
        linesToCommentOut.forEach((l) => {
          envByLine[l.line] = "###-" + groupName + " " + envByLine[l.line];
        });
        await fs.writeFile(pathToEnv, envByLine.join("\n"));
        console.log(chalk.blueBright("Done!"));
      }
    }
  }

  async function computeGroupName(envFileContents: string) {
    if (options.groupName) {
      return options.groupName;
    }

    // Find all valid group names
    console.log("Attempting to find group names from env...");

    const groupNames: string[] = Array.from(envFileContents.matchAll(/^###-(\w*\d*)\s*/gm), (x) => x[1]);
    const choices: {
      name: string;
      value: string;
    }[] = [];

    // Format choices and also remove duplicates
    for (const name of groupNames) {
      if (!choices.some((c) => c.name == name)) {
        choices.push({
          name: name,
          value: name,
        });
      }
    }

    // Make unique and need to give it a name and val options

    if (groupNames.length === 0) {
      console.log(chalk.red("No Group Names could be found"));
      process.exit(1);
    }
    let choice = await inquirer.prompt({
      type: "list",
      choices: choices,
      name: "group",
      message: "Select a group",
    });
    return choice.group;
  }

  function outputTogglesToTerminal(matchedLines: EnvLine[], linesToCommentOut: EnvLine[]) {
    console.log(chalk.green("The following will be toggled On:"));
    console.table(matchedLines, ["lineInFile", "envKey", "envVal"]);
    console.log(chalk.red("The following will be toggled Off:"));
    console.table(linesToCommentOut, ["lineInFile", "envKey", "envVal"]);
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

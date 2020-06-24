const { prompt, Select } = require("enquirer");
const { readdirSync, existsSync } = require("fs");
const program = require("commander");
const { Wit, log } = require("node-wit");
const { exec } = require("child_process");
var recursive = require("recursive-readdir");
var colors = require("colors");

const client = new Wit({
  accessToken: "7Y5VDVGWWUMR6IML7XRYPEKQN37PHPSX",
});

let workspace_folder = null;
let workspace_projects = [];
let project_folder = null;

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const askWorkspaceFolder = async () => {
  const { user_ip_folder } = await prompt({
    type: "input",
    name: "user_ip_folder",
    message: "Please tell me path of your project folder",
  });
  if (existsSync(user_ip_folder)) {
    // Do something
    workspace_folder = user_ip_folder;
    workspace_projects = getDirectories(user_ip_folder);
    console.log("Selected Workspace!".green);
    if (workspace_projects.length > 0) {
      askProject();
    } else {
      console.log("Selected folder is empty, please reselect".red);
      askWorkspaceFolder();
    }
  } else {
    console.log("Folder doesn't exist".red);
    askWorkspaceFolder();
  }
};

const askProject = async () => {
  const prompt = new Select({
    name: "project",
    message: "Select your project",
    choices: workspace_projects,
  });

  prompt
    .run()
    .then((answer) => {
      console.log("Selected project!".green);
      project_folder = answer;
      rootFn();
    })
    .catch(console.error);
};

const closeProject = () => {
  project_folder = null;
  askProject();
};

const clearWorkspace = () => {
  workspace_folder = null;
  workspace_projects = [];
  askWorkspaceFolder();
};

const askUser = async () => {
  const { user_input } = await prompt({
    type: "input",
    name: "user_input",
    message: "How can I help you?",
  });
  if (!user_input) {
    askUser();
  } else {
    const { intents } = await client.message(user_input);
    if (intents.length > 0) {
      const intent = intents[0].name;
      switch (intent) {
        case "open":
          openProject();
          break;
        case "close":
          closeProject();
          break;
        case "clear_workspace":
          clearWorkspace();
          break;
        case "run":
          runProject();
          break;
        case "analyze":
          analyzeProject();
          break;
        case "bye":
          console.log("------".blue);
          console.log("Hope you liked me, See you again!!".rainbow);
          console.log("------".blue);
          break;
        default:
          console.log(
            " Sorry! I didn't get you. Can you please try something else??".red
          );
          askUser();
      }
    } else {
      console.log(
        " Sorry! I didn't get you. Can you please try something else??".red
      );
      askUser();
    }
  }
};

const rootFn = () => {
  if (!workspace_folder) {
    askWorkspaceFolder();
  } else if (!project_folder) {
    askProject(getDirectories(workspace_folder));
  } else {
    askUser();
  }
};

const openProject = () => {
  try {
    const path = `${workspace_folder}${project_folder}`;
    // TODO: add check for code command
    exec("code .", { cwd: path }, function (err, stdout, stderr) {
      console.log("Opening your project".green);
    });
  } catch (e) {
    console.error(e);
  }
  rootFn();
};

const runProject = () => {
  try {
    const path = `${workspace_folder}${project_folder}`;
    const package_path = `${path}/package.json`;
    if (existsSync(package_path)) {
      console.log("Detected node.js project, running 'npm start'".green);
      exec("npm run start", { cwd: path }, function (err, stdout, stderr) {
        console.log("in exec");
        console.log({ err });
        console.log({ stdout });
        console.log({ stderr });
      });
    } else {
      console.log(
        "Sorry, we're currently supporting NodeJS projects only with an 'npm start' script"
          .red
      );
    }
  } catch (e) {
    console.error(e);
  }
  rootFn();
};

const analyzeProject = () => {
  const path = `${workspace_folder}${project_folder}`;
  recursive(path, function (err, files) {
    if (!err) {
      const filtered_files = files.filter(
        (f) => !f.includes("/node_modules/") && !f.includes("/.git/")
      );
      total_files = filtered_files.length;
      if (total_files <= 0) {
        console.log("Project seems to be empty".red);
      } else {
        const analyze_arr = ["js", "jsx", "php", "rb"];
        const count_obj = {};
        filtered_files.forEach((file) => {
          extension = file.split(".").pop();
          item_index = analyze_arr.indexOf(extension);
          if (item_index >= 0) {
            const detected_extension = analyze_arr[item_index];
            if (!count_obj[detected_extension]) {
              count_obj[detected_extension] = 0;
            }
            count_obj[detected_extension] += 1;
          }
        });

        if (
          Object.keys(count_obj).length === 0 &&
          count_obj.constructor === Object
        ) {
          console.log("No familiar filetypes found".red);
        } else {
          console.log("Ok, Here is our analysis".grey);
          console.log("---Detected Files---".italic.blue);
          console.log(`A total of ${total_files} files detected`.green);
          let detected_file_percent = 0;
          Object.keys(count_obj).forEach((file_type) => {
            const percent = (
              (count_obj[file_type] / total_files) *
              100
            ).toFixed(2);
            console.log(`- ${file_type}: ${percent}%`.yellow);
            detected_file_percent += parseFloat(percent);
          });
          const remaining_file_percent = (100 - detected_file_percent).toFixed(
            2
          );
          if (remaining_file_percent > 0.01) {
            console.log(`- others: ${remaining_file_percent}%`.yellow);
          }
          console.log("------".blue);
        }
      }
    } else {
      console.error(err);
    }
  });
  rootFn();
};

rootFn();

program.parse(process.argv);

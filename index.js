const { prompt, Select } = require("enquirer");
const { readdirSync, existsSync } = require("fs");
const program = require("commander");

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
    if (workspace_projects.length > 0) {
      askProject();
    } else {
      console.log("Selected folder is empty, please reselect");
      askWorkspaceFolder();
    }
  } else {
    console.log("Folder doesn't exist");
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
      console.log("Answer:", answer);
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

  const intent = null;
  // TODO: Add with API call with 'user_input' and get intent
  const intent = user_input;

  switch (intent) {
    case "open":
      openProject();
      break;
    case "close_project":
      closeProject();
      break;
    case "clear_workspace":
      clearWorkspace();
      break;
    case "run":
      runProject();
      break;
    default:
      console.log(
        " Sorry! I didn't get you. Can you please try something else??"
      );
      askUser();
  }
};

const rootFn = async () => {
  if (!workspace_folder) {
    askWorkspaceFolder();
  } else if (!project_folder) {
    askProject(getDirectories(workspace_folder));
  } else {
    askUser();
  }

  // { username: 'jonschlinkert' }
};

const openProject = async () => {
  //   const response = await prompt({
  //     type: "input",
  //     name: "user_input",
  //     message: "How can I help you?",
  //   });
  console.log("your project is opening"); // { username: 'jonschlinkert' }
  rootFn();
};

const runProject = async () => {
  //   const response = await prompt({
  //     type: "input",
  //     name: "user_input",
  //     message: "How can I help you?",
  //   });
  console.log("your project is starting"); // { username: 'jonschlinkert' }
  rootFn();
};

rootFn();

program.parse(process.argv);

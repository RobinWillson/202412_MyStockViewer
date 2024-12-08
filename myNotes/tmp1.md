import fetch from 'node-fetch'; this line failed. 
it shows : Cannot use import statement outside a module
Here is the file 03_retrievePrice_V2

I have folder structure like this 
node_workSpace
├── node_module
│   ├── node-fetch
├── package.json
├── project 1
│   ├── git
│   ├── .gitignore
├── project 2
│   ├── git
│   ├── .gitignore
├── 202412_MyStockViewer
│   ├── git
│   ├── .gitignore
│   ├── frontEnd2
│   ├── BackEnd
│   │   ├── 03_retrievePrice_V2.js

I want to have a node_workSpace to handle many project.
Each project will share the same node_module resources.
And Each project has it's own git.
Thus I can sync necessary parts only and need no need to install too much node_module.




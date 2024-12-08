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
│   ├── app.js
│   ├── A01_StockPrice_test
│   ├── view
│   │   ├── index_v02.html

I want to have a node_workSpace to handle many project.
Each project will share the same node_module resources.
And Each project has it's own git.

now I'm under the folder 202412_MyStockViewer and execute app.js
PS C:\Node_Space\202412_MyStockViewer> node app.js
but the result comes __dirname=C:\Node_Space\
how to correct it as __dirname=C:\Node_Space\202412_MyStockViewer
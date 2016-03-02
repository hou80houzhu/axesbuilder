![BrightBuilder](https://github.com/hou80houzhu/brightbuilder/raw/master/brightbuilder.png) [![Build Status](https://travis-ci.org/hou80houzhu/brightbuilder.svg?branch=master)](https://travis-ci.org/hou80houzhu/brightbuilder)

[![NPM](https://nodei.co/npm/brightbuilder.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/brightbuilder/)

build the projects which run with the BrightJS web framework.

##What is BrightBuilder

BrightBuilder for building frontend program for frontend resources combined compression and version tracking

##How to use

**Step 1:**  install BrightBuilder

`npm install brightbuilder -g`

**Step 2:**

put `build.json` file under the packets folder of a project.

**Step 3:**

run the command to build 

`brightbuilder build projectpacketpath`

##build.json

###id

Construction of the project id to distinguish from each other, sometimes a project might construct multiple releases and updates distinction, it will be very important at this time id

###build

The project build number, users do not need attention, it is automatically incremented

###pathPrefix

May need before the packet is added to build the project basePath prefix (used in a specific user resolves dynamic pages)

###updatePage

After the build to edit pages

- type:
  - `1` Only update page
  - `2` Updates the page and back up the original page
- path:[]
  - `./` current directory
  - `../` parent directory
  - `*.php` filename characters
  - `*.*` filename characters

> Relative to the directory is the directory packet

###cssCompressWithout

Not to merge css package Name

###codeCompressWithout

Not to merge js package Name

###tmpCompressWithout

Not to merge template package Name


```
{
   "id": "OPEN",
   "build": "000050",
   "pathPrefix": "",
   "updatePage": {
      "type": 1,
      "path": [
         "./index.php",
         "../index.php",
         "../index.html",
         "../*.php",
         "../*.*"
      ]
   },
   "cssCompressWithout": [],//no compress and no merge.packet names
   "codeCompressWithout": [],//no compress and no merge.packet names
   "tmpCompressWithout": [],//no compress and no merge.packet names
   "jsNoCompress": [],//no compress.folder name
   "cssNoCompress": []//no compress.folder name
}
```

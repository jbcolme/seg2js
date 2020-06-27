# seg2js
Javascript reader of SEG 2 data

This works intents to be a library to read SEG 2 data.
The idea is to help develop tools in the web that read SEG 2 files. Since the data sets are sometimes pretty big, the scope is for the library to have a high performance.
Currently only the file header and traces header are read when loading the file. This will allow in the future to filter what traces the user wants to display, contrary to loading the whole file in memory which could be prohibitive.

This is a work in progress, which hopefully will be updated regularly.

Things in the pipeline:

* Documentation
* Plotting the data
* Examples
* Possible also writting or modifying the seg2 file, not just reading it.

Some of this is already being developed, but have to be organized before pushing it to github.

## Table of Contents

- [Installation](#installation)
- [How to use](#usage)

## Installation

    - [Download or clone]
    - [Copy]
    - [Include in html]

## Usage

    - [Simple case]
    - [HP]

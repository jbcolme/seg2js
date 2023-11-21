# seg2js
Javascript reader of SEG 2 data

![example of plotted SEG 2 data](https://github.com/jbcolme/seg2js/blob/master/images/banner.png?raw=true)

This works intents to be a library to read SEG 2 data.
The idea is to help develop tools in the web that read SEG 2 files. Since the data sets are sometimes pretty big, the scope is for the library to have a high performance.
Currently only the file header and traces header are read when loading the file. This will allow in the future to filter what traces the user wants to display, contrary to loading the whole file in memory which could be prohibitive.

## Table of Contents

- [Installation](#installation)
- [How to use](#usage)

## Installation

You should download or checkout this repository. If you just want to *use* the library, you only need to include the minified version which you can find in the root directory of the project: seg2js.min.js

If you want *develop* or debug the library, you can edit the source file located in the **src** directory: seg2js.src.js. You *must* generate the minified version so the function is properly packaged as a module.

To generate the minified file you can use rollup. You need to have node installed, then just do

    npm install
    rollup -c

## Usage

### Get the handle of a file and read headers

The first thing is to get a handle of a file. You can look at the example located in examples/example1.html. Then you should read the headers. For that you must first create a headers object
    
    let seg2headers = seg2js.createHeader();

after which you can read the readers using the method `readHeader` which returns a promise:

    seg2js.readHeader(file, seg2headers)
    .then(() => 
    {
        data = new Array(seg2headers.ntraces);
        promises = new Array(seg2headers.ntraces);
        for (var ii=0; ii<seg2headers.ntraces; ii++)
        {	
            data[ii] = new Array(seg2headers.trace[ii].nsamples);
            promises[ii] =  seg2js.readTraceData(file, seg2headers, ii, data[ii])
        }
        Promise.all(promises).then(() => {
            let data2plot = seg2js.buildArraysToPlot(seg2headers, data);
            plotData(data2plot);
        })
    })
 

 ## API

 The library exposes the following methods:

* createHeader()

    * returns:
        Header object.
        

* readHeader(file, header)
    * input:
        * file: file handle.
        * header 

The library exposes the following objects:

* fileHeader:

    {   
		ntraces: 0,
		offsets: [],
		versionNumber: 0,
		st: 0,
		lt: 0,
		size_st: 0,
		fileDescriptor: {},
		sizeTracePointer: 0,
		trace: []
	}

where:
- ntraces: Number of traces in the whole file.
- offsets: Array with the offset of each trace in bytes from the beggining of the file.
- versionNumber: The version number of the file.
- st: String termination character for the file descriptor.
- lt: Line termination character.
- fileDescriptor: Object (see below).
- sizeTracePointer: Size of the trace pointer.
- trace: Array of traces (see below).

'use strict';

var Seg2File = function() {
	
	let createHeader = function()
	{
		return {
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
	};
	
	
	let readHeader = function(file, header)
	{
		if (!file || !header) {
			console.log("wrong input");
			return;
		}
	
		header.ntraces = 0;
		header.offsets = [];
		header.versionNumber = 0;
		header.st = 0;
		header.lt = 0;
		header.size_st;
		header.fileDescriptor = {};
		header.sizeTracePointer = 0;
		header.trace = [];
	
		let traceObject = {
			nsamples: 0,
			dataFormat: 0,
			sizeof_tdb: 0,
			sizeof_db: 0,
			traceDescriptor: {}
		}
	
		let readFirstPart = function(resolve, reject)
		{
			let reader = new FileReader();
			let blob = file.slice(0, 16);
			reader.onload = function(e) 
			{
				var buffer = e.target.result;
				try
				{
					let dv = new DataView(buffer);
				
					let blockId = dv.getUint16(0,true);
					if (blockId.toString(16)!="3a55"){
						throw "Wrong format. Not a SEG-2 file."; }
					
					header.versionNumber = dv.getUint16(2,true);
					header.sizeTracePointer = dv.getUint16(4,true);
					
					header.ntraces = dv.getUint16(6,true);
					header.trace = new Array(header.ntraces).fill(traceObject);
	
					if (header.ntraces > header.sizeTracePointer/4)
						throw "The number of traces is too big for the trace pointer sub-block. The SEG-2 file has errors."
					if (header.ntraces < 1)
						throw "The number of traces cannot be less than or equal to zero. The SEG-2 file has errors."
					
					header.size_st =  dv.getUint8(8,true);
					if (header.size_st == 1)
						header.st = dv.getUint8(9,true);
					else
						header.st = dv.getUint16(9,true);
					
					let size_lt = dv.getUint8(11,true);
					if (size_lt == 1)
						header.lt = dv.getUint8(12,true);
					else
						header.lt = dv.getUint16(12,true);
	
					resolve();
				}
				catch(err)
				{
					 reject(err);
				}
			}
			reader.readAsArrayBuffer(blob);
		}	
	
		let readTracePointerSubblock = function(resolve, reject) 
		{
			let reader = new FileReader();
			let finalOffset = 32 + header.sizeTracePointer;
			let blob = file.slice(32, finalOffset);
			reader.onload = function(e) 
			{
				var buffer = e.target.result;
				let dv = new DataView(buffer);
				try 
				{
					header.offsets = new Uint32Array(header.ntraces,true);
					for (var ii=0; ii<header.ntraces; ii++)
						header.offsets[ii] = dv.getUint32(ii*4,true);
					resolve();
				}
				catch(err)
				{
					reject(err);
				}
			}
			reader.readAsArrayBuffer(blob);
		}
	
		let readFileDescritor = function(resolve, reject)
		{
			let reader = new FileReader();
			let offset2 = 32 + header.sizeTracePointer;
			let blob = file.slice(offset2, header.offsets[0]);
			
			let fileDescriptorParser = function(sentence)
			{
				var key = sentence.substr(0,sentence.indexOf(' '));
				if (key == "") return;
				var value = sentence.substr(sentence.indexOf(' ')+1);
				header.fileDescriptor[key] = value;
			}
	
			reader.onload = function(e) 
			{
				try
				{
					var buffer = e.target.result;
					let dv = new DataView(buffer);
					let nchars = header.offsets[0] - offset2;
					let wholeSentenceBits = [];
	
					let getTerminateChar = (header.size_st == 1) ? 
						(ii) => {return dv.getUint8(ii,true);} : (ii) => {return dv.getUint16(ii,true);};
	
					for (var ii=2; ii<nchars; ii++)
					{
						var termChar = getTerminateChar(ii);
						if (termChar == header.st)
						{
							var wholeSentence = String.fromCharCode.apply(null, wholeSentenceBits);
							fileDescriptorParser(wholeSentence);
							wholeSentenceBits = [];
							ii += 2;
						} else {
							wholeSentenceBits.push(dv.getUint8(ii,true));
						}
					}
	
					resolve();
				}
				catch(err)
				{
					reject(err);
				}
			}	
			reader.readAsArrayBuffer(blob);
		}
	
		let getTraceHeader = function(jj)
		{
			return new Promise((resolve, reject) =>
			{
				let reader = new FileReader();
				let blob = file.slice(header.offsets[jj], header.offsets[jj]+13);
				reader.onload = function(e)
				{
					let buffer = e.target.result;
					let dv = new DataView(buffer);
					try
					{
						let traceId =  dv.getUint16(0,true);
						if ( traceId.toString(16)!="4422"){
							throw "This is not a trace";}
						let sizeof_tdb =  dv.getUint16(2,true);
						let sizeof_db =  dv.getUint32(4,true);
						let nsamples =  dv.getUint32(8,true);
						let dataFormat =  dv.getUint8(12,true);
						if ( dataFormat == 3)
							throw "The data format of the trace is not recognized. It uses an old 20 bit format used in the SEG-D format."
						if ( dataFormat != 1 &&  dataFormat != 2 &&  dataFormat != 4 &&  dataFormat != 5)
							throw "The data format of the trace is not recognized"
						
						let reader2 = new FileReader();
						let blob2 = file.slice(header.offsets[jj] + 32, 
									header.offsets[jj] + 32 + sizeof_tdb);
						let traceDescriptor = {};
	
						reader2.onload = function(e)
						{
							let buffer2 = e.target.result;
							let dv2 = new DataView(buffer2);
	
							let getTerminateChar = (header.size_st == 1) ? 
								(ii) => {return dv2.getUint8(ii,true);} : (ii) => {return dv2.getUint16(ii,true);};
							
							let traceDescriptorParser = function(sentence)
							{
								var key = sentence.substr(0,sentence.indexOf(' '));
								if (key == "") return;
								var value = sentence.substr(sentence.indexOf(' ')+1);
								switch(key) {
									case "CDP_NUMBER":
									case "CDP_TRACE":
									case "CHANNEL_NUMBER":
									case "DELAY":
									case "DESCALING_FACTOR":
									case "END_OF_GROUP":
									case "FIXED_GAIN":
									case "LINE_ID":
									case "NOTCH_FREQUENCY":
									case "POLARITY":
									case "RECEIVER_STATION_NUMBER":
									case "SAMPLE_INTERVAL":
									case "SHOT_SEQUENCE_NUMBER":
									case "SKEW":
										value = Number(value);
										if (value == NaN) {
											status = false;
										}
										break;
									default:
										break;
									
								}
								traceDescriptor[key] = value;
							}
	
							let nchars =  sizeof_tdb - 32;
			 
							let wholeSentenceBits = [];
							for (var ii=2; ii<nchars; ii++)
							{
								var termChar = getTerminateChar(ii);
								if (termChar == header.st)
								{
									var wholeSentence = String.fromCharCode.apply(null, wholeSentenceBits);
									traceDescriptorParser(wholeSentence);
									wholeSentenceBits = [];
									ii += 2;
								} else {
									wholeSentenceBits.push(dv2.getUint8(ii,true));
								}
							}
	
							// console.log(traceDescriptor);
							resolve({
								nsamples : nsamples,
								dataFormat: dataFormat,
								sizeof_tdb: sizeof_tdb,
								sizeof_db: sizeof_db,
								traceDescriptor: traceDescriptor
							});
						}
						reader2.readAsArrayBuffer(blob2);
						
					}
					catch(err)
					{
						reject(err);
					}
				}
				reader.readAsArrayBuffer(blob);
			});
		}
	
		async function readTracesHeaders(resolve, reject)
		{
			for (var ii=0; ii<header.ntraces; ii++)
			{
				await getTraceHeader(ii).then(function(traceHeader) {
					header.trace[ii] = Object.assign({}, traceHeader);
				});
			}
	
			resolve();
		}
	
		return new Promise((resolve, reject) => 
		{
			readFirstPart(resolve, reject);
		}).then( () => {
			return new Promise((resolve, reject) => {
				readTracePointerSubblock(resolve, reject);
			});
		}).then( () => {
			return new Promise((resolve, reject) => {
				readFileDescritor(resolve, reject);
			});
		}).then( () => {
			return new Promise((resolve, reject) => {
				readTracesHeaders(resolve, reject);
			});
		}).then( () => {
			return;
		}).catch(error => {
			console.log(error);
			return(new Error(error));
		})
	};
	
	let readTraceData = function(file, header, traceId, data)
	{
		return new Promise((resolve, reject) => 
		{
			let reader = new FileReader();
			let offset1 = header.offsets[traceId] + header.trace[traceId].sizeof_tdb;
			let offset2 = offset1 + header.trace[traceId].sizeof_db;
			let blob = file.slice(offset1, offset2);
			
			reader.onload = function(e)
			{
				let buffer = e.target.result;
				let dv = new DataView(buffer);
				let nsamples = header.trace[traceId].nsamples;
				
				switch(header.trace[traceId].dataFormat)
				{
					case 1:
						for (var ii=0; ii< nsamples; ii++) {
							data[ii] = dv.getInt16(2*ii,true);
						}
						break;
					case 2:
						for (var ii=0; ii< nsamples; ii++) {
							data[ii] = dv.getInt32(4*ii,true);
						}
						break;
					case 4:
						for (var ii=0; ii< nsamples; ii++) {
							data[ii] = dv.getFloat32(4*ii,true);
						}
						break;
					case 5:
						for (var ii=0; ii< nsamples; ii++) {
							data[ii] = dv.getFloat64(8*ii,true);
						}
						break;
				}
				console.log(data[0])
				resolve();
			}
	
			reader.readAsArrayBuffer(blob);	
		});
	};
	
	let buildArraysToPlot = function(header, data)
	{
		if (!header || !data) {
			console.log("missing seg2file data");
			return;
		}
	
		if (header.ntraces != data.length){
			console.log("Dimensions of header and data do not match");
			return;
		}
	
		let result = new Array(header.ntraces);
		for (let nn = 0; nn < header.ntraces; nn++)
		{
			let ns = data[nn].length;
			let dt = header.trace[nn].traceDescriptor['SAMPLE_INTERVAL'];
			if (ns == 0 ) {
				console.log("trace " + nn + " is empty. Omitting it.")
				continue;
			}
	
			if (isNaN(dt)) {
				console.log("Sampling interval of trace " + nn + " is not a number");
				continue;
			}
			
			let maxamp = 0;
			for (var ii=0; ii<ns; ii++) {
				maxamp = (Math.abs(data[nn][ii]) > maxamp) ? Math.abs(data[nn][ii]) : maxamp;
			}
	
			maxamp = maxamp == 0 ? 1 : maxamp;
	
			let t = 0;
			result[nn] = {x : [], y : []};
			result[nn].x = new Array(ns);
			result[nn].y = new Array(ns);
			for (var ii=0; ii<ns; ii++)
			{
				result[nn].y[ii] = t;
				result[nn].x[ii] = data[nn][ii]/(2*maxamp) + nn;
				var temp = data[nn][ii];
				// console.log(temp, temp/(2*maxamp), temp/(2*maxamp)+nn);
				t += dt;
			}
		}
	
		return result;
	};
	
	let buildWiggleData = function(header)
	{
		if (!header || !data) {
			console.log("missing seg2file data");
			return;
		}
	
		if (header.ntraces != data.length){
			console.log("Dimensions of header and data do not match");
			return;
		}
	
		let plotStruct = [];
		for (let nn = 0; nn < header.ntraces; nn++)
		{
			let ns = seg2.traces[nn].data.length;
			let dt = seg2.traces[nn].traceDescriptor()['SAMPLE_INTERVAL'];
			if (ns == 0 ) {
				console.log("trace " + nn + " is empty. Omitting it.")
				continue;
			}
	
			if (isNaN(dt)) {
				console.log("Sampling interval of trace " + nn + " is not a number");
				continue;
			}
			
			let maxamp = 0;
			for (var ii=0; ii<ns; ii++) {
				maxamp = (Math.abs(seg2.traces[nn].data[ii]) > maxamp) ? Math.abs(seg2.traces[nn].data[ii]) : maxamp;
			}
	
			maxamp = maxamp == 0 ? 1 : maxamp;
	
			var ii = 0;
	
			let getSingleWiggle = function(input, output, cc) {
	
				if (cc > input.length) return output;
	
				var valueToPlot = input[cc]/(2*maxamp) + nn;
	
				if (output.length == 0) 
				{
					output.push(valueToPlot)
				}
				else
				{
					if (Math.sign(input[cc]) == Math.sign(input[cc-1])) {
						output.push(valueToPlot)
					}
					else {
						console.log(output);
						return output;
					}
				}
	
				cc++;
			
				return getSingleWiggle(input, output, cc);
			}
	
	
			do {
				var wiggle = [];
	
				wiggle = getSingleWiggle(seg2.traces[nn].data, wiggle, ii);
	
				var time = new Array(wiggle.length);
	
				for (var tt = 0; tt < wiggle.length; tt++) {
					time[tt] = (ii+tt)*dt;
				}
	
				ii += wiggle.length;
	
				if (wiggle.length == 1) {
					console.log("single point");
					continue;
				}
	
				if (wiggle[0] - nn > 0) {
					plotStruct.push({
						x: wiggle, 
						y: time, 
						fill: "toself",
						mode: "lines",
						fillcolor: 'black',
						line: {
							width: 2,
							color: 'black'}
					})
				} else {
					plotStruct.push({
						x: wiggle, 
						y: time,
						mode: "lines",
						line: {
							width: 2,
							color: 'black'}
					})
				}
	
			} while (ii < ns)
	
		}
					
		return plotStruct;
	};

	return {
		createHeader: createHeader,
		readHeader: readHeader,    
		readTraceData: readTraceData,
		buildArraysToPlot: buildArraysToPlot,
		buildWiggleData: buildWiggleData
	};
}


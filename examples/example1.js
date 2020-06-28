let plotData = function(data2plot)
{
    let plotStruct = [];
    for (var ii = 0; ii < data2plot.length; ii++)
    {
        plotStruct.push({
            x: data2plot[ii].x, 
            y: data2plot[ii].y, 
            fill: "toself", 
            line: {
                color: '#000000',
                width : 1
            }
        })
    }

    var layout = {
        title: 'Seg2 plot example',
        showlegend: false,
        yaxis: {autorange: "reversed"}}

    canvas = document.getElementById('seg2canvas');
    Plotly.newPlot( canvas, plotStruct, layout,  );
}

let readData = function(file)
{
    let seg2headers = seg2js.createHeader();
	let data = [];
    let promises = [];
    
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
}

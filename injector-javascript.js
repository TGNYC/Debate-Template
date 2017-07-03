var script = window.localStorage.debateTemplateScript;

//read in the script remotely if there is no local data or if the local data is over a day old
if(script === undefined || new Date().getTime() - parseInt(window.localStorage.debateTemplateDate) > 60*60*24) {
    read("https://docs.google.com/uc?export=open&id=0BxxolsFkwnDqZVpqTHZJR1J6dGM", function(result) {
        window.localStorage.debateTemplateScript = result;
        window.localStorage.debateTemplateDate = new Date().getTime() + "";
        console.log("Using server script");
        eval(result);
        load();
    });
}
else {
    console.log("Using local script");
    eval(script);
    load();
}

function read(url, callback){
    var rawFile = new XMLHttpRequest();
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                callback(rawFile.responseText);
            }
            //use the old version if a reaed fails
            else if(script !== undefined) {
                eval(script);
                load();
            }
        }
    }
    rawFile.open("GET", url, true);
    rawFile.send();
}


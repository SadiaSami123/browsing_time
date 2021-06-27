window.onload = load;
var toolbar;
var log_in_div;
var mark_div;
var unmark_div;
var uid;
var name;

function load() {
    toolbar = document.getElementById("Tool_Bar");
    log_in_div = document.getElementById("log_in");
    mark_div = document.getElementById("Mark_Site");
    unmark_div = document.getElementById("Unmark_Site");
    toolbar.style.display = "none";
    log_in_div.style.display = "none";
    mark_div.style.display = "none";
    unmark_div.style.display = "none";

    chrome.storage.sync.get(["uid", "name"], function (obj) {
        if(obj.uid === undefined)
        {
            toolbar.style.display = "none";
            log_in_div.style.display = "block";
            mark_div.style.display = "none";
            unmark_div.style.display = "none";
        }
        else
        {
            uid = obj.uid;
            name = obj.name;
            toolbar.style.display = "block";
            log_in_div.style.display ="none";
            chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

                // since only one tab should be active and in the current window at once
                // the return variable should only have one entry
                var activeTab = arrayOfTabs[0];
                //var activeTabId = activeTab.url; // or do whatever you need

                //check from storage if it's marked or not
                /*var isMarked = false;
                if(isMarked) {
                    mark_div.style.display= "none";
                    unmark_div.style.display ="block";
                }
                else {
                    mark_div.style.display= "block";
                    unmark_div.style.display ="none";
                }*/
                var a = document.createElement('a');
                a.href = activeTab.url;// or do whatever you need
                var tmp ={
                    type :"is_marked",
                    site :a.hostname
                };
                chrome.runtime.sendMessage(tmp, function(response) {
                    //alert(response);
                    if(response === "true")
                    {
                        mark_div.style.display= "none";
                        unmark_div.style.display ="block";
                    }
                    else
                    {
                        mark_div.style.display= "block";
                        unmark_div.style.display ="none";
                    }
                });
            });
        }
    });

    document.getElementById("Log_in_button").onclick = log_in;
    document.getElementById("mark_site_button").onclick = mark_site;
    document.getElementById("unmark_site_button").onclick = unmark_site;
    document.getElementById("home").onclick = home;
    document.getElementById("stat").onclick = stat;
    document.getElementById("LogOut").onclick = log_out;
}
function log_in() {
    chrome.tabs.create({}, function (response) {

    });
    return false;
}
function mark_site() {
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = arrayOfTabs[0];
        //var activeTabId = activeTab.url; // or do whatever you need
        /*var tmp = {
            link : activeTabId,
            type : "mark_site"
        };*/
        var a = document.createElement('a');
        a.href = activeTab.url;
        mark_site_in_background(uid, a.hostname);
        //chrome.runtime.sendMessage(tmp);

    });

    toolbar.style.display = "block";
    log_in_div.style.display = "none";
    mark_div.style.display = "none";
    unmark_div.style.display = "block";
    return false;
}
function unmark_site() {
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = arrayOfTabs[0];
        //var activeTabId = activeTab.url; // or do whatever you need
        /*var tmp = {
            url : activeTabId,
            type : "un_mark_site"
        };
        chrome.runtime.sendMessage(tmp);*/
        var a = document.createElement('a');
        a.href = activeTab.url;
        unmark_site_in_background(uid, a.hostname);

    });
    toolbar.style.display = "block";
    log_in_div.style.display = "none";
    mark_div.style.display = "block";
    unmark_div.style.display = "none";
    return false;
}
function log_out() {
    firebase.auth().signOut()
        .then(function () {
            chrome.storage.sync.remove(["uid", "name", "marked_sites"]);
        })
        .catch(function (error) {
            alert(error.message);
        });
    toolbar.style.display="none";
    log_in_div.style.display = "block";
    mark_div.style.display= "none";
    unmark_div.style.display ="none";
    return false;
}
function home() {
    chrome.tabs.create({}, function (response) {

    });
    return false;
}
function stat() {
    chrome.tabs.create({url:chrome.extension.getURL("stat.html")}, function (response) {

    });
    return false;
}


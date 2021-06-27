var favourite_links = [];
var lastTab;
var lasturl;
var start_time;
var end_time;
var timers = {};
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
var day = date.getDate();
if(month < 10) month = "0" + month;
if(day < 10) day = "0" + day;
var date_today = year + "-" + month + "-" + day;
var last_task = "";
var marked_sites = {};
var myNotificationId;
var threshold = 01*30;
var timeTillMidnight = (1440-(date.getHours()*60+date.getMinutes()))*60*1000;
var suggest_link;

setTimeout(update_date,timeTillMidnight);
function showTaskNotification(task) {
    var options = {
        type : "basic",
        title : "You have a task to complete",
        message : task,
        buttons : [{
            title: "Snooze for 5 minutes"
        }],
        iconUrl : "icon.png"
    };
    chrome.notifications.create(options, notificationCallback);
    last_task = task;
}

//setTimeout(showTaskNotification,2000,"holaaaa");

function notificationCallback(id) {
    myNotificationId = id;
}

chrome.notifications.onButtonClicked.addListener(function(Id, btnIdx) {
    if (Id === myNotificationId) {
        if (btnIdx === 0) {
            timers[last_task] = setTimeout(showTaskNotification, 2000, last_task);
        }
    }
    else
    {
        chrome.tabs.create({url:suggest_link}, function (response) {

        });
    }
});

function getMinutes(str)
{
    str = str.split(":");
    return (Number(str[0])*60 + Number(str[1]));
}

chrome.storage.sync.get(["uid", "name"], function (obj) {
    if(obj.uid === undefined)
    {

    }
    else
    {
        get_to_do(obj.uid, date_today);
        //console.log(timers);
        chrome.storage.sync.get("marked_sites", function (obj) {
            if(obj.marked_sites === undefined)
            {
                //alert("no_data");
            }
            else
            {
                marked_sites = obj.marked_sites;
                //console.log(marked_sites);
                setTimeout(upload_marked_sites_in_storage, 5000);
                //delete marked_sites["www.facebook.com"];
                //chrome.storage.sync.set({"marked_sites":marked_sites});
                //console.log(marked_sites);
            }
            update_per_day_stat();
        });
    }
});

function get_to_do(uid, date) {
    var senderToServer = new XMLHttpRequest();
    senderToServer.open("POST", 'http://localhost:3000/', true);
    var getToDoReq = {
        uid : uid,
        date : date,
        type : "get_to_do"
    };
    senderToServer.onreadystatechange = function () {
        if(senderToServer.readyState === 4 && senderToServer.status === 200) {
            timers = {};
            var date = new Date();
            var currentTime = date.getHours()*60 + date.getMinutes();
            var event_list_server = JSON.parse(senderToServer.responseText);
            var list_size = event_list_server.length;
            console.log(event_list_server);
            for(var i = 0; i < list_size; ++i) {
                if(!event_list_server[i].done && getMinutes(event_list_server[i].military_time) > currentTime)
                {
                    //alert("a task");
                    var diff = getMinutes(event_list_server[i].military_time) - currentTime;
                    timers[event_list_server[i].task] =
                        setTimeout(showTaskNotification, diff*1000*60, event_list_server[i].task);
                }
                //var task = event_list_server[i].task;
                //var normal_time = event_list_server[i].normal_time;
                //var military_time = event_list_server[i].military_time;
            }

        }
        else {
            //to be implemented
            //storage
        }
    };
    senderToServer.setRequestHeader("Content-Type", "application/json");
    senderToServer.send(JSON.stringify(getToDoReq));
}

function compareTime(str1, str2){

    if(str1 === str2){
        return 0;
    }

    var time1 = str1.split(':');
    var time2 = str2.split(':');

    for (var i = 0; i < time1.length; i++) {
        if(time1[i] > time2[i]){
            return 1;
        } else if(time1[i] < time2[i]) {
            return -1;
        }
    }
}

chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = arrayOfTabs[0];
    lastTab = activeTab.id;
    var a = document.createElement('a');
    a.href = activeTab.url;// or do whatever you need
    lasturl = a.hostname;
    start_time = performance.now();
});


chrome.windows.onRemoved.addListener(window_close_handler);
chrome.tabs.onUpdated.addListener(start_tab);
chrome.tabs.onRemoved.addListener(close_tab);
chrome.tabs.onActivated.addListener(activateHandler);

function start_tab(tabId, changeInfo, tab) {
    end_time = performance.now();
    var b = document.createElement('a');
    b.href = tab.url;// or do whatever you need
    var currUrl = b.hostname;
    var total_time = (end_time-start_time)/1000;
    total_time = round(total_time, 2);
    var tasks, k, options;
    if(tabId !== lastTab)
    {
        lastTab = tabId;
        console.log(lastTab);
        console.log(lasturl);
        console.log(total_time);
        if(marked_sites[lasturl] !== undefined)
        {
            marked_sites[lasturl] += total_time;
            tasks = [];
            for (k in timers){
                tasks.push({title:"Task To Do:", message:k});
            }

            if(tasks[0]===undefined && marked_sites[lasturl] >= threshold)
            {
                var url = "";
                url += lasturl;
                chrome.storage.sync.get(["uid", "name"], function (obj) {
                    if(obj.uid === undefined)
                    {

                    }
                    else{
                        get_fav_link_from_server_background(obj.uid,url);
                    }
                });
                update_per_day_stat();
            }

            else if(marked_sites[lasturl] >= threshold)
            {
                var url = "";
                url += lasturl;
                options = {
                    type : "list",
                    title : "You are using " + url + " too long",
                    message : "You are using " + url + " too long",
                    iconUrl : "icon.png",
                    items: tasks
                };
                chrome.notifications.create(options);
                update_per_day_stat();
            }
        }
        lasturl = currUrl;
        start_time = end_time;
    }
    else if(lasturl !== currUrl)
    {
        console.log(lastTab);
        console.log(lasturl);
        console.log(total_time);
        if(marked_sites[lasturl] !== undefined)
        {
            marked_sites[lasturl] += total_time;
            tasks = [];
            for (k in timers){
                tasks.push({title:"Task To Do:", message:k});
            }
            if(tasks[0] === undefined && marked_sites[lasturl] >= threshold)
            {
                var url = "";
                url += lasturl;
                chrome.storage.sync.get(["uid", "name"], function (obj) {
                    if(obj.uid === undefined)
                    {

                    }
                    else{
                        get_fav_link_from_server_background(obj.uid,url);
                    }
                });
                update_per_day_stat();
            }

            else if(marked_sites[lasturl] >= threshold)
            {
                var url = "";
                url += lasturl;
                options = {
                    type : "list",
                    title : "You are using " + url + " too long",
                    message : "You are using " + url + " too long",
                    iconUrl : "icon.png",
                    items: tasks
                };
                chrome.notifications.create(options);
                update_per_day_stat();
            }
        }
        lasturl = currUrl;
        start_time = end_time;
    }
    else if(lasturl === currUrl)
    {
        if(total_time>=10)
        {
            if(marked_sites[lasturl]!== undefined)
            {
                marked_sites[lasturl] += total_time;
                tasks = [];
                for (k in timers){
                    tasks.push({title:"Task To Do:", message:k});
                }

                if(tasks[0]===undefined && marked_sites[lasturl] >= threshold)
                {
                    var url = "";
                    url += lasturl;
                    chrome.storage.sync.get(["uid", "name"], function (obj) {
                        if(obj.uid === undefined)
                        {

                        }
                        else{
                            get_fav_link_from_server_background(obj.uid,url);
                        }
                    });
                    update_per_day_stat();
                }

                else if(marked_sites[lasturl] >= threshold)
                {
                    var url = "";
                    url += lasturl;
                    options = {
                        type : "list",
                        title : "You are using " + url + " too long",
                        message : "You are using " + url + " too long",
                        iconUrl : "icon.png",
                        items: tasks
                    };
                    chrome.notifications.create(options);
                    update_per_day_stat();
                }
            }
            lasturl = currUrl;
            start_time = end_time;
        }
    }
    //start_time = performance.now();
}

function close_tab(tabId , removeInfo) {

    /*chrome.tabs.query({windowType:"normal"}, function(tabs) {
            if(tabs.length===1)
            {
                end_time = performance.now();
                var total_time = (end_time-start_time)/1000;
                total_time = round(total_time,2);
                console.log(lastTab);
                console.log(lasturl);
                console.log(total_time);
            }
    });*/
    //end_time = performance.now();
    //console.log("Call to doSomething took " + (end_time - start_time) + " milliseconds.")
}

function activateHandler(activeInfo) {
    if(activeInfo.tabId !== lastTab)
    {
        end_time = performance.now();
        var total_time = (end_time-start_time)/1000;
        total_time = round(total_time,2);
        console.log(lastTab);
        console.log(lasturl);
        console.log(total_time);
        var url = "";
        url += lasturl;
        if(marked_sites[lasturl] !== undefined)
        {
            marked_sites[lasturl] += total_time;
            var tasks = [];
            for (var k in timers){
                tasks.push({title:"Task To Do:", message:k});
            }
            if(tasks[0] === undefined && marked_sites[lasturl] >= threshold)
            {
                chrome.storage.sync.get(["uid", "name"], function (obj) {
                    if(obj.uid === undefined)
                    {

                    }
                    else{
                        get_fav_link_from_server_background(obj.uid,url);
                    }
                });
                update_per_day_stat();
            }

            else if(marked_sites[lasturl] >= threshold)
            {
                var options = {
                    type : "list",
                    title : "You are using " + url + " too long",
                    message : "You are using " + url + " too long",
                    iconUrl : "icon.png",
                    items: tasks
                };
                chrome.notifications.create(options);
                update_per_day_stat();
            }
        }
        lastTab = activeInfo.tabId;
        start_time = end_time;
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            var activeTab = arrayOfTabs[0];
            var a = document.createElement('a');
            a.href = activeTab.url;// or do whatever you need
            lasturl = a.hostname;
        });
    }
}

function window_close_handler() {
    end_time = performance.now();
    var total_time = (end_time-start_time)/1000;
    start_time = end_time;
    total_time = round(total_time,2);
    console.log(lastTab);
    console.log(lasturl);
    console.log(total_time);
    if(marked_sites[lasturl]!== undefined)
    {
        marked_sites[lasturl] += total_time;
        var tasks = [];
        for (var k in timers){
            tasks.push({title:"Task To Do:",message:k});
        }
        var url;
        if(tasks[0] === undefined && marked_sites[lasturl] >= threshold)
        {
            url = "";
            url += lasturl;
            chrome.storage.sync.get(["uid", "name"], function (obj) {
                if(obj.uid === undefined)
                {

                }
                else{
                    get_fav_link_from_server_background(obj.uid,url);
                }
            });
            update_per_day_stat();
        }

        else if(marked_sites[lasturl] >= threshold)
        {
            url = "";
            url += lasturl;
            var options = {
                type : "list",
                title : "You are using " + url + " too long",
                message : "You are using " + url + " too long",
                iconUrl : "icon.png",
                items: tasks
            };
            chrome.notifications.create(options);
            update_per_day_stat();
        }
    }
}


chrome.windows.onFocusChanged.addListener(function(windowId) {
    if (windowId === -1) {
        window_close_handler();
        console.log("out of focus");
    } else {
        chrome.windows.get(windowId, function(chromeWindow) {
            if (chromeWindow.state === "minimized") {
                //window_close_handler();
                console.log("minimized");
            } else {
                chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    console.log("maximized");
                    // since only one tab should be active and in the current window at once
                    // the return variable should only have one entry
                    var activeTab = arrayOfTabs[0];
                    lastTab = activeTab.id;
                    var a = document.createElement('a');
                    a.href = activeTab.url;// or do whatever you need
                    lasturl = a.hostname;
                    start_time = performance.now();
                });
                // Window is not minimized (maximized, fullscreen or normal)
            }
        });
    }
});

function round(value, decimals) {
    return Number(Math.round(Number(value+'e'+decimals)) + 'e-' + decimals);
}


chrome.contextMenus.create({
    "title": "Add this link to your Favourite Links",
    "contexts": ["link"],
    "onclick" : fav_link
});

chrome.contextMenus.create({
    "title": "Add this page to your Favourite Links",
    "contexts": ["page"],
    "onclick" : fav_page
});


function fav_link(data) {
    const index = favourite_links.indexOf(data.linkUrl);
    if (index === -1) {
        favourite_links.push(data.linkUrl);
        var uid;
        chrome.storage.sync.get("uid", function (obj) {
            if(obj.uid === undefined) {
                //do nothing
            }
            else {
                uid = obj.uid;
                add_fav_link_in_server(uid, data.linkUrl);
            }
        });
    }
    console.log(favourite_links);
}


function fav_page(data, tab) {
    const index = favourite_links.indexOf(tab.url);
    if (index === -1) {
        favourite_links.push(tab.url);
        var uid;
        chrome.storage.sync.get("uid", function (obj) {
            if(obj.uid === undefined) {
                //do nothing
            }
            else {
                uid = obj.uid;
                add_fav_link_in_server(uid, tab.url);
            }
        });
    }
    console.log(favourite_links);
}

chrome.runtime.onMessage.addListener(function (req, sender, res) {
    var date, currentTime, task_time;
    if(req.type === "open_new_tab") {
        //open new tab of the link in req.link
        //alert(req.link);
        chrome.tabs.create({url:req.link}, function (response) {

        });
    }
    else if(req.type === "add_Timer")
    {
        date = new Date();
        currentTime = date.getHours()*60 + date.getMinutes();
        task_time = getMinutes(req.time);
        if(task_time > currentTime)
        {
            timers[req.task] = setTimeout(showTaskNotification, (task_time - currentTime)*60*1000, req.task);
        }
        else
        {
            //alert("time passed");
        }
    }
    else if(req.type === "delete_Timer")
    {
        if(timers[req.task] !== undefined)
        {
            clearTimeout(timers[req.task]);
            delete timers[req.task];
            //alert("timer deleted");
        }
    }

    else if(req.type === "change_Timer")
    {
        if(timers[req.task]!== undefined)
        {
            clearTimeout(timers[req.task]);
            delete timers[req.task];
            //alert("timer deleted");
        }
        else
        {
            date = new Date();
            currentTime = date.getHours()*60 + date.getMinutes();
            task_time = getMinutes(req.time);
            if(task_time>currentTime)
            {
                timers[req.task] = setTimeout(showTaskNotification,(task_time-currentTime)*60*1000,req.task);
                //alert("set");
            }
            else
            {
                //alert("time passed");
            }
        }
    }

    else if(req.type === "start_timer")
    {
        get_to_do(req.uid,date_today);
        chrome.storage.sync.get("marked_sites", function (obj) {
            if(obj.marked_sites === undefined)
            {
                //alert("no_data");
            }
            else
            {
                marked_sites = obj.marked_sites;
                console.log(marked_sites);
                setTimeout(upload_marked_sites_in_storage, 5000);
            }
        });
    }

    else if(req.type === "delete_all_timers")
    {
        for (var k in timers){
            clearTimeout(timers[k]);
            delete timers[k];
        }
        update_per_day_stat();
    }
    else if(req.type ==="is_marked")
    {
        if(marked_sites[req.site] !== undefined)
        {
            //alert(marked_sites[req.site]);
            res("true");
        }
        else
        {
            //alert("false");
            res("false");
        }
    }
    else if(req.type === "mark_site")
    {
        marked_sites[req.site] = 0;
        chrome.storage.sync.set({"marked_sites" : marked_sites});
        console.log(marked_sites);
        mark_site_in_server(req.uid, req.site);
    }
    else if(req.type === "unmark_site")
    {
        //alert(req.site);
        //alert(marked_sites[req.site]);
        if(marked_sites[req.site] !== undefined)
        {
            delete marked_sites[req.site];
            chrome.storage.sync.set({"marked_sites" : marked_sites});
            console.log(marked_sites);
            unmark_site_in_server(req.uid, req.site);
        }
    }

    else if(req.type === "update_marked_sites_object")
    {
        chrome.storage.sync.get("marked_sites", function (obj) {
            marked_sites = obj.marked_sites;
        });
    }
});

function upload_marked_sites_in_storage() {
    chrome.storage.sync.get(["uid", "name"], function (obj) {
        if(obj.uid === undefined)
        {

        }
        else{
            chrome.storage.sync.set({"marked_sites":marked_sites});
            //alert("updated");
            setTimeout(upload_marked_sites_in_storage, 5000);
        }
    });
}

function update_per_day_stat() {
    chrome.storage.sync.get(["per_day_stat","date"], function (obj) {
        if(obj.date === undefined)
        {
            obj.date = date_today;
        }
        if(obj.per_day_stat === undefined)
        {
            var object = {};
            for (var k in marked_sites){

                object[k] = marked_sites[k];
            }
            obj.per_day_stat = object;
        }
        else
        {
            for (var k in marked_sites){
                if(obj.per_day_stat[k]===undefined)
                {
                    obj.per_day_stat[k] = marked_sites[k];
                }
                else
                {
                    obj.per_day_stat[k] += marked_sites[k];
                }
            }
            console.log(obj.per_day_stat);
            //console.log(marked_sites);
        }
        for (var k in marked_sites){
            marked_sites[k] = 0;
        }
        if(date_today !== obj.date)
        {
            chrome.storage.sync.get(["uid", "name"], function (object) {
                if(object.uid === undefined)
                {

                }
                else
                {
                    console.log(obj.per_day_stat);
                    for (var k in obj.per_day_stat){
                        //console.log(k +"  "+  obj.per_day_stat[k])
                        update_site_time_in_server(object.uid, k , obj.per_day_stat[k]/60.0);
                        obj.per_day_stat[k] = 0;
                    }
                    chrome.storage.sync.set({"per_day_stat":obj.per_day_stat});
                    //alert("done");

                }
            });

            //update in database obj.per_day_stat
            obj.date = date_today;
        }
        chrome.storage.sync.set({"date":obj.date});
        chrome.storage.sync.set({"per_day_stat":obj.per_day_stat});
        chrome.storage.sync.set({"marked_sites":marked_sites});
    });
}

function update_date() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    if(month < 10) month = "0" + month;
    if(day < 10) day = "0" + day;
    date_today = year + "-" + month + "-" + day;
    update_per_day_stat();
    setTimeout(1440*60);
}
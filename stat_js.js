window.onload = load;
var marked_sites = [];
var marked_sites_complete = [];
var sites_for_bar_chart = [];
var site_times_in_min =[];
var daily_time = [];
var weekly_time = [];
var monthly_time = [];
var total_time = 0;
var lastSeenIndex = -1;
var curSite;
var currently_visible_bars = 0;

var total_monthly_time = 0;

var uid;

function showBackground(url) {
    var element = document.getElementById("stat_page");
    if(url === "none") element.style.backgroundImage = "none";
    else element.style.backgroundImage = "url(" + url + ")";
    element.style.backgroundSize = "cover";
    document.getElementById("loading").style.display = "none";
}


function load() {
    chrome.storage.sync.get(["uid", "name"], function (obj) {
        if (obj.uid === undefined) {

        }
        else {
            uid = obj.uid;
            get_marked_sites(obj.uid);
        }
    });
    prev_next_button_controller();
    nextButtonClickListener();
    document.getElementById("site_usage").style.display = "none";
    document.getElementById("mark_sites_ul").addEventListener('click',marked_site_onclick_handler, false);
    document.getElementById("mark_sites_ul").style.display = "none";
    document.getElementById("show_hide").onclick = toggle_visibility_sites;
    document.getElementById("next_button").onclick = nextButtonClickListener;
    document.getElementById("prev_button").onclick = prevButtonClickListener;
    document.getElementById("site_name").onclick = go_to_site;

    chrome.storage.sync.get(["image_url","color"], function (item) {
        getBackgroundDownloadURL(uid, showBackground);
        if(item.color === undefined)
        {
            chrome.storage.sync.set({"color" : "white"});
        }
        else
        {
            var body = document.getElementById("stat_page");
            body.style.color = item.color;
        }
    });

}

function newSite()
{
    var li = document.createElement("li");
    var inputValue = curSite;
    var t = document.createTextNode(inputValue);
    li.appendChild(t);
    if (inputValue === '') {
        alert("You must write something!");
    } else {
        document.getElementById("mark_sites_ul").appendChild(li);
    }

    var span = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    li.appendChild(span);
}

function populateMarkedSites() {
    var ul=document.getElementById("mark_sites_ul");
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    var i;
    for (i = 0; i < marked_sites.length; i++)
    {
        curSite = marked_sites[i];
        newSite();
    }

    var close = document.getElementsByClassName("close");
    for (i = 0; i < close.length; i++)
    {
        close[i].onclick = function() {
            var div = this.parentElement;
            unmark_site_in_background_from_stat(uid,div.textContent.substring(0, div.textContent.length - 1));
        }
    }
    //var list = document.querySelector('ul');

}


function marked_site_onclick_handler(ev) {
    // noinspection JSUnresolvedVariable
    if (ev.target.tagName === 'LI') {
        var div = ev.target;
        var site = div.textContent.substring(0, div.textContent.length - 1);
        var index = sites_for_bar_chart.indexOf(site);
        if(index !== -1)
        {
            document.getElementById("site_usage").style.display = "block";
            document.getElementById("site_name").innerText = site;
            document.getElementById("daily_usage").innerText = min_to_hour(daily_time[index]);
            document.getElementById("weekly_usage").innerText = min_to_hour(weekly_time[index]);
            document.getElementById("monthly_usage").innerText = min_to_hour(monthly_time[index]);
        }
    }
}
/*function get_marked_sites_stat(uid) {
    var senderToServer = new XMLHttpRequest();
    senderToServer.open("POST", 'http://localhost:3000/', true);
    var get_marked_sites_req = {
        uid : uid,
        type : "get_marked_sites"
    };
    senderToServer.onreadystatechange = function () {
        if(senderToServer.readyState === 4 && senderToServer.status === 200) {
            //console.log(senderToServer.responseText);
            var site_list = JSON.parse(senderToServer.responseText);
            for(var i = 0; i < site_list.length; ++i) {
                marked_sites[i] = site_list[i].site;
            }

            populateMarkedSites();
        }
    };
    senderToServer.setRequestHeader("Content-Type", "application/json");
    senderToServer.send(JSON.stringify(get_marked_sites_req));
}*/

function toggle_visibility_sites() {

    var e = document.getElementById("mark_sites_ul");
    if(e.style.display === 'none')
        e.style.display = 'block';
    else {
        document.getElementById("site_usage").style.display = "none";
        e.style.display = 'none';
    }
    return false;
}

function round(value, decimals) {
    return Number(Math.round(Number(value+'e'+decimals)) + 'e-' + decimals);
}

function min_to_hour(mins) {
    var h = Math.floor(mins / 60);
    var m = round((mins % 60),2);
    h = h === 0 ? "" : h.toString() + " Hour(s) ";
    m = m < 10 ? "0" + m.toString() +" Minute(s)" : m.toString() + " Minute(s)";
    return h+m ;
}

function populate_bar_chart(bar_title_array, bar_value_array, total_min) {

    var bars = document.getElementsByClassName("progress-fill");
    var bars_container = document.getElementsByClassName("progress-bar horizontal");
    var labels =document.getElementsByClassName("bar_chart_inside_text");
    var length = bar_title_array.length;

    for(var i = 0; i<length && i<5; i++)
    {
        var percent = (bar_value_array[i]*100.0) / total_min;
        var round_up_value = round(percent,2);
        percent = percent.toString() + "%";
        var text = bar_title_array[i] + " :: " + min_to_hour(bar_value_array[i]);
        bars[i].style.width = percent;
        bars_container[i].style.display = "block";
        labels[i].innerText = text;
        bars[i].innerText =  round_up_value.toString() +"%";
    }

    prev_next_button_controller();

    for(;i<5;i++)
    {
        bars_container[i].style.display = "none";
    }
}


function prevButtonClickListener() {
    var tempTitle = [];
    var tempTime = [];
    var count = 0;

    lastSeenIndex -= currently_visible_bars;
    for(var i = lastSeenIndex ; i>=0 ; i--)
    {
        if(count === 5) break;
        tempTitle[count] = sites_for_bar_chart[i];
        tempTime[count] = site_times_in_min[i];
        count++;
    }
    currently_visible_bars = count;

    tempTitle.reverse();
    tempTime.reverse();

    populate_bar_chart(tempTitle,tempTime,total_time);

    return false;
}

function nextButtonClickListener() {
    var tempTitle = [];
    var tempTime = [];
    var count = 0;
    for(var i = lastSeenIndex + 1; i<sites_for_bar_chart.length ; i++)
    {
        if(count === 5) break;
        tempTitle[count] = sites_for_bar_chart[i];
        tempTime[count] = site_times_in_min[i];
        count++;
    }
    console.log(site_times_in_min);
    lastSeenIndex += count;
    currently_visible_bars = count;
    populate_bar_chart(tempTitle,tempTime,total_time);

    return false;
}

function prev_next_button_controller() {
    var next = document.getElementById("next_button");
    var prev = document.getElementById("prev_button");
    next.style.display = "none";
    prev.style.display = "none";
    if(lastSeenIndex > 4)
    {
        prev.style.display = "block";
    }
    if(lastSeenIndex >=0 && lastSeenIndex < sites_for_bar_chart.length-1)
    {
        next.style.display = "block";
    }
}

function go_to_site() {
    var site ="http://" + document.getElementById("site_name").innerText;
    var tmp = {
        link : site,
        type : "open_new_tab"
    };
    chrome.runtime.sendMessage(tmp);
}

function populate_fields(complete_list) {
    console.log(complete_list);
    for(var i =0 ;i<complete_list.length; i++)
    {
        marked_sites[i] = complete_list[i].site;
        sites_for_bar_chart[i] = complete_list[i].site;
        monthly_time[i] = complete_list[i].monthly_time;
        site_times_in_min[i] = complete_list[i].monthly_time*complete_list[i].num_of_months
                            +complete_list[i].total_time_this_month;
        daily_time[i] = complete_list[i].daily_time;
        weekly_time[i] = complete_list[i].weekly_time;
        if(total_monthly_time === 0) total_time = 1;
        else total_time = total_monthly_time;
    }
    console.log(site_times_in_min);
    nextButtonClickListener();
    populateMarkedSites();
}
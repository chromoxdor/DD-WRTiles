var firstRun = 1;
//var wasUsed;
//var slA; //sliderAmount
var columnSet;
var fDD; //fetchDD interval
var gURL;
var bInput; //getURL interval
var navOpen;
var myParam;
var hasParams = 1;
var dataT = [];
var dataT2 = [];
var isittime = 1;
var currVal;
var html;
var tsX = 0; //startx
var teX = 0; //endx
var tsY = 0;
var teY = 0;
var msTs = 0; //start time
var msTe = 0;
var manNav;
var gesVal;
var isOpen = 0;
var result;
var prevX = 0;
var routerIP;
var nTH = 0;
var sortMode;


async function fetchDD(event) {
    if (!document.cookie.includes("IP=")) { mC("IP"); mC("Adapter") }
    if (!document.cookie.includes("Offline=")) { mC("Offline") }
    //invert color scheme----------
    try {
        for (Array of document.styleSheets) {
            for (e of Array.cssRules) {
                if (e.conditionText?.includes("prefers-color-scheme")) {
                    if (document.cookie.includes("Col=1")) { e.media.mediaText = "(prefers-color-scheme: light)" }
                    else { e.media.mediaText = "(prefers-color-scheme: dark)" }
                };
            }
        }
    }
    catch (err) {
        console.log(err);
    }

    //-----DDTextToJSON-----------------------------------------------------------------
    const DDTextToJSON = (data, delimiter = ',') => {
        const titles = data.slice(0, data.indexOf(';') - 1).split(delimiter);
        return data
            .slice(data.indexOf(';') + 2)
            .split(',;,')
            .map(v => {
                const values = v.split(delimiter);
                return titles.reduce(
                    (obj, title, index) => ((obj[title] = values[index]), obj),
                    {}
                );
            });
    };

    //------LanArray----------------------------------------------------------------
    if (nTH == 0) {
        let response = await fetch('/Status_Lan.live.asp', {
            method: 'GET', credentials: 'include'
        });
        LanText = await response.text();
    }
    nTH = nTH + 1
    if (nTH === 5) nTH = 0
    routerIP = LanText.slice(LanText.indexOf('lan_ip::') + 8, -1);
    routerIP = routerIP.slice(0, routerIP.indexOf('}'));
    routerIP = routerIP.split("/")[0]


    let LanString = LanText.slice(LanText.indexOf('dhcp_leases::') + 14, -1);
    LanString = LanString.slice(0, LanString.indexOf('}'));
    LanString = LanString.replace(/\'/g, '');

    LanString = "Name,IP,MAC,Time,x,IF,y," + LanString
    var LanArray = LanString.split(',')
    let x = LanArray.length;
    for (i = 0; i < x; i++) {
        i = i + 7
        LanArray.splice(i, 0, ';');
    }

    LanArray = LanArray.toString();
    let LanJSON = DDTextToJSON(LanArray);

    let arpTable = LanText.slice(LanText.indexOf('arp_table::') + 12, -1);
    arpTable = arpTable.slice(0, arpTable.indexOf('}'));
    arpTable = arpTable.replace(/\'/g, '');

    arpTable = "Name,IP,MAC,arp1,IF,arp3,arp4,arp5," + arpTable
    var arpArray = arpTable.split(',')
    let z = arpArray.length;
    for (i = 0; i < z; i++) {
        i = i + 8
        arpArray.splice(i, 0, ';');
    }

    arpArray = arpArray.toString();
    let arpJSON = DDTextToJSON(arpArray);

    //--------WiFiArray--------------------------------------------------------------
    let response2 = await fetch('/Status_Wireless.live.asp', {
        method: 'GET', credentials: 'include'
    });
    WiFiText = await response2.text();
    let WiFiString = WiFiText.slice(WiFiText.indexOf('active_wireless::') + 17, -1);

    WiFiString = WiFiString.slice(0, WiFiString.indexOf('}'));

    var WiFiArray = WiFiString.split('\',\'')

    let y = WiFiArray.length;
    for (i = 0; i < y; i++) {
        i = i + 17
        WiFiArray.splice(i, 0, ';');
    }
    WiFiArray = WiFiArray.toString();
    WiFiArray = WiFiArray.replace(/ day,/g, 'd').replace(/ days,/g, 'd');
    WiFiArray = WiFiArray.slice(1, -1)
    WiFiArray = "MAC,1,WiFi,2,RX,TX,Mode,3,4,5,Signal,6,7,8,9,10,11,;," + WiFiArray

    let WiFiJSON = DDTextToJSON(WiFiArray);

    //----combine LanArray & ARPArray--------------------------------------------------------------
    result = LanJSON.map(item => ({
        ...arpJSON.find(({ MAC }) => item.MAC == MAC),
        ...item,
    }));

    //----combine result & WiFiArray--------------------------------------------------------------
    result = result.map(item => ({
        ...WiFiJSON.find(({ MAC }) => item.MAC == MAC),
        ...item,
    }));

    //-----get sort method-----------------------------------------------------------------
    if (!document.cookie.includes("Sort=")) { document.cookie = "Sort=NameUP;expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;'" };
    cookieK = document.cookie.split("; ")
    cookieK.forEach(element => {
        if (element.includes("Sort")) {
            sortMode = element.split("=").pop()
        }
    });

    //----sort Array----------------------------------------------------------------------
    result.sort((a, b) => {
        if (sortMode.includes("Name")) {
            return a.Name.toLowerCase() === b.Name.toLowerCase() ? 0 : a.Name.toLowerCase() > b.Name.toLowerCase() ? 1 : -1;
        }
        else if (sortMode.includes("Signal")) {
            if (a.Signal) {
                return (a.Signal) - (b.Signal);
            }
            else return -1
        }
        else if (sortMode.includes("IP")) {
            return (a.IP.split(".").pop()) - (b.IP.split(".").pop());
        }
        else if (sortMode.includes("Uptime")) {
            if (a[2] && b[2]) {
                return (a[2].replace(/d/g, '').split(":", 2).join(".")) - (b[2].replace(/d/g, '').split(":", 2).join("."));
            }
            else return -1
        }
    });

    if (sortMode.includes("DN")) {
        result.reverse()
    }
    if (sortMode.includes("Signal") || sortMode.includes("Uptime")) {
        result1 = [
            ...result.filter(x => x.Signal)];
        result2 = [
            ...result.filter(x => !x.Signal)];
        result2.sort((a, b) => {
            return a.Name.toLowerCase() === b.Name.toLowerCase() ? 0 : a.Name.toLowerCase() > b.Name.toLowerCase() ? 1 : -1;
        });
        result = result1.concat(result2);
    }

    //----Make Tiles--------------------------------------------------------------
    html = ''
    result.forEach(item => {
        if (document.cookie.includes("Offline=1") || (document.cookie.includes("Offline=0") && item.Signal || item.arp1)) {
            if (item.Time && item.Time != "Static") {
                d = item.Time.split(" ")[0] + "d ";
                r = item.Time.split(" ")[2];
                r = r.split(":")
                r.pop()
                r = r.join(":")
                lTime = d + r;
            }
            bS = '';

            if ((item.WiFi && item.Signal) || (!item.Signal && item.arp1)) { bS = "online"; }
            dataT2.forEach(item2 => {
                if (item2.IP == item.IP) {
                    if (!item.Signal && !item.arp1) { bS = ""; }
                    if (!item.Signal && item2.Status > 1 && item.arp1) { bS = "online"; }
                    else if (!item.Signal && (item2.Status == 1 || item.arp1)) { bS = "response"; }
                    else if (item.Signal && item2.Status == 1) { bS = "response"; }
                }
            })
            html += '<div class=" sensorset ' + bS;
            if (bS == "response") { html += ' clickables" onclick="playSound(3000), splitOn(\'' + item.IP + '\'), topF()' }
            html += '">'

            html += '<div  class="sensors" id="' + item.IP + '" style="font-weight:bold;">' + item.Name + '</div>';

            if (document.cookie.includes("IP=1")) {
                html += '<div class=row><div class=odd>IP:</div><div class="even select" id="IP">' + item.IP + '</div></div>';
            }

            if (document.cookie.includes("Adapter=1")) {
                if (bS != '') {
                    if (item.Signal) { html += '<div class=row><div class=odd>Adapter:</div><div class=even>' + item.WiFi + '</div></div>'; }
                    else { html += '<div class=row><div class=odd>Adapter:</div><div class=even>LAN</div></div>'; }
                }
                else { html += '<div class=row><div class=odd>Adapter:</div><div class=even>offline</div></div>'; }
            }

            if (document.cookie.includes("Lease=1")) {
                html += '<div class=row><div class=odd>Lease:</div><div class=even>' + lTime + '</div></div>';
            }

            if (document.cookie.includes("Uptime=1")) {
                if (item[2]) { uT = item[2].split(":", 2).join("h") + "m"; html += '<div class=row><div class=odd>Up:</div><div class=even>' + uT + '</div></div>'; }
                else { html += '<div class=row><div class=odd>Up:</div><div class=even>N.A.</div></div>'; }
            }

            if (document.cookie.includes("MAC=1")) {
                //html += '<div class=row style="align-self:center"><div class=even>' + item.MAC + '</div></div>';
                html += '<div class=row style="align-self:center"><div class="even select" id="MAC">' + item.MAC + '</div></div>';
            }

            if (item.Signal) {
                if (document.cookie.includes("RX,TX=1")) {
                    html += '<div class=row><div class=odd>TX:' + item.TX + '</div><div class=even>RX:' + item.RX + '</div></div>';
                }
                html += '<div class=signal><meter value="' + item.Signal / 10 + '" min=0" max="100" id="' + item.Name + '" class="slider" ></meter><div class=sQ>' + item.Signal / 10 + '%</div></div>';
            }

            else { html += '<div class=signal></div>'; }

            html += '</div>';
        }
    })

    if (isittime) {
        document.getElementById('sensorList').innerHTML = html;
        storeData(result);

        if (firstRun) {
            if (!document.cookie.includes("Snd=")) { mC("Snd") }
            if (window.navigator.userAgent.match(/iPhone/i)) {
                document.body.style.height = "101vh";
            }
            fDD = setInterval(fetchDD, 2000);
            getUrl()
            longPressS();
            longPressN();
            addEonce();
            firstRun = 0;
        }
        //document.getElementById('unitId').innerHTML = routerIP;
        document.getElementById('unitT').innerHTML = routerIP;

        makeMenu();
        changeCss();
        longPressB();
        eventLS();
    }
}


function changeCss() {
    x = "auto ";
    m = null;
    var sList = document.getElementById("sensorList");
    var numSet = sList.getElementsByClassName('sensorset').length;
    z = numSet; //if there are no big values orient on number of "normal" tiles
    if (z > 20) {
        y = x + x + x + x + x;
        columnSet = 5;
    }
    else if (z > 9) {
        y = x + x + x + x;
        columnSet = 4;
    }
    else if (z > 4) {
        y = x + x + x;
        columnSet = 3;
    }
    else if (z > 1) {
        y = x + x;
        columnSet = 2;
    }
    else if (z < 2) {
        y = x;
        m = "important"
        columnSet = 1;
    }
    else {
        y = x + x;
        columnSet = 2;
    }

    if (window.innerWidth < (165 * columnSet) || document.cookie.includes("Two=1") || document.getElementById('framie').offsetWidth > 0 && window.innerWidth < 1500) {
        columnSet = 2; y = x + x
    };

    sList.style.setProperty('grid-template-columns', y, m);

    //calculate and add extra tiles
    if (numSet % columnSet != 0 && columnSet != 1) {
        calcTile = columnSet - (numSet - columnSet * Math.floor(numSet / columnSet));
        for (let i = 1; i <= calcTile; i++) {
            html += '<div class="sensorset"></div>'
        }
    }
    document.getElementById('sensorList').innerHTML = html;

    toScale();
}

function addEonce() {
    document.addEventListener('touchstart', e => {
        msTs = Date.now();
        tsX = e.changedTouches[0].screenX
        tsY = e.changedTouches[0].screenY
    })
    document.addEventListener('touchend', e => {
        msTe = Date.now();
        teX = e.changedTouches[0].screenX
        teY = e.changedTouches[0].screenY
        checkDirection()
    })
    document.addEventListener('mousemove', e => {
        if (!manNav && !navOpen) {
            if (e.clientX < 10 && document.getElementById('mySidenav').offsetLeft === -280) openNav()
            //if (e.clientX >280 && document.getElementById('sysInfo').offsetHeight === 0) closeNav()
        }
    })
    document.getElementById('mySidenav').addEventListener('mouseleave', (e) => {
        if (!manNav) {
            closeNav()
        }
    })
    window.addEventListener('resize', (e) => {
        toScale();
    })
}

function eventLS() {
    const selectButtons = document.querySelectorAll(".select");
    selectButtons.forEach(selectButton => {
        selectButton.addEventListener('click', (e) => {
            isittime = 0 
            bInput = setTimeout(blurInput, 10000)
            e.stopPropagation();
        })
        selectButton.addEventListener('mouseleave', (e) => {
            isittime = 1 
            clearTimeout(bInput);
            e.stopPropagation();
        })
    })
}

function toScale() {
    scaleItm = document.getElementById('allList')
    if (document.body.clientWidth < scaleItm.offsetWidth && columnSet == 2) {
        scaleItm.style.translate = "0 " + -(scaleItm.offsetHeight - ((document.body.clientWidth / scaleItm.offsetWidth) * scaleItm.offsetHeight)) / 2 + "px";
        scaleItm.style.transform = 'scale(' + document.body.clientWidth / (scaleItm.offsetWidth + 20) + ')';
    }
    else {
        scaleItm.style.transform = 'scale(1)';
        scaleItm.style.translate = "0";
    }
}

function checkDirection() {
    touchtime = msTe - msTs
    touchDistX = teX - tsX
    touchDistY = teY - tsY
    if (teX < tsX && navOpen) {
        if (Math.abs(touchDistX) > 40 && Math.abs(touchDistY) < 30 && touchtime < 250) closeNav()
    }
    if (teX > tsX && !navOpen) {
        if (Math.abs(touchDistX) > 40 && Math.abs(touchDistY) < 30 && touchtime < 250) openNav()
    }
}

function blurInput() {
    console.log("blurred")
    isittime = 1;
}

function openNav(whatisit) {
    navOpen = 1;
    if (whatisit) manNav = 1;
    if (document.getElementById('mySidenav').offsetLeft === -280) {
        document.getElementById("mySidenav").style.left = "0";
    } else { closeNav(); }
}

function closeNav() {
    manNav = 0;
    navOpen = 0;
    document.getElementById("mySidenav").style.left = "-280px";
}

/*function openSys() {
    if (document.getElementById('sysInfo').offsetHeight === 0) {
        document.getElementById('menueWrap1').style.flexShrink = "0";
        document.getElementById('sysInfo').style.height = "180px";
    } else {
        document.getElementById('sysInfo').style.height = "0";
        document.getElementById('menueWrap1').style.flexShrink = "999";
    }
}*/

function makeMenu() {
    let sortArray = [{ "sort": ["NameUP", "NameDN"], "name": "Name" }, { "sort": ["SignalUP", "SignalDN"], "name": "Signal" }, { "sort": ["IPUP", "IPDN"], "name": "IP" }, { "sort": ["UptimeUP", "UptimeDN"], "name": "Uptime" }];
    let showArray = ["IP", "Adapter", "Lease", "Uptime", "MAC", "RX,TX", "Offline"]
    symUP = "&#9650;&#xFE0E";
    symDn = "&#9660;&#xFE0E";
    sym0 = "&#x2610;&#xFE0E"
    sym1 = "&#9745;&#xFE0E"

    let html4 = '';

    html4 += '<div class="menueItem">Show:</div>';
    showArray.forEach(item => {
        if (document.cookie.includes(item + "=1")) { chkSym = sym1 }
        else { chkSym = sym0 }
        html4 += '<div class="menueItem" onclick="mC(\'' + item + '\');setTimeout(makeMenu, 500)"><div class="serverUnit" style="text-align: center;">' + chkSym + '</div><div id="Name" class="nc">' + item + '</div></div>';
    });

    html4 += '<div class="menueItem">&nbsp;</div>';
    html4 += '<div class="menueItem">Sort:</div>';
    sortArray.forEach(item => {
        if (document.cookie.includes(item.name + "=1") || !document.cookie.includes(item.name + "=")) {
            sortSym = '';
            for (Array of item.sort) {
                if (Array == sortMode) { if (Array.includes("UP")) { sortSym = symUP } else { sortSym = symDn } }
            }
            html4 += '<div class="menueItem" onclick="sorT(\'' + item.name + '\');setTimeout(fetchDD, 500);"><div class="serverUnit" style="text-align: center;font-size:12pt;">' + sortSym + '</div><div id="Signal" class="nc">' + item.name + '</div></div>'
        }
    });

    document.getElementById('menueList').innerHTML = html4;
}

function launchFs(element) {
    element.requestFullscreen();
    //seems to not be necessary anymore
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function splitOn(x) {
    if (x == "home") { x = routerIP; }
    if (isOpen == 1 && window.innerWidth <= 450 && x == routerIP) { iFrClose() }
    else if (isOpen == 0 || x != prevX) { iFrOpen(x) }
    else { iFrClose() }
    setTimeout(changeCss, 100)
    prevX = x
}

function iFrOpen(x) {
    isOpen = 1;
    document.getElementById('framie').style.width = "100%";
    document.getElementById('framie').innerHTML = '<iframe src="http://' + x + '"></iframe>'
    closeNav();
}

function iFrClose() {
    isOpen = 0;
    document.getElementById('framie').style.width = "0";
    document.getElementById('framie').innerHTML = "";
}


function topF() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }

function longPressN() { document.getElementById('mOpen').addEventListener('long-press', function (e) { window.location.href = "http://" + routerIP; }); }

function longPressS() {
    document.getElementById('closeBtn').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Snd")
    });
    /*document.getElementById('nOpen').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Sort")
    });*/
    document.getElementById('openSys').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Two")
    });
    document.getElementById('nOpen').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Col")
    });
}

function mC(y) {
    if ((document.cookie.match('(^|;)\\s*' + y + '\\s*=\\s*([^;]+)')?.pop() || '') == 1) { playSound(500); document.cookie = y + '=0;expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;' }
    else { playSound(900); document.cookie = y + '=1;expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;' }
}

function sorT(type) {
    if (sortMode.includes("DN") || !sortMode.includes(type)) { type = type + "UP" }
    else { type = type + "DN" }
    playSound(900); document.cookie = 'Sort=' + type + ';expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;'
}

function longPressB() {
    const longButtons = document.querySelectorAll(".clickables");
    longButtons.forEach(longButton => {
        longButton.addEventListener('long-press', function (e) {
            e.preventDefault();
            const lBName = longButton.querySelector(".sensors");

            playSound(1000);
            if (/Android|iPhone/i.test(navigator.userAgent)) {
                window.location.href = "http://" + lBName.id;
            }
            else { window.open('http://' + lBName.id); }
            setTimeout(fetchDD, 600);
            isittime = 0;
            iIV = setTimeout(blurInput, 400);
        });
    });
}

function playSound(freQ) {
    if ((!document.cookie.includes("Snd=0") || freQ < 1000) && (isittime || freQ != 3000)) {
        c = new AudioContext()
        o = c.createOscillator()
        g = c.createGain()
        frequency = freQ
        o.frequency.value = frequency
        o.type = "sawtooth"
        o.connect(g)
        g.connect(c.destination)
        g.gain.setValueAtTime(0.05, 0)
        o.start(0)
        g.gain.exponentialRampToValueAtTime(0.00001, c.currentTime + 0.01)
        o.stop(c.currentTime + 0.01)
    }
}
function storeData(x) {
    dataT = x;
}

/*async function getUrl() {
    for (Array of dataT) {
        let status = 0
        let controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        if (!Array.WiFi || Array.Signal) {
            response = await fetch("http://" + Array.IP + ":80", {
                signal: controller.signal,
                mode: "no-cors"
            }).then((response) => {
                console.log(Array.Name, "available");
                status = 1
            })
                .catch((err) => {
                    console.log(Array.Name, err.message, err);
                    if (["failed", "attempting"].some(v => (err.message).toLowerCase().includes(v))) { console.log(Array.Name, "rejected"); status = 2; }
                    else if (err.message.toLowerCase().includes("aborted")) { console.log(Array.Name, "offline"); status = 3; }
                });
            if (Array.IP) {
                if (dataT2.find(o => o.IP === Array.IP)) {
                    let obj = dataT2.find((o, i) => {
                        if (o.IP === Array.IP) {
                            dataT2[i] = { "IP": Array.IP, "Status": status };
                            return true; // stop searching
                        }
                    });
                }
                else { dataT2.push({ "IP": Array.IP, "Status": status }); }
            }
            else console.log("uuuundefined")
        }
    }
    //console.log(dataT2)
    finishedGet = 0;
    setTimeout(getUrl, 6000);
}*/

async function getUrl() {
    for (Array of dataT) {
        let status = 0
        let found = 0
        let nameA = 0
        let dataT2index = 0
        let controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        if (dataT2.find(o => o.IP === Array.IP)) {
            let obj = dataT2.find((o, i) => {
                dataT2index = i
                found = Array.IP
                nameA = Array.Name
                console.log(found, "---------------------")
                return true;
            })
        }

        if (!Array.WiFi || Array.Signal) {
            response = await fetch("http://" + Array.IP, {
                signal: controller.signal,
                mode: "no-cors"
            }).then((response) => {
                console.log(nameA, "available");
                status = 1
            })
                .catch((err) => {
                    if (["failed", "attempting"].some(v => (err.message).toLowerCase().includes(v))) { console.log(nameA, "rejected"); status = 2; }
                    else if (err.message.toLowerCase().includes("aborted")) { console.log(nameA, "offline"); status = 3; }
                });
        }
        if (Array.IP) {
            if (found) {
                dataT2[dataT2index] = { "IP": found, "Status": status };
            }
            else { dataT2.push({ "IP": Array.IP, "Status": status }); }
        }

    }
    gURL = setTimeout(getUrl, 5000);
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        //console.log("visible");
        clearTimeout(fDD);
        clearTimeout(gURL);
        getUrl();
        fetchDD();
        fDD = setInterval(fetchDD, 2000);
    } else {
        //console.log("invisible");
        clearTimeout(fDD);
        clearTimeout(gURL);
    }
});
!function(e,t){"use strict";var n=null,a="PointerEvent"in e||e.navigator&&"msPointerEnabled"in e.navigator,i="ontouchstart"in e||navigator.MaxTouchPoints>0||navigator.msMaxTouchPoints>0,o=a?"pointerdown":i?"touchstart":"mousedown",r=a?"pointerup":i?"touchend":"mouseup",m=a?"pointermove":i?"touchmove":"mousemove",u=a?"pointerleave":i?"touchleave":"mouseleave",s=0,c=0;function l(e){f(),e=function(e){if(void 0!==e.changedTouches)return e.changedTouches[0];return e}(e),this.dispatchEvent(new CustomEvent("long-press",{bubbles:!0,cancelable:!0,detail:{clientX:e.clientX,clientY:e.clientY,offsetX:e.offsetX,offsetY:e.offsetY,pageX:e.pageX,pageY:e.pageY},clientX:e.clientX,clientY:e.clientY,offsetX:e.offsetX,offsetY:e.offsetY,pageX:e.pageX,pageY:e.pageY,screenX:e.screenX,screenY:e.screenY}))||t.addEventListener("click",(function e(n){t.removeEventListener("click",e,!0),function(e){e.stopImmediatePropagation(),e.preventDefault(),e.stopPropagation()}(n)}),!0)}function v(a){f(a);var i=a.target,o=parseInt(function(e,n,a){for(;e&&e!==t.documentElement;){var i=e.getAttribute(n);if(i)return i;e=e.parentNode}return a}(i,"data-long-press-delay","1500"),10);n=function(t,n){if(!(e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame&&e.mozCancelRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame))return e.setTimeout(t,n);var a=(new Date).getTime(),i={},o=function(){(new Date).getTime()-a>=n?t.call():i.value=requestAnimFrame(o)};return i.value=requestAnimFrame(o),i}(l.bind(i,a),o)}function f(t){var a;(a=n)&&(e.cancelAnimationFrame?e.cancelAnimationFrame(a.value):e.webkitCancelAnimationFrame?e.webkitCancelAnimationFrame(a.value):e.webkitCancelRequestAnimationFrame?e.webkitCancelRequestAnimationFrame(a.value):e.mozCancelRequestAnimationFrame?e.mozCancelRequestAnimationFrame(a.value):e.oCancelRequestAnimationFrame?e.oCancelRequestAnimationFrame(a.value):e.msCancelRequestAnimationFrame?e.msCancelRequestAnimationFrame(a.value):clearTimeout(a)),n=null}"function"!=typeof e.CustomEvent&&(e.CustomEvent=function(e,n){n=n||{bubbles:!1,cancelable:!1,detail:void 0};var a=t.createEvent("CustomEvent");return a.initCustomEvent(e,n.bubbles,n.cancelable,n.detail),a},e.CustomEvent.prototype=e.Event.prototype),e.requestAnimFrame=e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(t){e.setTimeout(t,1e3/60)},t.addEventListener(r,f,!0),t.addEventListener(u,f,!0),t.addEventListener(m,(function(e){var t=Math.abs(s-e.clientX),n=Math.abs(c-e.clientY);(t>=10||n>=10)&&f()}),!0),t.addEventListener("wheel",f,!0),t.addEventListener("scroll",f,!0),t.addEventListener("contextmenu",f,!0),t.addEventListener(o,(function(e){s=e.clientX,c=e.clientY,v(e)}),!0)}(window,document);
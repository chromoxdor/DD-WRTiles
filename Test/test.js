var firstRun = 1;
var columnSet;
var fDD; //fetchDD interval
var cURL;
var bInput; //getURL interval
var navOpen;
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
var isOpen = 0;
var result;
var prevX = 0;
var routerIP;
var nTH = 0;
var sortMode;
var newAmmount;
var bgContent;
var cText = ';expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;'
var lTime = 0;

//##############################################################################################################
//      FETCH
//##############################################################################################################
async function fetchDD() {

    // no cookies? make some!
    if (!document.cookie.includes("IP=")) { mC("IP"); mC("Adapter") }
    if (!document.cookie.includes("Offline=")) { mC("Offline") }
    if (!document.cookie.includes("Sound=")) { mC("Sound") }
    if (!document.cookie.includes("Background=")) { mC("Background") }
    if (!document.cookie.includes("bgURL=")) { mC("bgURL", 1) }
    bgContent = document.cookie.slice(document.cookie.indexOf('bgURL=') + 6).split(";")[0]
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
    let x = LanArray.length + 7;
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


    let WiFiArray = WiFiString.split('\',\'')
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

    //----everything without a signal must be a lan device--------------------------------------------------------------
    resultLAN = [
        ...result.filter(x => !x.Signal)];

    //----get the WiFi without an DHCP entry--------------------------------------------------------------
    result = WiFiJSON.map(item => ({
        ...result.find(({ MAC }) => item.MAC == MAC),
        ...item
    }));

    result = result.concat(resultLAN);

    //-----get sort method-----------------------------------------------------------------
    if (!document.cookie.includes("Sort=")) { document.cookie = "Sort=NameUP;expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;'" };
    cookieK = document.cookie.split("; ")
    cookieK.forEach(element => {
        if (element.includes("Sort")) {
            sortMode = element.split("=").pop()
        }
    });

    //----sort Array----------------------------------------------------------------------
    //Uptime-add leading zero for sorting

    result.forEach(item => {
        if (item[2]?.includes("d")) {
            if (item[2].split("d")[1].split(":")[0].length == 3) {
                item[2] = item[2].replace("  ", "0")
            }
            else item[2] = item[2].replace("  ", "")
        }
    })

    if (sortMode.includes("Signal") || sortMode.includes("Uptime")) {
        result1 = [
            ...result.filter(x => x.Signal)];
        result2 = [
            ...result.filter(x => !x.Signal)];
        result = result1.concat(result2);
    }

    result.sort((a, b) => {
        if (sortMode.includes("Name")) {
            if (a.Name && b.Name) {
                return a.Name.toLowerCase() === b.Name.toLowerCase() ? 0 : a.Name.toLowerCase() > b.Name.toLowerCase() ? 1 : -1;
            }
            else return -1
        }
        else if (sortMode.includes("Signal")) {
            if (a.Signal) {
                return (a.Signal) - (b.Signal);
            }
            else return -1
        }
        else if (sortMode.includes("IP")) {
            if (a.IP == undefined) {
                a.IP = ""
            }
            if (b.IP == undefined) {
                b.IP = ""
            }
            return (a.IP?.split(".").pop()) - (b.IP?.split(".").pop());


        }
        else if (sortMode.includes("Uptime")) {
            if (a[2]) {
                //console.log(a.Name, ":", a[2]?.replace(/d/g, '').split(":", 2).join("."))
                return (a[2]?.replace(/d/g, '').split(":", 2).join(".")) - (b[2]?.replace(/d/g, '').split(":", 2).join("."));
            }
            else return -1
        }
    })
    //reverse results
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
    //Uptime-remove leading zero of ours again
    result.forEach(item => {
        if (item[2]?.includes("d0")) {
            item[2] = item[2].replace("d0", "d")
        }
    })

    //----Make Tiles--------------------------------------------------------------
    html = ''
    result.forEach(item => {
        if (document.cookie.includes("Offline=1") || ((document.cookie.includes("Offline=0") && item.Signal) || item.arp1)) {
            if (item.Time && item.Time != "Static") {
                d = item.Time.split(" ")[0] + "d ";
                r = item.Time.split(" ")[2];
                r = r.split(":")
                r.pop()
                r = r.join(":")
                lTime = d + r;
            }
            else (lTime = "N.A.")
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
            html += '<div class=" sensorset sAmmount ' + bS;
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
                html += '<div class=row style="align-self:center;"><div class="even select" id="MAC">' + item.MAC + '</div></div>';
            }
            else {
                html += '<div class=row style="align-self:center;display:none"><div class="even select" id="MAC">' + item.MAC + '</div></div>';
            }

            if (item.Signal) {
                if (document.cookie.includes("RX,TX=1")) {
                    html += '<div class=row><div class=odd>TX:' + item.TX + '</div><div class=even>RX:' + item.RX + '</div></div>';
                }
                //html += '<div class=signal><meter value="' + item.Signal / 10 + '" min=0" max="100" id="' + item.Name + '" class="slider" ></meter><div class=sQ>' + item.Signal / 10 + '%</div></div>';
                html += '<div class="signal"><div class="slider" style="width: ' + item.Signal / 10 + '%;"></div><div class="sQ">' + item.Signal / 10 + '%</div></div>'
            }

            else { html += '<div class=signal style="opacity: 0;"></div>'; }

            html += '</div>';
        }
    })
    if (isittime) {
        document.getElementById('sensorList').innerHTML = html;
        storeData(result);

        if (firstRun) {
            if (!document.cookie.includes("Sound=")) { mC("Sound") }
            if (window.navigator.userAgent.match(/iPhone/i)) {
                document.body.style.height = "101vh";
            }
            fDD = setInterval(fetchDD, 2000);
            checkURL()
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
        conText()
    }
}

//##############################################################################################################
//     MAKE THE SIDE MENU
//##############################################################################################################
function makeMenu() {
    let sortArray = [{ "sort": ["NameUP", "NameDN"], "name": "Name" }, { "sort": ["SignalUP", "SignalDN"], "name": "Signal" }, { "sort": ["IPUP", "IPDN"], "name": "IP" }, { "sort": ["UptimeUP", "UptimeDN"], "name": "Uptime" }];
    let showArray = ["IP", "Adapter", "Lease", "Uptime", "MAC", "RX,TX", "Offline"]
    let settingsArray = ["Sound", "Background"]
    symUP = "&#9650;&#xFE0E";
    symDn = "&#9660;&#xFE0E";
    sym0 = "&#x2610;&#xFE0E"
    sym1 = "&#9745;&#xFE0E"

    let html4 = '';
    let html5 = '';

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
    settingsArray.forEach(item => {
        if (document.cookie.includes(item + "=1")) { chkSym = sym1 }
        else { chkSym = sym0 }
        html5 += '<div class="syspair" onclick="mC(\'' + item + '\');setTimeout(makeMenu, 500)"><div>' + chkSym + '</div><div>' + item + '</div></div>'
        if (item == "Background") {
            html5 += '<div class="syspair"><input type="text" id="bgURL" name="bgURL" placeholder="paste background URL"><div id="submitBtn" >&#10004;&#xFE0E;</div></div>';
            bgC = "#14842a"
            if (bgContent.startsWith('#')) { bgC = bgContent }
            html5 += '<div class="syspair"><input type="color" id="cPicker" value="' + bgC + '"><div>or pick a color</div></div>';

        }
    });


    document.getElementById('menueList').innerHTML = html4;
    document.getElementById('sysInfo').innerHTML = html5;
}

//##############################################################################################################
//     STYLING SECTION
//##############################################################################################################
function changeCss() {
    container = document.getElementById("container")
    sBtn = document.getElementById("submitBtn")
    if (document.cookie.includes("Background=1")) {
        if (bgContent) {
            if (bgContent.startsWith('#')) {
                container.style.backgroundImage = "none";
                container.style.backgroundColor = bgContent;
                sBtn.style.color = "black"
            }
            else {
                container.style.backgroundImage = "url(" + bgContent + ")";
                sBtn.style.color = "green"
            }

        }
        else {
            container.style.backgroundImage = "url(https://images.pexels.com/photos/2068411/pexels-photo-2068411.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)";
        }
    }
    else if (document.cookie.includes("Background=0")) {
        container.style.backgroundImage = "none";
        container.style.backgroundColor = "unset";
    }
    toScale("true");
}

//---------SCALE & REORDER TILES---------------------------------------------------------------
function toScale() {
    y = ""
    x = "auto ";
    m = null;
    scaleItm = document.getElementById("sensorList");
    tileSize = document.getElementsByClassName('sAmmount')[0]
    tileAmmount = document.getElementsByClassName('sAmmount').length
    if (tileAmmount > 1) {
        if (isOpen && getComputedStyle(document.getElementById('framie')).position != "absolute") {
            colAmmount = Math.floor((document.body.clientWidth - framie.offsetWidth) / tileSize.offsetWidth) - 1
        }
        else { colAmmount = Math.floor(document.body.clientWidth / (tileSize.offsetWidth)) - 1 }
        rowAmmount = Math.floor(tileAmmount / colAmmount)
        possibleRowAmmount = Math.floor(document.getElementById("container").offsetHeight / tileSize.getBoundingClientRect().height) - 1

        if ((tileSize.getBoundingClientRect().height * rowAmmount < document.getElementById("container").offsetHeight) && ((tileSize.offsetWidth * colAmmount > document.body.clientWidth) || colAmmount > rowAmmount)) {
            //if (possibleRowAmmount > Math.ceil(Math.sqrt(tileAmmount))) {
            colAmmount = Math.ceil(Math.sqrt(tileAmmount))
            //}
        }

        if (document.getElementById('framie').offsetWidth > 0 && window.innerWidth < 1500 && getComputedStyle(document.getElementById('framie')).position != "absolute") {
            colAmmount = 2;
        };

        if (colAmmount < 2 || document.cookie.includes("Two=1")) { colAmmount = 2; }
        for (let i = 0; i < colAmmount; i++) {
            y = y + x
        }

        scaleItm.style.setProperty('grid-template-columns', y, m);

        if ((document.body.clientWidth - 20) < scaleItm.offsetWidth && colAmmount == 2) {
            scaleItm.style.transform = 'scale(' + (document.body.clientWidth - 20) / scaleItm.offsetWidth + ')';
            xTrans = (scaleItm.offsetWidth + 10 - (scaleItm.offsetWidth * (document.body.clientWidth - 20) / scaleItm.offsetWidth)) / 2
            scaleItm.style.translate = -xTrans + "px " + -(scaleItm.offsetHeight - ((document.body.clientWidth / scaleItm.offsetWidth) * scaleItm.offsetHeight)) / 2 + "px";
        }
        else {
            scaleItm.style.transform = 'scale(1)';
            document.getElementById('sensorList').style.translate = "0";
        }
        //calculate extra "filling"-tiles
        if (tileAmmount % colAmmount != 0 && isittime) {
            calcTile = colAmmount - (tileAmmount - colAmmount * Math.floor(tileAmmount / colAmmount));
            newAmmount = calcTile
            for (let i = 1; i <= calcTile; i++) {
                html += '<div class="sensorset extra"></div>'
            }
        }
        if (!document.getElementsByClassName('extra').length) {
            document.getElementById('sensorList').innerHTML = html;
        }
    }
}

//##############################################################################################################
//    ADD EVENTLISTENER ONCE
//##############################################################################################################
function addEonce() {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            //console.log("visible");
            clearTimeout(fDD);
            clearTimeout(cURL);
            checkURL();
            fetchDD();
            fDD = setInterval(fetchDD, 2000);
        } else {
            //console.log("invisible");
            clearTimeout(fDD);
            clearTimeout(cURL);
        }
    });
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
            if (e.clientX > 280 && document.getElementById('sysInfo').offsetHeight === 0) closeNav()
        }
    })
    document.getElementById('mySidenav').addEventListener('mouseleave', (e) => {
        if (!manNav) {
            closeNav()
        }
    })
    window.addEventListener('resize', (e) => {
        isittime = 0
        clearTimeout(bInput);
        bInput = setTimeout(blurInput, 1000)
        toScale();
    })
    document.getElementById('container').addEventListener('click', (e) => {
        if (e.target == document.getElementById('allList') || e.target == document.getElementById('container')) {
            iFrClose();
        }
    });
}

//##############################################################################################################
//     ADD EVENTLISTENER CONSTANTLY
//##############################################################################################################
function eventLS() {
    const selectButtons = document.querySelectorAll(".select");
    selectButtons.forEach(selectButton => {
        selectButton.addEventListener('click', (e) => {
            isittime = 0
            clearTimeout(bInput);
            bInput = setTimeout(blurInput, 10000)
            e.stopPropagation();
        })
        selectButton.addEventListener('mouseleave', (e) => {
            isittime = 1
            clearTimeout(bInput);
            e.stopPropagation();
        })
    })
    const sonsorTiles = document.querySelectorAll(".sAmmount");
    sonsorTiles.forEach(sonsorTile => {
        sonsorTile.addEventListener('mouseleave', (e) => {
            isittime = 1
            clearTimeout(bInput);
            hideMenu();
        });
        sonsorTile.addEventListener('touchstart', function (e) {
            if (e.touches.length == 2) {
                rightClick(e, sonsorTile)
            }
        });
        sonsorTile.addEventListener('touchstart', function (e) {
            if (e.touches.length == 1) {
                isittime = 1
                clearTimeout(bInput);
                hideMenu();
            }
        });
    })
    document.getElementById('bgURL').addEventListener('click', (e) => {
        isittime = 0
        clearTimeout(bInput);
        bInput = setTimeout(blurInput, 10000)
    });
    document.getElementById('bgURL').addEventListener('focusout', (e) => {
        isittime = 1
        clearTimeout(bInput);
    });
    document.getElementById('submitBtn').addEventListener('click', (e) => {
        playSound(1000);
        isittime = 1
        clearTimeout(bInput);
        document.cookie = 'bgURL=' + document.getElementById('bgURL').value + cText
        fetchDD();
    })
    document.getElementById('bgURL').addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            playSound(1000);
            event.preventDefault();
            isittime = 1
            clearTimeout(bInput);
            document.cookie = 'bgURL=' + document.getElementById('bgURL').value + cText
            fetchDD();
        }
    });
    document.getElementById('cPicker').addEventListener("click", (e) => {
        isittime = 0
        clearTimeout(bInput);
        bInput = setTimeout(blurInput, 10000)
    });
    document.getElementById('cPicker').addEventListener("focusout", (e) => {
        isittime = 1
        clearTimeout(bInput);
    });
    document.getElementById('cPicker').addEventListener("input", (e) => {
        document.cookie = 'bgURL=' + document.getElementById('cPicker').value + cText
        document.getElementById("container").style.backgroundImage = "none";
        document.getElementById("container").style.backgroundColor = document.getElementById('cPicker').value
    });
}

//##############################################################################################################
//    IFRAME
//##############################################################################################################

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
    new ResizeObserver(toScale).observe(framie)
    document.getElementById('framie').style.width = "100%";
    document.getElementById('framie').innerHTML = '<iframe src="http://' + x + '"></iframe>'
    closeNav();
}

function iFrClose() {
    isOpen = 0;
    //iFRObserver.disconnect();
    document.getElementById('framie').style.width = "0";
    document.getElementById('framie').innerHTML = "";
}

//##############################################################################################################
//    LONG PRESS AREA
//##############################################################################################################

function longPressN() { document.getElementById('mOpen').addEventListener('long-press', function (e) { window.location.href = "http://" + routerIP; }); }

function longPressS() {
    document.getElementById('closeBtn').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Sound")
    });
    document.getElementById('openSys').addEventListener('long-press', function (e) {
        e.preventDefault();
        mC("Two")
        e.stopPropagation();
    });
    document.getElementById('nOpen').addEventListener('long-press', function (e) {
        e.preventDefault();
        playSound(1000);
        document.body.requestFullscreen();
    });
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

//##############################################################################################################
//    SOUND
//##############################################################################################################
function playSound(freQ) {
    if (!document.cookie.includes("Sound=0")) {
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

//##############################################################################################################
//     CHECK URL
//##############################################################################################################
function storeData(x) {
    dataT = x;
}
async function checkURL() {
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
    cURL = setTimeout(checkURL, 5000);
}
//##############################################################################################################
//     GET VENDOR
//##############################################################################################################

function conText() {
    const sensorSets = document.querySelectorAll('.sAmmount');
    sensorSets.forEach(sensorSet => {
        sensorSet.addEventListener("contextmenu", (e) => { rightClick(e, sensorSet) });
    });
}

function hideMenu() {
    document.getElementById("contextMenu").style.opacity = "0"
    document.getElementById("contextMenu").style.pointerEvents = 'none'
}

async function rightClick(e, sensorSet) {
    e.preventDefault();
    isittime = 0;
    clearTimeout(bInput);
    bInput = setTimeout(blurInput, 10000)
    copyE = sensorSet
    sMAC = copyE.querySelector("#MAC");
    sMAC1 = sMAC.textContent.split(":").slice(0, 3),
        sMAC1 = sMAC1.join(":") + ":00:00:00";
    document.getElementById('vendor').innerHTML = '<iframe id="IFR" src="https://api.macvendors.com/' + sMAC1 + '"></iframe>'

    var menu = document.getElementById("contextMenu")
    if (document.getElementById("contextMenu").style.display == "none") {
        menu.style.display = 'flex';
        menu.style.opacity = '1';
    }
    menu.style.pointerEvents = 'all'
    menu.style.opacity = '1';
    menu.style.left = e.pageX - 90 + "px";
    menu.style.top = e.pageY + 10 + "px";
}

//##############################################################################################################
//     HELPER
//##############################################################################################################
function blurInput() {
    isittime = 1;
    hideMenu();
}

function openNav(whatisit) {
    navOpen = 1;
    if (whatisit) manNav = 1;
    if (document.getElementById('mySidenav').offsetLeft === -280) {
        document.getElementById("mySidenav").style.left = "0";
    } else { closeNav(); }
}

function closeNav() {
    if (document.getElementById('sysInfo').offsetHeight > 0) {
        openSys();
    }
    manNav = 0;
    navOpen = 0;
    document.getElementById("mySidenav").style.left = "-280px";
}

function openSys() {
    if (document.getElementById('sysInfo').offsetHeight === 0) {
        document.getElementById('menueWrap1').style.flexShrink = "0";
        document.getElementById('sysInfo').style.height = "105px";
    } else {
        document.getElementById('sysInfo').style.height = "0";
        document.getElementById('menueWrap1').style.flexShrink = "999";
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

// scroll to the top
function topF() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }

// get sort tyope
function sorT(type) {
    if (sortMode.includes("DN") || !sortMode.includes(type)) { type = type + "UP" }
    else { type = type + "DN" }
    playSound(900); document.cookie = 'Sort=' + type + cText
}

// make cookies
function mC(y, z) {
    if ((document.cookie.match('(^|;)\\s*' + y + '\\s*=\\s*([^;]+)')?.pop() || '') == 1) { playSound(500); document.cookie = y + '=0;expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/user;' }
    else if (!z) { playSound(900); document.cookie = y + '=1' + cText }
    else { playSound(900); document.cookie = y + '=' + cText }
}

// Longress by John Doherty
!function (e, t) { "use strict"; var n = null, a = "PointerEvent" in e || e.navigator && "msPointerEnabled" in e.navigator, i = "ontouchstart" in e || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0, o = a ? "pointerdown" : i ? "touchstart" : "mousedown", r = a ? "pointerup" : i ? "touchend" : "mouseup", m = a ? "pointermove" : i ? "touchmove" : "mousemove", u = a ? "pointerleave" : i ? "touchleave" : "mouseleave", s = 0, c = 0; function l(e) { f(), e = function (e) { if (void 0 !== e.changedTouches) return e.changedTouches[0]; return e }(e), this.dispatchEvent(new CustomEvent("long-press", { bubbles: !0, cancelable: !0, detail: { clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY, pageX: e.pageX, pageY: e.pageY }, clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY, pageX: e.pageX, pageY: e.pageY, screenX: e.screenX, screenY: e.screenY })) || t.addEventListener("click", (function e(n) { t.removeEventListener("click", e, !0), function (e) { e.stopImmediatePropagation(), e.preventDefault(), e.stopPropagation() }(n) }), !0) } function v(a) { f(a); var i = a.target, o = parseInt(function (e, n, a) { for (; e && e !== t.documentElement;) { var i = e.getAttribute(n); if (i) return i; e = e.parentNode } return a }(i, "data-long-press-delay", "600"), 10); n = function (t, n) { if (!(e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame && e.mozCancelRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame)) return e.setTimeout(t, n); var a = (new Date).getTime(), i = {}, o = function () { (new Date).getTime() - a >= n ? t.call() : i.value = requestAnimFrame(o) }; return i.value = requestAnimFrame(o), i }(l.bind(i, a), o) } function f(t) { var a; (a = n) && (e.cancelAnimationFrame ? e.cancelAnimationFrame(a.value) : e.webkitCancelAnimationFrame ? e.webkitCancelAnimationFrame(a.value) : e.webkitCancelRequestAnimationFrame ? e.webkitCancelRequestAnimationFrame(a.value) : e.mozCancelRequestAnimationFrame ? e.mozCancelRequestAnimationFrame(a.value) : e.oCancelRequestAnimationFrame ? e.oCancelRequestAnimationFrame(a.value) : e.msCancelRequestAnimationFrame ? e.msCancelRequestAnimationFrame(a.value) : clearTimeout(a)), n = null } "function" != typeof e.CustomEvent && (e.CustomEvent = function (e, n) { n = n || { bubbles: !1, cancelable: !1, detail: void 0 }; var a = t.createEvent("CustomEvent"); return a.initCustomEvent(e, n.bubbles, n.cancelable, n.detail), a }, e.CustomEvent.prototype = e.Event.prototype), e.requestAnimFrame = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (t) { e.setTimeout(t, 1e3 / 60) }, t.addEventListener(r, f, !0), t.addEventListener(u, f, !0), t.addEventListener(m, (function (e) { var t = Math.abs(s - e.clientX), n = Math.abs(c - e.clientY); (t >= 10 || n >= 10) && f() }), !0), t.addEventListener("wheel", f, !0), t.addEventListener("scroll", f, !0), t.addEventListener("contextmenu", f, !0), t.addEventListener(o, (function (e) { s = e.clientX, c = e.clientY, v(e) }), !0) }(window, document);
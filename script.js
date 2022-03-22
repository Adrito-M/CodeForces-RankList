let yearFilter = 'All'
let deptFilter = 'All'
let handleInfo
let branches = new Set()
let years = new Set()

function CSVToJSON(csvData) {
    var data = CSVToArray(csvData);
    var objData = [];
    for (var i = 1; i < data.length; i++) {
        objData[i - 1] = {};
        for (var k = 0; k < data[0].length && k < data[i].length; k++) {
            var key = data[0][k];
            objData[i - 1][key] = data[i][k]
        }
    }
    var jsonData = JSON.stringify(objData);
    jsonData = jsonData.replace(/},/g, "},\r\n");
    jsonData = JSON.parse(jsonData);
    return jsonData;
}

function CSVToArray(csvData, delimiter) {
    delimiter = (delimiter || ",");
    var pattern = new RegExp((
        "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + delimiter + "\\r\\n]*))"), "gi");
    var data = [[]];
    var matches = null;
    while (matches = pattern.exec(csvData)) {
        var matchedDelimiter = matches[1];
        if (matchedDelimiter.length && (matchedDelimiter != delimiter)) {
            data.push([]);
        }
        if (matches[2]) {
            var matchedDelimiter = matches[2].replace(
                new RegExp("\"\"", "g"), "\"");
        } else {
            var matchedDelimiter = matches[3];
        }
        data[data.length - 1].push(matchedDelimiter);
    }
    return (data);
}

async function main() {
    const csv = await fetch('handles_csv.csv').then(csv => csv.text()).then(csvText => CSVToJSON(csvText));

    var handles = [];

    var handleURL = "https://codeforces.com/api/user.info?handles="
    csv.forEach(user => {
        handles.push(user["handle"].trim());
        handleURL = handleURL.concat(`${user["handle"].trim()};`);
    });

    try {
        handleInfo = await fetch(handleURL)
        .then(response => response.json())
        .then(jsonObj => jsonObj.result);
    } catch {
        document.getElementById("loader").style.display = "none";
        errorfunc()
        return
    }
    
    handleInfo.forEach((userinfo, index) => {
        let temp = (csv[index]['email'].match(/[a-z]+\d\d/))[0]
        userinfo.year = '20' + temp.substring(temp.length - 2, temp.length)
        years.add(userinfo.year)
        userinfo.branch = temp.substring(0, temp.length - 2).toUpperCase()
        branches.add(userinfo.branch)
        if (userinfo.rating == undefined) {
            userinfo.rating = 0;
            userinfo.rank = "unrated";
            userinfo.maxRating = 0;
            userinfo.maxRank = "unrated";
        }
        // userinfo.ratingChange = '—';
    });

    branches = Array.from(branches)
    years = Array.from(years)
    branches.sort()
    years.sort()

    handleInfo.sort((a, b) => b.rating - a.rating);

    handleInfo.forEach((userinfo, index) => {
        userinfo.sno = (index+1)+(3-(index+1+"").length)*" "
    })
    
    makeDropDown()
    buildTable()

    /*
    const ratingChangeURL = "https://codeforces.com/api/user.rating?handle=";

    for (var i = 0; i < handles.length; i++) {
        setTimeout(async function(index) {

            fetch(ratingChangeURL + handleInfo[index].handle)
            .then(response => response.json())
            .then(jsonData => jsonData.result)
            .then(result => result[result.length - 1])
            .then(lastChange => {
                var change = 0;
                try { change = lastChange.newRating - lastChange.oldRating; }
                finally { return change; }
            })
            .then(change => (change <= 0 ? "" : "+") + change)
            .then(change => {
                var temp = document.getElementById(`ratingchange-${handleInfo[index].handle}`);
                temp.innerHTML = change;
                temp.style.color = rcCol(change);
                handleInfo[index].ratingChange = change;
            });
            // document.addEventListener('DOMContentLoaded', (e) => console.log('brr'));
            //console.log("done");

        }, i * 1000, i);
    }
    */

}

function buildTable() {
    updateDropDown()
    var table = document.querySelector('#myTable');
    table.innerHTML = '';
    const datas = filterData()
    for (const data of datas) {
        var row =   `<tr>
                        <td id = sno-${data.sno} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: left;'>${data.sno}</td>
                        <td id = handle-${data.handle} style = 'font-weight:bold;'>
                            <a href = "https://codeforces.com/profile/${data.handle}" style = 'text-decoration: none; color:${map.get(data.rank)};'>${data.handle}</a>
                        </td>
                        <td id = rating-${data.handle} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>
                            ${data.rating}<span style='color:black'> (</span><span style = 'color:${map.get(data.maxRank)}'>${data.maxRating}</span><span style='color:black'>)</span>
                        </td>
                        <td id = dept-${data.branch} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>${data.branch}</td>
                        <td id = year-${data.year} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>${data.year}</td>
                        <td id = rank-${data.handle} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>${data.rank}</td>
                    </tr>`;
        
        table.innerHTML += row;
        document.getElementById("loader").style.display = "none";
    }
}

function filterData() {
    let filteredData = handleInfo.filter((userinfo) => {
        if (yearFilter === 'All') return true
        return (userinfo.year === yearFilter)
    })

    return filteredData.filter((userinfo) => {
        if (deptFilter === 'All') return true
        return (userinfo.branch === deptFilter)
    })
}

function makeDropDown() {
    let ddd = document.querySelector('#deptdd')
    ddd.innerHTML = `<a class="dropdown-item active" id="alldept" onclick="clickEventHandler(this, 'dept')">All</a>
                    <div class="dropdown-divider"></div>`

    for (let branch of branches) {
        ddd.innerHTML += `<a class="dropdown-item" id="dd-${branch}" onclick="clickEventHandler(this, 'dept')">${branch}</a>`
    }

    let ydd = document.querySelector('#yeardd')
    ydd.innerHTML = `<a class="dropdown-item active" id="allyear" onclick="clickEventHandler(this, 'year')">All</a>
                    <div class="dropdown-divider"></div>`

    for (let year of years) {
        ydd.innerHTML += `<a class="dropdown-item" id="dd-${year}" onclick="clickEventHandler(this, 'year')">${year}</a>`
    }
}

function updateDropDown() {

    document.querySelector('#deptopt').innerText = deptFilter
    document.querySelector('#alldept').classList.remove('active')
    for (let branch of branches) {
        document.querySelector(`#dd-${branch}`).classList.remove('active')
    }

    document.querySelector('#yearopt').innerText = yearFilter
    document.querySelector('#allyear').classList.remove('active')
    for (let year of years) {
        document.querySelector(`#dd-${year}`).classList.remove('active')
    }

    if (deptFilter === 'All') document.querySelector('#alldept').classList.add('active')
    else document.querySelector(`#dd-${deptFilter}`).classList.add('active')

    if (yearFilter === 'All') document.querySelector('#allyear').classList.add('active')
    else document.querySelector(`#dd-${yearFilter}`).classList.add('active')

}

function clickEventHandler(element, whichlist) {
    if (whichlist==='dept') deptFilter = element.innerText
    if (whichlist==='year') yearFilter = element.innerText
    buildTable()
}

function errorfunc() {
    let element = document.getElementById("mainBody")    
    element.innerHTML = `<div style="
    color: #666666;
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translateX(-50%) translateY(-50%);
    -webkit-transform: translate(-50%,-50%);
    transform: translate(-50%,-50%);
    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
    font-weight: bolder;
    font-size: x-large;
    text-align: center;
    ">SEEMS LIKE CODEFORCES IS DOWN<br><span style="font-size: large">Please try again later<span></div>`
}

const map = new Map([
    ['unrated', 'black'],
    ['newbie', '#808080'],
    ['pupil', '#008000'],
    ['specialist', '#03a89e'],
    ['expert', '#0000ff'],
    ['candidate master', '#800080'],
    ['master', '#ffa500'],
    ['international master', '#ffa500'],
    ['grandmaster', '#ff0000'],
    ['international grandmaster', '#ff0000'],
    ['legendary grandmaster', '#ff0000']
])

setTimeout(() => main(), 1000);

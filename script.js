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
        handles.push(user["Codeforces Handle"].trim());
        handleURL = handleURL.concat(`${user["Codeforces Handle"].trim()};`);
    });


    const handleInfo = await fetch(handleURL)
    .then(response => response.json())
    .then(jsonObj => jsonObj.result);
    
    handleInfo.forEach(userinfo => {
        if (userinfo.rating == undefined) {
            userinfo.rating = 0;
            userinfo.rank = "unrated";
            userinfo.maxRating = 0;
            userinfo.maxRank = "unrated";
        }
        userinfo.ratingChange = '—';
        // userinfo.rankAmongUs = i;
    });

    handleInfo.sort((a, b) => b.rating - a.rating);
    
    //console.log(handleInfo);

    buildTable(handleInfo);

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

    // console.log(handleInfo);
}

function buildTable(datas) {
    var table = document.querySelector('#myTable');
    table.innerHTML = '';

    for (const data of datas) {
        var row =   `<tr>
                        <td id = handle-${data.handle} style = 'font-weight:bold;'>
                            <a href = "https://codeforces.com/profile/${data.handle}" style = 'text-decoration: none; color:${map.get(data.rank)};'>${data.handle}</a>
                        </td>
                        <td id = rating-${data.handle} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>${data.rating}</td>
                        <td id = maxrating-${data.handle} style = 'color:${map.get(data.maxRank)}; font-weight:bold; text-align: center;'>${data.maxRating}</td>
                        <td id = ratingchange-${data.handle} style = 'font-weight: bold; color: ${rcCol(data.ratingChange)}; text-align: center;'>${data.ratingChange}</td>
                        <td id = rank-${data.handle} style = 'color:${map.get(data.rank)}; font-weight:bold; text-align: center;'>${data.rank}</td>
                    </tr>`;
        
        table.innerHTML += row;
    }
}

function rcCol(args) {
    if (args === "—") return "black";
    else if (parseInt(args) > 0) return "green";
    else if (parseInt(args) < 0) return "red";
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
// console.log(CSVToJSON("abv"));
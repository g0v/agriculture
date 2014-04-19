document.addEventListener('DOMContentLoaded', function() {
  var URL = "0Amp_BWd2HAApdGRUdTVIbGpreU1qVWlTLVJDTE1PeGc"
  Tabletop.init( { key: URL, callback: generateTable, simpleSheet: true } )
})

function generateTable(data) {
  window.data = processData(data)
  createTableStructure(window.data)
}

function createTableStructure(data) {
  fieldsToReject = ["通過日期", "注意事項", "備註", "原始登記廠商名稱", "每公頃每次用量", "rowNumber", "施用次數", "施藥間隔", "使用時期", "稀釋倍數"]

  table = $("#pesticide-table")
  table.append("<thead><tr></tr></thead><tbody></tbody>")
  theadRow = table.find("thead tr")

  keys = Object.keys(data[0]).filter(function(value) {
    return fieldsToReject.indexOf(value) < 0
  })

  $.each(keys, function(_, key) {
    theadRow.append("<th data-name='" + key + "'>" + key +  " <span class='sort js-sort'>⬇</span></th>")
  })

  appendData(data)
}

function appendData(data) {
  tbody = table.find("tbody")
  tbody.html("")

  $.each(data, function(_, data) {
    row = $("<tr>")
    tbody.append(row)
    $.each(keys, function(_, key) {
      row.append("<td class='" + fieldNameMapping[key] + "' data-name='" + key + "'>" + data[key] + "</td>")
    })
  })
}

function sortData(key, direction) {
  data = data.sort(function(a, b) {
    a = a[key].length == 0 ? "0" : a[key]
    b = b[key].length == 0 ? "0" : b[key]
    if(parseInt(a) || parseInt(b)) {
      a = a.replace(/\D/g,""); b = b.replace(/\D/g,"")
      return direction ? a - b : b - a
    } else {
      r = direction ? a < b : a > b
      return r ? -1 : 1
    }
  })
  appendData(data)
}

$(document).on("click", ".js-sort", function() {
  cell = $(this).closest("th")
  cell.toggleClass("active")
  sortData(cell.data("name"), cell.hasClass("active"))
  false
})

function processData(data) {
  data = data.map(function(obj, i) {
    val = obj["施藥方法"]
    fields = ["施用次數", "施藥間隔", "使用時期", "稀釋倍數"]
    info = fields.filter(function(key) { return obj[key].length }).map(function(key) {
      return key + ": " + obj[key]
    })
    obj["施藥方法"] = "<a href='#' class='js-method'>施藥方法</a><div class='popup'>" + val + info.join("<br>") + "</div>"
    return obj
  })
  return data
}

fieldNameMapping = {
  "代號": "code",
  "名稱": "name",
  "廠牌": "brand",
  "通過日期": "date-passed",
  "劑型": "type",
  "含量": "amout",
  "混合": "mix",
  "作物": "crop",
  "病蟲名稱": "pest",
  "每公頃每次用量": "amount-per-hectare-per-time",
  "稀釋倍數": "dilution-ratio",
  "使用時期": "time-to-use",
  "施藥間隔": "use-gap",
  "施用次數": "times-to-apply",
  "安全採收期": "harvest-time",
  "核准日期": "date-approved",
  "原始登記廠商名稱": "company-name",
  "施藥方法": "instruction",
  "注意事項": "notice",
  "備註": "note"
}

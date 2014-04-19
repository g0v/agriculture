document.addEventListener('DOMContentLoaded', function() {
  var URL = "0Amp_BWd2HAApdGRUdTVIbGpreU1qVWlTLVJDTE1PeGc"
  Tabletop.init( { key: URL, callback: generateTable, simpleSheet: true } )
})

function generateTable(data) {
  createTableStructure(data)
}

function createTableStructure(data) {
  fieldsToReject = ["通過日期", "注意事項", "備註", "原始登記廠商名稱", "rowNumber"]

  table = $("#pesticide-table")
  table.append("<thead><tr></tr></thead>")
  theadRow = table.find("thead tr")

  keys = Object.keys(data[0]).filter(function(value) {
    return fieldsToReject.indexOf(value) < 0
  })

  $.each(keys, function(_, key) {
    theadRow.append("<th>" + key +  "</th>")
  })

  appendData(data)
}

function appendData(data) {
  table = $("#pesticide-table")
  table.append("<tbody></tbody>")
  tbody = table.find("tbody")

  $.each(data, function(_, data) {
    row = $("<tr>")
    tbody.append(row)
    $.each(keys, function(_, key) {
      row.append("<td class='" + fieldNameMapping[key] + "'>" + data[key] + "</td>")
    })
  })
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

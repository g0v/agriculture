#!/usr/bin/env lsc
require! {
  fs
  path
  unorm
  'prelude-ls': { find }
}

running-as-script = not module.parent

parse = (data) ->
  count  = 0
  mode   = \zh
  re     = /(.+?)\s\s+(.+?)\s\s+(.+?)$/
  result = []
  tluser = []
  for line in data.split('\r\n')
    switch
    | count is 0    => # do nothing
    | count is 1    => # do nothing
    | line.0 is '*' => mode := \en; count := -1;
    | mode is \zh
      if r = re.exec line
        { 1: zh, 2: en, 3: moa } = r
        zh = undefined if zh is ' '
        zh = unorm.nfc zh
        result.push { zh, en, moa }
    | mode is \en =>
      if r = re.exec line
        { 1: en, 2: zh, 3: moa } = r
        zh = undefined if zh is '登記中'
        zh = unorm.nfc zh
        tluser.push { zh, en, moa }
    ++count
  for drug in tluser
    r = result |> find (.en is drug.en)
    if not r
      console.warn 'not found: ' drug
    else
      console.warn 'zh not match: ' drug if r.zh isnt drug.zh
      console.warn 'moa not match: ' drug if r.moa isnt drug.moa
  ret = {}
  for drug in result when drug.zh
    ret[drug.zh] = drug.moa
  ret

if running-as-script
  [,, ...files] = process.argv
  for filepath in files
    fs.readFile filepath, 'utf8', (err, data) -> console.log parse data
else
  module.exports = parse

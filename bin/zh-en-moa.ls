#!/usr/bin/env lsc
require! {
  fs
  path
  unorm
  'prelude-ls': { find }
  'line-input-stream': LineInputStream
}

running-as-script = not module.parent

parse = (filepath, done) ->
  count  = 0
  mode   = \zh
  re     = /(.+?)\s\s+(.+?)\s\s+(.+?)$/
  result = []
  tluser = []
  LineInputStream fs.createReadStream filepath
    ..setDelimiter "\r\n"
    ..on \line ->
      | count is 0 or count is 1 => # do nothing
      | it.0 is '*'              => mode := \en; count := -1;
      | mode is \zh
        if r = re.exec it
          { 1: zh, 2: en, 3: moa } = r
          zh = undefined if zh is ' '
          zh = unorm.nfc zh
          result.push { zh, en, moa }
      | mode is \en =>
        if r = re.exec it
          { 1: en, 2: zh, 3: moa } = r
          zh = undefined if zh is '登記中'
          zh = unorm.nfc zh
          tluser.push { zh, en, moa }
      ++count
    ..on \end  ->
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
      done? ret

if running-as-script
  [,, ...files] = process.argv
  for filepath in files
    parse filepath, console.log
else
  module.exports = parse

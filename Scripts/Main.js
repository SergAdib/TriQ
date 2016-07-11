/*
## Event handling for:
### File uploader / downloader && converting
### Formating options
*/
$().ready(function(){

  var f2convert = "",
      rowdata = "",
      csvfile = "";
  var needheader = true,
      separator = ", ",
      quoting = "'";

  /* File uploading */
  /* ************** */

  $("input#fileinput").change(function(){
    f2convert = this.files[0];
    var stock = new Array();
    $("#fileaction>label>span:first").text(f2convert.name);
    var reader = new FileReader();
        reader.onload = function() {
          rowdata = this.result;
          /* Parsing XML file data */
          if (rowdata && (f2convert.type === "text/xml" ||
                          f2convert.type === "application/xml")) {
            rowdata = xmlDone(rowdata);
            stock = xml2Arr(rowdata);
            console.log("XML document parsed to Array");

            /* Parsing JSON file data */
          } else if (rowdata && (f2convert.type === "application/json" ||
                                 f2convert.type === "text/plain" ||
                                 f2convert.type === "")) {
            rowdata = $.parseJSON(rowdata);
            stock = json2Arr(rowdata);
            console.log("JSON document parsed to Array");

            /* Drop data */
          } else {
            console.log("Unsupported file type!", f2convert.type);
            return;
          };
          $("#fileaction>label>span:last").removeClass("glyphicon-download")
          .addClass("glyphicon-ok");
          $("#fileaction>label").removeClass("btn-info")
          .addClass("btn-success");
          $("#fileaction>button[type=submit]").removeAttr("disabled");

          /* File converting    */
          /* Table construction */
          /* ****************** */

          $("#fileaction>button:last").click(function(){
            if (stock) {
              var i, j;
              var rows = "";
              var $table = $("#cvstable");

              // Assuring cleaning if reconvert needed
              $table.children().remove();
              $("thead>tr").children().remove();

              // Put headers to thead for convinience
              for (j=0; j<stock[0].length; j++) {
                $("thead>tr").append("<td>"+stock[0][j]+"</td>");
              }

              // Constructing table with cvs data
              for (i=(needheader ? 0 : 1); i<stock.length; i++) {
                var str = "";
                $table.append("<tr></tr>");
                for (j=0; j<stock[i].length; j++) {
                  var field, cell;
                  cell = triming(stock[i][j]);
                  if (quoting == "'") { cell.replace(/'?/g, "`"); }
                  field = quoting+
                          cell+
                          quoting+
                          (j < (stock[i].length-1)? separator : "\r\n");
                  str += field;
                  $table.children("tr:last-child").append("<td>"+field+"</td>");
                }
                rows += str;
              }
              csvfile = rows;
            }
            // Enabling CSV file downloading
            $("#fileaction>button:last>span:last").removeClass("glyphicon-refresh")
            .addClass("glyphicon-ok");
            $("#fileaction>button:last").removeClass("btn-danger")
            .addClass("btn-success");
            $("#fileaction>button:first").removeAttr("disabled");
          });

          /* File downloading */
          /* **************** */

          $("#fileaction>button:first").click(function(){
            if (csvfile && csvfile!=null) {
              window.open("data:text/csv;charset=utf-8;filename=generated.csv," + escape(csvfile));
            } else {
              console.log("Tried to save an empty file, declined");
            }
          });

          };
        reader.readAsBinaryString(f2convert);
  });

  /* Header selector */
  /* *************** */

  $("#dataheader>ul>li").click(function(){
    var sel = $(this).find("a").text(),
        targetel = $("#dataheader>button>span:first");
    if (sel === "Yes") {
      needheader = true;
    } else {
      needheader = false;
    }
    targetel.text(sel);
  });

  /* Separator selector */
  /* ****************** */

  $("#datasep>ul>li").click(function(){
    var sel = $(this).find("a").text(),
        targetel = $("#datasep>button>span:first");
    if (sel === "Comma") {
      separator = ", ";
    } else {
      separator = "; ";
    }
    targetel.text(sel);
  });

  /* Separator selector */
  /* ****************** */

  $("#dataquote>ul>li").click(function(){
    var sel = $(this).find("a").text(),
        targetel = $("#dataquote>button>span:first");
    if (sel === "Single quotes") {
      quoting = "'";
    } else {
      quoting = '"';
    }
    targetel.text(sel);
  });

});

/* Helpers (cleaning strings && data) */
/* ********************************** */
function triming(str){return str.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};

/*
## XML parsing
### xmlDone : XML parsing, clean XML obj output
### xml2Arr : translate XML obj to Array
*/
function xmlDone(data) {
  try {
    var xmldoc = null;
    if (window.DOMParser) {
        var parser = new DOMParser();
        xmldoc = parser.parseFromString(data, "text/xml");
        var fErr = xmldoc.getElementsByTagName("parsererror");
        if ( !fErr || !fErr.length ||
             !fErr[0].childNodes.length) {
            return xmldoc;
        }
        console.log("Errors found while parsing XML");
        return null;
    } else {
        xmldoc = new ActiveXObject("Microsoft.XMLDOM");
        xmldoc.async = false;
        xmldoc.loadXML(data);
        console.log("parsed xml with ActiveX");
        return xmldoc;
    }
  } catch (e) {
    ;
  }
}

function xml2Arr(data) {
  var output = new Array();
  var i, j, k, root, doctitle, id, node, tag;
  // Defining document root
  if (data.childNodes.length == 1) {
    root = data.childNodes[0];
  } else root = data;
  doctitle = root.tagName;

  // First level iteration
  k = 0;
  for (i=0; i<root.childNodes.length; i++) {
    if (root.childNodes[i].nodeType == 1) {
      tag = root.childNodes[i].nodeName;
      node = root.childNodes[i];
      id = node.getAttribute('id');
      // Second level iteration
      var buffer = new Array();
      var headers = new Array();
      if (id) {
        buffer.push(id);
        headers.push("id");
      }
      for (j=0; j<node.childNodes.length; j++) {
        if (node.childNodes[j].nodeType == 1) {
          buffer.push(node.childNodes[j].firstChild.nodeValue);
          headers.push(node.childNodes[j].tagName);
        }
      }
      output[k] = buffer; k++;
    }
  }
  output.unshift(headers);
  return output;
}

/*
## JSON parsing
### json2Arr : JSON data parsing && translating to Array
*/
function json2Arr(data) {
  var output = new Array();
  var root, i, j;
  var buffer = Object.keys(data).map(function(key) { return data[key] });
  if (buffer.length == 1) {
    root = buffer[0];
  } else {
    root = buffer;
  }
  // First level iteration
  for (i=0; i<root.length; i++) {
    if (typeof root[i] == "object") {
      var obj = root[i];
      var layer = Object.keys(obj).map(function(key) { return obj[key] });
      var mock = new Array();

      for (j=0; j<layer.length; j++) {
        mock.push(layer[j]);
      }
      output[i] = mock;
    } else {
      output[i] = root[i];
    }
    // headers
    var headers = Object.keys(obj);
  }
  output.unshift(headers);
  return output;
}

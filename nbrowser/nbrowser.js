module.exports = function(RED) {
    var Nightmare = require('nightmare');
    require('nightmare-download-manager')(Nightmare);
    require('nightmare-upload')(Nightmare);
    function nbrowser(config) {
        RED.nodes.createNode(this, config);
        var nbrowser_delay = 1500;
        var nbrowser_queue = [];
        var nbrowser_to = null;
        var ito = 0;
        this.on('input', function(msg) {
            if (typeof msg.nbrowser_delay != 'undefined') {
                nbrowser_delay = msg.nbrowser_delay;
            }
            nbrowser_queue.push({msg:msg,node:this,config:config});
            nbrowser_invoke();
        });
        function nbrowser_worker(msg, node, config) {
            var globalContext = node.context().global;
            var flowContext = node.context().flow;
            var nbrowser = getTypeInputValue(config.object, config.prop);
            clearTimeout(ito);

            // Create new or use existing browser
            if (typeof nbrowser == 'undefined' || nbrowser == null) {
                let n = {
                    electronPath: require('../../electron'),
                    dock: config.show,
                    show: config.show,
                    webPreferences: {
                        preload: __dirname + '/preload.js',
                        images: config.show
                    }
                };
                if (config.ssl) {
                  n.switches =  {
                     'ignore-certificate-errors': true
                   };
                }
                nbrowser = Nightmare(n);
                setContextPropertyValue(config.object, config.prop, nbrowser);
            }

            // Decode typeInput value by type/value
            function getTypeInputValue(t, v) {
              var r = '';
              switch(t) {
                case "msg":
                  r = RED.util.getMessageProperty(msg, v);
                  break;
                case "flow":
                  r = flowContext.get(v);
                  break;
                case "global":
                  r = globalContext.get(v);
                  break;
                case "str":
                  try {
                    r = unescape(JSON.parse('"'+v+'"'));;
                  }catch(e){
                    r = v;
                  }
                  break;
                case "num":
                  r = parseFloat(v);
                  break;
                case "json":
                  if (v !== '') {
                    r = JSON.parse(v);
                  }else{
                    r = undefined;
                  }
                  break;
                case 'bool':
                  r = (v=='true');
                  break;
                default:
                  r = v;
              }
              return r;
            }

            // Set the context property value
            function setContextPropertyValue(context, property, value) {
                // Assign value to given object and property
                switch(context) {
                  case "msg":
                    RED.util.setMessageProperty(msg, property, value);
                    break;
                  case "flow":
                    flowContext.set(property, value);
                    break;
                  case "global":
                    globalContext.set(property, value);
                    break;
                }
            }

            // We could use eval, but this is a tad safer
            function executeFunctionByName(functionName, context, args) {
                var namespaces = functionName.split(".");
                var func = namespaces.pop();
                for(var i = 0; i < namespaces.length; i++) {
                    context = context[namespaces[i]];
                }
                return context[func].apply(context, args);
            }

            // Apply methods to the given node
            if (config.methods) {
                var p = nbrowser;
                var last_url = '';
                config.methods.forEach(function(m, i) {
                    node.status({fill:"green",shape:"dot",text: "running: " + m.name });
                    var args = [];
                    m.params.forEach(function(param, i) {
                        if (param.typeDefault !== 'output') {
                            args.push(getTypeInputValue(param.type, param.value));
                        }
                    });

                    // Wait for elements to appear first on these commands
                    if (['check','select','click','getHTML','getText','upload',
                         'insert','mouse','select','type'].indexOf(m.name) != -1) {
                          if ( false == (m.name == 'getHTML' && args[0] == '') &&
                               false == (m.name == 'getText' && args[0] == '')) {
                              p = p.then(function() {
                                  ito = setTimeout(function(){
                                      let w = args[0];
                                      if (w.length > 12) {
                                          w = w.substring(0, 12) + "...";
                                      }
                                      w = "wait: " + w;
                                      node.status({fill:"yellow",shape:"dot",text: w });
                                  }, 1000);
                                  return nbrowser.wait(args[0]);
                              }).then(function() {
                                  clearTimeout(ito);
                                  node.status({fill:"green",shape:"dot",text: "running: " + m.name });
                                  return nbrowser.url().then(function(r) {
                                    if (r != last_url) {
                                      last_url = r;
                                      return nbrowser.wait(250);
                                    }else{
                                      return nbrowser;
                                    }
                                  });
                              });

                              // Catch wait failure
                              p = p.catch(function(e) {
                                  if (e.toString().indexOf('Error: .wait() timed out') == 0) {
                                      throw(m.name + ': timeout waiting for ' + args[0] + ' to appear.');
                                  }else{
                                      throw(e);
                                  }
                              });
                          }
                    }
                    // Translate our concise action to invoke the given API method
                    p = p.then(function() {
                        switch (m.name) {
                            case 'check':
                                if (false == args[1]) {
                                    m.func = 'uncheck';
                                }
                                args.pop();
                                return executeFunctionByName(m.func, nbrowser, args);
                                break;
                            case 'clearCookie':
                                if (args[0] == '') {
                                    m.func = 'cookies.clearAll';
                                    args.pop();
                                }
                                return executeFunctionByName(m.func, nbrowser, args);
                                break
                            case 'getHeaders':
                                return ''
                                break;
                            case 'getHTML':
                                if (args[0] != '') {
                                    return nbrowser.evaluate(function(s) {
                                        return document.querySelector(s).innerHTML;
                                    }, args[0]);
                                }else{
                                    return nbrowser.evaluate(function() {
                                        return document.documentElement.outerHTML;
                                    });
                                }
                                break;
                            case 'getText':
                                if (args[0] != '') {
                                    return nbrowser.evaluate(function(s) {
                                        return document.querySelector(s).innerText;
                                    }, args[0]);
                                }else{
                                    return nbrowser.evaluate(function() {
                                        return document.documentElement.outerText;
                                    });
                                }
                                break;
                            case 'getUnfluff':
                                return nbrowser.evaluate(function() {
                                    return document.documentElement.outerHTML;
                                });
                                break;
                            case 'evalJavaScript':
                                return nbrowser.evaluate(function(s) {
                                    return eval(s);
                                }, args[0]);
                            case 'injectJavaScript':
                                args.unshift('js');
                                m.func = 'inject';
                                return executeFunctionByName(m.func, nbrowser, args);
                                break;
                            case 'mouse':
                                m.func = 'mouse' + args[1];
                                args.pop();
                                return executeFunctionByName(m.func, nbrowser, args);
                                break;
                            case 'onAlert':
                                return '';
                                break;
                            case 'onConfirm':
                                var fs = require("fs");
                                var os = require("os");
                                var confirmResponse = 'false';
                                if (args[0]) {
                                    confirmResponse = 'true';
                                }
                                fs.writeFileSync(os.tmpdir() + "/nbrowser-confirmResponse", confirmResponse);
                                return args[0];
                                break;
                            case 'onDownload':
                                return m.params;
                                break;
                            case 'onPrompt':
                                var fs = require("fs");
                                var os = require("os");
                                var promptResponse = args[0];
                                fs.writeFileSync(os.tmpdir() + "/nbrowser-promptResponse", promptResponse);
                                if (args[0]=='') {
                                  return null;
                                }else{
                                  return args[0];
                                }
                                break;
                            case 'saveAs':
                                if (args[0] == 'image') {
                                    m.func = 'screenshot';
                                }else{
                                    m.func = args[0];
                                }
                                args.shift();
                                return executeFunctionByName(m.func, nbrowser, args);
                                break;
                            case 'wait':
                                let w = args[0].toString();
                                if (! isNaN(args[0])) {
                                    args[0] = parseInt(args[0]) * 1000;
                                    w = "wait: " + w + " seconds";
                                }else{
                                    w = w.substring(0, 12) + "...";
                                    w = "wait: " + w;
                                }
                                node.status({fill:"yellow",shape:"dot",text: w });
                                return executeFunctionByName(m.func, nbrowser, args);
                                break;
                            default:
                                return executeFunctionByName(m.func, nbrowser, args);
                        }
                    });
                    // Must receive result
                    p = p.then(function(r) {
                        switch (m.name) {
                          case 'gotoURL':
                              if (typeof r != 'undefined') {
                                  nbrowser.headers = r.headers;
                              }
                              processResults(r, m);
                              return true;
                              break;
                          case 'evalJavaScript':
                              processResults(r, m);
                              break;
                          case 'getHeaders':
                              r = nbrowser.headers;
                              processResults(r, m);
                              return true;
                              break;
                          case 'getUnfluff':
                              var extractor = require('unfluff');
                              r = extractor(r);
                              processResults(r, m);
                              break;
                          case 'onAlert':
                              var fAlert = function(type, message) {
                                if (type == 'alert') {
                                    processResults(message, m);
                                    return true;
                                }
                              }
                              nbrowser.once('page', fAlert);
                              break;
                          case 'onConfirm':
                              return nbrowser.once('page', function(type, msgConfirm){
                                  if (type == 'confirm') {
                                      processResults({message:msgConfirm, reply:r}, m);
                                  }
                              });
                              break;
                          case 'onDownload':
                              return nbrowser.once('download', function(state, downloadItem){
                                  if(state == 'started') {
                                      node.file = r[0].value;
                                      nbrowser.emit('download', node.file, downloadItem);
                                      nbrowser.downloadManager().waitDownloadsComplete();
                                  }
                                  r = { status: state, file: node.file };
                                  processResults(r, m);
                              });
                              break;
                          case 'onPrompt':
                              return nbrowser.once('page', function(type, msgPrompt, defaultResponse){
                                  if (type == 'prompt') {
                                      processResults({message:msgPrompt,default:defaultResponse,reply:r}, m);
                                  }
                              });
                              break;
                          default:
                              processResults(r, m);
                              return true;
                        }

                        // Process result/outputs
                        function processResults(r, m) {
                            m.params.forEach(function(param, i) {
                                if (param.typeDefault == 'output'){
                                    if (param.type == 'output') {
                                        // Process any output types to send messages
                                        var aMsgs = new Array(config.outputs).fill(null);
                                        msg.payload = r;
                                        aMsgs[param.value-1] = msg
                                        node.send(aMsgs);
                                    }else{
                                        // Assign result value to given object property
                                        switch(param.type) {
                                          case "msg":
                                            RED.util.setMessageProperty(msg, param.value, r);
                                            break;
                                          case "flow":
                                            flowContext.set(param.value, r);
                                            break;
                                          case "global":
                                            globalContext.set(param.value, r);
                                            break;
                                        }
                                    }
                                }
                            });
                        }
                    });
                });
            }

            // Obtain the final HTML source
            p = p.then(function() {
                return nbrowser.evaluate(function(){
                    return document.documentElement.outerHTML;
                });
            }).then(function(r) {
                nbrowser.html = r;
                clearTimeout(ito);
                node.status({});

                // Assign value to given object property
                switch(config.objectout) {
                  case "msg":
                    RED.util.setMessageProperty(msg, config.propout, r);
                    break;
                  case "flow":
                    flowContext.set(config.propout, r);
                    break;
                  case "global":
                    globalContext.set(config.propout, r);
                    break;
                }
                // Close instance after Methods
                if (config.close) {
                    p = p.then(function(r) {
                        return nbrowser.end().then(function(){
                            delete nbrowser;
                            setContextPropertyValue(config.object, config.prop, null);
                        });
                    });
                }else{
                  // Pass the original message object along
                  var aMsgs = new Array(config.outputs).fill(null);
                  aMsgs[config.outputs-1] = msg;
                  node.send(aMsgs);
                  return nbrowser;
                }
            });

            // Resume next nbrowser instance
            p = p.then(function(){
                nbrowser_invoke();
                return nbrowser;
            });

            // Catch any errors
            p = p.catch(function(r) {
                clearTimeout(ito);
                node.status({fill:"red",shape:"ring",text: r.toString().substring(0,18) + "..."});
                ito = setTimeout(function(){
                    node.status({});
                }, 15000);
                if (typeof r !== 'undefined') {
                    node.error({"Error":r}, msg);
                }
                nbrowser_invoke();
            });
        };
        function nbrowser_invoke() {
            if (nbrowser_to != null) {
                clearTimeout(nbrowser_to);
            }
            nbrowser_to = setTimeout(function() {
                if (nbrowser_queue.length != 0){
                    var o = nbrowser_queue.shift();
                    nbrowser_worker(o.msg, o.node, o.config);
                }
            }, nbrowser_delay);
        };
    }
    RED.nodes.registerType("nbrowser", nbrowser);
}

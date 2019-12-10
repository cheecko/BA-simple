var idb;
const DB_NAME = "idb_speedtest";
const DB_VERSION = 1;
const STORE_NAME = "docs";
openIDB();

var localForage;
var localForageLocalStorage;
if (typeof localforage !== 'undefined') {
    localForage = localforage.createInstance({
        name: 'localForage_speedtest'
    });
    localForageLocalStorage = localforage.createInstance({
        name: 'localForage_speedtest_localStorage',
        driver: localforage.LOCALSTORAGE
    });
}

var pouchdb = new PouchDB('pouch_speedtest');

var taffydb = TAFFY();
taffydb.store("taffy_speedtest");

var dexie = new Dexie("dexie_speedtest");
dexie.version(1).stores({
    albums: "id",
});

const cacheAvailable = 'caches' in self;

var json = [];
loadAllJSON()

$(document).ready(function() {
    $(document).on("click", "#set, #get, #remove", function() {
        var command = $(this).prop("id");
        var info = getInfo();
        info.command = command;

        template("display", info, "display");
        doSomething(info);
    })

    $(document).on("change", "#limit", function() {
        const command = "get";
        var info = getInfo();
        info.command = command;

        template("display", info, "display");
        doSomething(info);
    })
})

function getInfo() {
    var db = $("#database input[name=database]:checked").val();
    var numDocs = $("#database input[name=numDocs]:checked").val();
    var jsonType = $("#database input[name=jsonType]:checked").val();
    var docs = json["docs_" + numDocs + "_" + jsonType];
    var label = $("#database label[for="+db+"]").text();
    var limit = $("#limit").val();

    return {
        db: db,
        numDocs: numDocs,
        jsonType: jsonType,
        docs: docs,
        label: label,
        limit: limit
    }
}

async function doSomething(info) {
    var timeStart = performance.now();
    var data;
    try{
        switch(info.command + "_" + info.db) {
            case "set_localStorage_bulk":
                setLocalStorage(info.docs, "bulk");
                break;
            case "get_localStorage_bulk":
                data = getLocalStorage(info.limit, "bulk");
                break;
            case "remove_localStorage_bulk":
                clearLocalStorage("bulk");
                break;
            case "set_localStorage":
                setLocalStorage(info.docs);
                break;
            case "get_localStorage":
                data = getLocalStorage(info.limit);
                break;
            case "remove_localStorage":
                clearLocalStorage();
                break;
            case "set_idb":
                await setIDB(info.docs);
                break;
            case "get_idb":
                data = await getIDB(info.limit);
                break;
            case "remove_idb":
                await clearIDB();
                break;
            case "set_cache":
                await setCache(info);
                break;
            case "get_cache":
                data = await getCache(info.limit);
                break;
            case "remove_cache":
                await clearCache();
                break;
            case "set_localForageLocalStorage_bulk":
                await setLocalForageLocalStorage(info.docs, "bulk");
                break;
            case "get_localForageLocalStorage_bulk":
                data = await getLocalForageLocalStorage(info.limit, "bulk");
                break;
            case "remove_localForageLocalStorage_bulk":
                await clearLocalForageLocalStorage("bulk");
                break;
            case "set_localForageLocalStorage":
                await setLocalForageLocalStorage(info.docs);
                break;
            case "get_localForageLocalStorage":
                data = await getLocalForageLocalStorage(info.limit);
                break;
            case "remove_localForageLocalStorage":
                await clearLocalForageLocalStorage();
                break;
            case "set_localForageIDB_bulk":
                await setLocalForageIDB(info.docs, "bulk");
                break;
            case "get_localForageIDB_bulk":
                data = await getLocalForageIDB(info.limit, "bulk");
                break;
            case "remove_localForageIDB_bulk":
                await clearLocalForageIDB("bulk");
                break;
            case "set_localForageIDB":
                await setLocalForageIDB(info.docs);
                break;
            case "get_localForageIDB":
                data = await getLocalForageIDB(info.limit);
                break;
            case "remove_localForageIDB":
                await clearLocalForageIDB();
                break;
            case "5_set":
                setPouchDB(data);
            case "5_get":
                getPouchDB();
            case "5_remove":
                clearPouchDB(); 
            case "6_set":
                setTaffyDB(data);
            case "6_get":
                getTaffyDB();
            case "6_remove":
                clearTaffyDB(); 
            case "7_set":
                setDexie(data);
            case "7_get":
                getDexie();
            case "7_remove":
                clearDexie();
        }
    }catch(error) {
        console.log(error);
        info.error = error;
    }
    info.timeSpent = performance.now() - timeStart;
    template("display", info, "display");

    console.log(data)
    if(data && info.command == "get" && info.limit != "No Limit") {
        data.label = info.label;
        template("table-"+info.jsonType+"-json", data, "previewContainer");
    }else{
        $("#previewContainer").html("");
    }
}

function template(templateName, data, container = "previewContainer") {
    console.log(data)
    var template = $.templates("#" + templateName + "-template");
    var htmlOutput = template.render(data);
    $("#" + container).html(htmlOutput);
}

function loadAllJSON() {
    var numDocs = ["1000_big", "10000_big", "100000_big", "1000_small", "10000_small", "100000_small"]
    numDocs.forEach(async function(e) {
        json["docs_" + e] = await getJSON(e);
    })
}

function getJSON(numDocs) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: 'GET',
            url: "data/"+numDocs+".json",
            success: function(response) {
                response ? resolve(response) : reject("Get JSON is failed!");
            },
            error: function() {
                reject("Get JSON is failed!");
            }
        });
    })
}

function setLocalStorage(docs, method = "normal") {
    if(method == "bulk") {
        localStorage.setItem("localStorage_speedtest", JSON.stringify(docs));
    }else{
        docs.objects.forEach(function(doc, index) {
            localStorage.setItem("localStorage_speedtest_docs_"+index, JSON.stringify(doc));
        })
    }
}

function getLocalStorage(limit, method = "normal") {
    if(method == "bulk") {
        if(localStorage.getItem("localStorage_speedtest")) {
            var data = JSON.parse(localStorage.getItem("localStorage_speedtest"));
            data.objects = limit == "No Limit" ? data.objects : data.objects.slice(0, limit);
            return data;
        }else{
            throw "No Data is found!"
        }
    }else{
        if(localStorage.getItem("localStorage_speedtest_docs_0")) {
            var data = [];
            var count = 0;
            for(var index in localStorage) {
                if(index.includes("localStorage_speedtest_docs_") && limit != "No Limit" && count < limit) {
                    data.push(JSON.parse(localStorage.getItem(index)));
                    count++;
                }else if(index.includes("localStorage_speedtest_docs_") && limit == "No Limit"){
                    data.push(JSON.parse(localStorage.getItem(index)));
                }
            }
            return {objects: data};
        }else{
            throw "No Data is found!"
        }
    }
}

function clearLocalStorage(method = "objectStore") {
    if(method == "objectStore") {
        localStorage.removeItem("localStorage_speedtest");
    }else{
        for(var index in localStorage) {
            if(index.includes("localStorage_speedtest_docs_")) {
                localStorage.removeItem(index);
            }
        }
    }
}

function openIDB() {
    var request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function() {
        idb = request.result;
    }
    request.onerror = function() {
        console.log(request.errorCode);
    }
    request.onblocked = function() {
        console.log(request);
    }
    request.onupgradeneeded = function(e) {
        var db = request.result;
        var store = db.createObjectStore(STORE_NAME, {keyPath: "ID"})
        store.createIndex('index_gender', 'Gender');
        store.createIndex('index_job', 'JobTitle');
        store.createIndex('index_country', 'Country');
        store.createIndex('index_credit_card', 'CreditCard');
    }
};

function getIDBObjectStore(mode) {
    var tx = idb.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
}

function setIDB(docs) {
    return new Promise(function(resolve, reject) {
        var store = getIDBObjectStore("readwrite");
        var request;

        docs.objects.forEach(function(e) {
            request = store.put(e);
        })

        request.onsuccess = resolve;
        request.onerror = reject;
    })
}

function getIDB(limit) {
    return new Promise(function(resolve, reject) {
        var store = getIDBObjectStore("readonly");
        var request = limit == "No Limit" ? store.getAll() : store.getAll(IDBKeyRange.bound("0", "9"), limit);

        request.onsuccess = function() {
            if(request.result.length != 0) {
                resolve({objects: request.result});
            }else{
                reject("No data is found!");
            }
        };
    })
}

function clearIDB() {
    return new Promise(function(resolve, reject) {
        var store = getIDBObjectStore("readwrite");
        var request = store.clear();

        request.onsuccess = resolve;
        request.onerror = reject;
    })
}

function setCache(info) {
    return new Promise(function(resolve, reject) {
        if(!cacheAvailable) {
            reject("Cache API is not available!");
        }

        caches.open('mycache').then(function(cache) {
            cache.put('/cache_speedtest/docs/'+info.jsonType+'/'+info.numDocs+'.json', new Response(JSON.stringify(info.docs))).then(function() {
                resolve();
            }).catch(function(error) {
                reject(error);
            });
        })

        caches.open('mycache').then(function(cache) {
            cache.put('/cache_speedtest/docs/', new Response(JSON.stringify(info.docs))).then(function() {
                resolve();
            }).catch(function(error) {
                reject(error);
            });
        })
    })
}

function getCache(limit) {
    return new Promise(function(resolve, reject) {
        if(!cacheAvailable) {
            reject("Cache API is not available!");
        }

        caches.open('mycache').then(function(cache) {
            cache.match('/cache_speedtest/docs/').then(function(response) {
                return response.json();
            }).then(function(data) {
                data.objects = limit == "No Limit" ? data.objects : data.objects.slice(0, limit);
                resolve(data)
            }).catch(function() {
                reject("No data is found!");
            })
        })
    })
}

function clearCache() {
    return new Promise(function(resolve, reject) {
        if(!cacheAvailable) {
            reject("Cache API is not available!");
        }

        caches.open('mycache').then(function(cache) {
            caches.delete('mycache').then(function() {
                $("#previewContainer").html("");
                resolve()
            }).catch(function(error) {
                reject(error);
            })
        })
    })
}

function setLocalForageLocalStorage(docs, method = "nomal") {
    return new Promise(function(resolve, reject) {
        if(method == "bulk") {
            localForageLocalStorage.setItem("localForage_speedtest", docs).then(function() {
                resolve()
            }).catch(function(error) {
                reject(error)
            });
        }else{
            docs.objects.forEach(function(doc, index) {
                localForageLocalStorage.setItem("localForage_speedtest_docs_"+index, doc).then(function() {
                    resolve()
                }).catch(function(error) {
                    reject(error)
                });;
            })
        }
    })
}

function getLocalForageLocalStorage(limit, method = "nomal") {
    return new Promise(async function(resolve, reject) {
        if(method == "bulk") {
            localForageLocalStorage.getItem("localForage_speedtest").then(function(response) {
                if(response) {
                    response.objects = limit == "No Limit" ? response.objects : response.objects.slice(0, limit);
                    resolve(response)
                }else{
                    reject("No Data is found!")
                }
            }).catch(function(error) {
                reject(error);
            });
        }else{
            var data = [];
            localForageLocalStorage.iterate(function(value, key, iterationNumber) {
                (limit != "No limit" && iterationNumber > limit || key == "localForage_speedtest") ? false : data.push(value);
            }).then(function() {
                (data === undefined || data.length == 0) ? reject("No Data is found!") : resolve({objects: data});
            }).catch(function(error) {
                reject(error);
            });
        }
    })
}

function clearLocalForageLocalStorage(method = "nomal") {
    return new Promise(function(resolve, reject) {
        if(method == "bulk") {
            localForageLocalStorage.removeItem("localForage_speedtest").then(function() {
                resolve()
            }).catch(function(error) {
                reject(error)
            });
        }else{
            localForageLocalStorage.iterate(function(value, key, iterationNumber) {
                key == "localForage_speedtest" ? false : localForageLocalStorage.removeItem(key);
            }).then(function() {
                resolve();
            }).catch(function(error) {
                reject(error);
            });
        }
    })
}

function setLocalForageIDB(docs, method = "nomal") {
    return new Promise(function(resolve, reject) {
        if(method == "bulk") {
            localForage.setItem("localForage_speedtest", docs).then(function() {
                resolve()
            }).catch(function(error) {
                reject(error)
            });
        }else{
            docs.objects.forEach(function(doc, index) {
                localForage.setItem("localForage_speedtest_docs_"+index, doc).then(function() {
                    resolve()
                }).catch(function(error) {
                    reject(error)
                });;
            })
        }
    })
}

function getLocalForageIDB(limit, method = "nomal") {
    return new Promise(async function(resolve, reject) {
        if(method == "bulk") {
            localForage.getItem("localForage_speedtest").then(function(response) {
                if(response) {
                    response.objects = limit == "No Limit" ? response.objects : response.objects.slice(0, limit);
                    resolve(response)
                }else{
                    reject("No Data is found!")
                }
            }).catch(function(error) {
                reject(error);
            });
        }else{
            var data = [];
            localForage.iterate(function(value, key, iterationNumber) {
                (limit != "No limit" && iterationNumber > limit || key == "localForage_speedtest") ? false : data.push(value);
            }).then(function() {
                (data === undefined || data.length == 0) ? reject("No Data is found!") : resolve({objects: data});
            }).catch(function(error) {
                reject(error);
            });
        }
    })
}

function clearLocalForageIDB(method = "nomal") {
    return new Promise(function(resolve, reject) {
        if(method == "bulk") {
            localForage.removeItem("localForage_speedtest").then(function() {
                resolve()
            }).catch(function(error) {
                reject(error)
            });
        }else{
            localForage.iterate(function(value, key, iterationNumber) {
                key == "localForage_speedtest" ? false : localForage.removeItem(key);
            }).then(function() {
                resolve();
            }).catch(function(error) {
                reject(error);
            });
        }
    })
}
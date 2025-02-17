

//edit{pagenum,origin_blob,algo_blob,origin_is_save,algo_is_save}
//e_vocal{pagenum,children_algo_blob} 要查询上一个处理是否完成
//e_acapella{pagenum,children_algo_blob} 要查询上一个处理是否完成
//e_volume{value} 要查询上一个处理是否完成
//e_midi{pagenum,first_choose:8421,second_choose:8421,
//     first_choose_dict,} 要查询上一个处理是否完成

//record{pagenum,origin_blob,algo_blob}


let exports = {};
(function() {

    exports.openUserDatabase = openUserDatabase;
    exports.save_data = save_data;
    exports.get_data = get_data;
    exports.get_all_data = get_all_data;
    exports.get_data_param = get_data_param;
    exports.openUserDatabaseSync = openUserDatabaseSync;

    var g_db; // 全局变量用于存储数据库连接

    // 使用async/await调用
    async function openUserDatabaseSync(userId) {
        try {
            var db = await openUserDatabase(userId);
            // 执行数据库相关操作
        } catch (error) {
            alert("Unable to open/create user database: " + error);
        }
    }

    function openUserDatabase(userId) {
        return new Promise((resolve, reject) => {
            var dbName = 'userDatabase_' + userId;
            var dbversion = 13
            var request = indexedDB.open(dbName, dbversion);
            console.log('open index db:',dbName);
            console.log('index db version',dbversion);
            
            request.onsuccess = function(event) {
            var db = event.target.result; // 存储用户数据库连接
            g_db = db;
            console.log('用户数据库已打开');
            // 在这里执行与用户数据库相关的操作
            resolve(); 
            };

            request.onerror = function(event) {
                console.log('无法打开/创建用户数据库');
                console.error('错误：', event.target.error); // 打印失败原因
                alert("Unable to open/create user database ",event.target.error)
                console.error("Unable to open/create user database ", event.target.error);
                reject(event.target.error); // 假设 reject 是你之前已定义的 promise 拒绝方法
            };
        
            request.onupgradeneeded = function(event) {
                console.log('open index db onupgradeneeded');

                // 获取由 onupgradeneeded 事件提供的事务
                var transaction = event.target.transaction;
                var db = event.target.result;

                // 检查是否已经存在名为 "tools" 的对象存储
                if (!db.objectStoreNames.contains("tools")) {
                    // 创建新的对象存储
                    var dataStore = db.createObjectStore("tools", { keyPath: "key" });
                    // 初始化新创建的对象存储的数据
                    dataStore.put({key:'edit_origin_collect', value:null});
                } else {
                    // 使用事务直接访问已存在的对象存储
                    var dataStore = transaction.objectStore("tools");

                    // 检查是否存在特定索引或属性，如果不存在则添加
                    // 注意：IndexedDB 的对象存储不支持"不存在则添加"的直接方法来添加索引
                    // 索引必须在对象存储创建时或在结构升级时定义
                    dataStore.put({key:'edit_origin_collect', value:null});
                }

                // 通过监听事务的完成来处理后续逻辑
                transaction.oncomplete = function() {
                    console.log("Database structure updated");
                    g_db = db;
                    resolve(); // 假设 resolve 是你之前已定义的 promise 解决方法
                };

                transaction.onerror = function(event) {
                    console.error("Transaction failed", event.target.error);
                    reject(event.target.error); // 假设 reject 是你之前已定义的 promise 拒绝方法
                };
            };
        });
    }

    function save_data(contains,key,value){

        

        var transaction = g_db.transaction(contains, 'readwrite');
        var dataStore = transaction.objectStore(contains);
        
        var record = {
            key: key,
            value: value
        };
        
        var putRequest = dataStore.put(record);
        
        putRequest.onsuccess = function(event) {
            console.log('数据已存储'+ key);
        };
        
        putRequest.onerror = function(event) {
            console.error('存储数据时发生错误'+ key);
        };
    }

    function get_data(contains,key,callback) {
        var transaction = g_db.transaction(contains, 'readonly');
        var dataStore = transaction.objectStore(contains);
        
        // 使用 get 方法根据键值查找数据
        var getRequest = dataStore.get(key);
        
        getRequest.onsuccess = function(event) {
            var record = event.target.result;
            if (record) {
                // 调用回调函数并传递读取到的数据
                callback(null,contains,record.key, record.value);
            } else {
                callback('can not find key',contains,key);
            }
        };
        
        getRequest.onerror = function(event) {
            console.error('find data error',contains,key);
        };
    }

    function get_data_param(contains,key,callback,data,data1) {
        var transaction = g_db.transaction(contains, 'readonly');
        var dataStore = transaction.objectStore(contains);
        
        // 使用 get 方法根据键值查找数据
        var getRequest = dataStore.get(key);
        
        getRequest.onsuccess = function(event) {
            var record = event.target.result;
            if (record) {
                // 调用回调函数并传递读取到的数据
                callback(null,contains,record.key, record.value,data,data1);
            } else {
                callback('can not find key',contains,key);
            }
        };
        
        getRequest.onerror = function(event) {
            console.error('find data error',contains,key);
        };
    }


    function get_all_data(contains,callback,inRelase = false) {


        if(g_db === undefined){
            alert("connect indexdb failed")
        }
        
          // 开启一个事务并获取对已存在的对象存储的引用
          var transaction = g_db.transaction(contains, 'readonly');
          var dataStore = transaction.objectStore(contains);
        
          // 使用 getAll 方法获取所有数据
          var getAllRequest = dataStore.getAll();
        
          getAllRequest.onsuccess = function(event) {
            var records = event.target.result;
            if (records && records.length > 0) {
              // 调用回调函数并传递读取到的数据数组
              callback(null,contains, records,inRelase);
            } else {
              callback('can not find key', contains);
            }
          };
        
          getAllRequest.onerror = function(event) {
            // 调用回调函数并传递错误信息
            callback('Error finding data in ' + contains + ': ' + event.target.error.message, contains);
          };
        
      }
      

})();


export const openUserDatabaseSync = exports.openUserDatabaseSync;
export const openUserDatabase = exports.openUserDatabase;
export const save_data = exports.save_data;
export const get_data = exports.get_data;
export const get_all_data = exports.get_all_data;
export const get_data_param = exports.get_data_param;

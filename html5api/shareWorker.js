onconnect = function (e) {
    let port = e.ports[0]
    console.log('shareworked onconnect');
    port.onmessage = function (e) {
        console.log('shareworked onconnect-data', e);
        if (e.data.length > 1) {
            port.postMessage(e.data[1] - e.data[0])
        }
    }
}

// worker 线程
onerror = function () {

}
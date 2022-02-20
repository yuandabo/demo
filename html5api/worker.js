console.log('worker1');


onmessage = function (e) {
    console.log('e', e);
    if (e.data.length > 1) {
        postMessage(e.data[1] - e.data[0])
    }
}

// worker 线程
onerror = function () {

}
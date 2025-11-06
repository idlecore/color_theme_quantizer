async function fetchFile(url) {
    return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
        req.addEventListener("load", function () {
            resolve(this.responseText);
    });
        req.addEventListener("error", function () {
            reject(new Error(`Failed to load shader: ${url}`));
        });
        req.open("GET", url);
    req.send();
    });
}

export { fetchFile };


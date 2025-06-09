const isArray = arr => Array.isArray(arr);
const isNumber = v => typeof v === "number";
const isObjectType = v => typeof v === "object";
const isObject = obj => obj && !obj.nodeType && isObjectType(obj) && !isArray(obj);
const toArray = o => [].slice.call(o);

/**
 * Merge objects
 * @param {object} target Target object
 * @param {object|Array} objectN Objects to be merge into
 * @returns {object}
 */
function mergeObj(target, ...objectN) {
	if (!objectN.length || (objectN.length === 1 && !objectN[0])) {
		return target;
	}

	const source = objectN.shift();

	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			const value = source[key];

			if (isObject(value)) {
				!target[key] && (target[key] = {});
				target[key] = mergeObj(target[key], value);
			} else {
				target[key] = isArray(value) ?
					value.concat() : value;
			}
		});
	}

	return mergeObj(target, ...objectN);
}

function tplProcess(tpl, data) {
    let res = tpl;

    for (const x in data) {
        res = res.replace(new RegExp(`{=${x}}`, "ig"), data[x]);

        if (Object.keys(data[x]).length) {
            Object.keys(data[x]).forEach(v => {
                res = res.replace(new RegExp(`{=${x}.${v}}`, "ig"), data[x][v]);
            });
        }
    }

    return res;
}

function inViewport(el) {
    if (!el || 1 !== el.nodeType ) {
		return false;
	}

    const {documentElement: html} = document;
    const r = el.getBoundingClientRect();

	const navbarHeight = [].slice.call(document.querySelectorAll(".navbar"))
		.map(el => el.getBoundingClientRect().height)
		.reduce((acc, curr) => acc + curr);

    return (!!r
      && r.bottom >= navbarHeight
      && r.right >= 0
      && r.top <= html.clientHeight - navbarHeight
      && r.left <= html.clientWidth
    );
}

export {inViewport, isArray, isNumber, isObjectType, isObject, mergeObj, toArray, tplProcess};

/**
 * State of FE/JS Survey
 * @author Jae Sung Park
 * @date 2025-05-29
 */
import {inViewport, isNumber, mergeObj, tplProcess} from "./util.mjs";
import prevList from "./list.mjs";

({
    config: {
        url: {
            menu: "./data/menu.json",
            data: "./data/data.json",
            authors: "./data/authors.json"
        },
        $el: {
            top: document.querySelectorAll(".top"),
            menu: document.querySelector(".sidebar-menu"),
            content: document.getElementById("content"),
            dropdown: document.querySelector(".dropdown-menu"),
            sidebar: document.querySelector(".sidebar"),
            authors: document.getElementById("authors"),
            contentWrapper: document.querySelector(".content-wrapper")
        },
        tpl: {
            menu: {
                title: `<h5 class="sidebar-title sidebar-link-with-icon font-weight-bolder"><span class="sidebar-icon"><i class="fa {=icon}" aria-hidden="true"></i></span> {=title}</h5><div class="sidebar-divider"></div>`,
                item: `<a href="#{=id}" class="sidebar-link">{=text}</a>`
            },
            content: `<div class="card border" id="{=id}">
                <button class="float-right btn btn-sm copy-button" type="button" data-toggle="tooltip" data-placement="left" data-title="결과를 공유해 보세요!">
                    <i class="fa fa-clipboard" aria-hidden="true"></i> 링크 복사
                </button>
                <h2 class="card-title"> <span class="badge font-size-16">{=index}</span> {=title}</h2>
                {=preference}
                <div class="chart-holder"></div>
                {=others}
                </div>`,
            authors: {
                container: `<div class="px-card p-5 py-10 border-top d-flex flex-row flex-wrap justify-content-center">
                        <small class="bold m-0 text-capitalize">{=title}</small>
                        {=items}
                    </div>`,
                item: `<div class="list-group-item d-flex flex-row align-items-center ml-10">
                    <img src="{=avatar}" width="45" height="45" class="img-fluid rounded-circle flex-shrink-0">
                    <div class="ml-5 mx-3" style="line-height:1">
                        <small class="d-block">{=name}</small>
                        <small class="text-body-secondary"><a href="{=link}" target="_new">{=id}</a></small>
                    </div>
                </div>`
            }
        },
        state: {
            lastMenu: null
        }
    },

    // Initializer
    async $init() {
        await this.setMenu();
        await this.setAuthors();
        const data = await this.setContentHolder();

        // generate chart
        this.generateChart(data);

        if (location.hash) {
            const {hash} = location;
            const target = this.config.$el.menu.querySelector(`a[href='${hash}']`);

            document.location = hash;

            this.clickHandler({target});
        }

        this.setDropdown();
        this.bindEvent();
        this.setObserver();
    },

    // Fetch data
    async fetch(url) {
        const data = await fetch(url)
            .then(d => d.json())
            .catch(e => console.error(e));

        return data;
    },

    setDropdown() {
        const html = prevList.reverse()
            .map(year => `<a href="../${year}/" class="dropdown-item" target="state-of-js">${year}</a>`)
            .join("");

        this.config.$el.dropdown.innerHTML = html;
    },

    // set sidebar menu
    async setMenu() {
        const {$el, url, tpl} = this.config;
        const menu = await this.fetch(url.menu);
        const html = [];

        Object.keys(menu)
            .forEach(title => {
                const {icon, list} = menu[title];
                let h = tplProcess(tpl.menu.title, {title, icon});

                list.forEach(item => {
                    const {id, text} = item;

                    h += tplProcess(tpl.menu.item, {id, text});
                });

                html.push(h);
            });

        $el.menu.innerHTML = html.join("<br />");
    },

    // set sidebar menu
    async setAuthors() {
        const {$el, url, tpl} = this.config;
        const authors = await this.fetch(url.authors);
        const html = [];

        Object.keys(authors).forEach(key => {
            const items = authors[key].map(author => {
                const {name, id, link, avatar} = author;

                return tplProcess(tpl.authors.item, {
                    name, id, link, avatar
                });
            }).join("");

            html.push(tplProcess(tpl.authors.container, {
                title: key,
                items
            }));
        });

        $el.authors.innerHTML = html.join("");
        
    },

    // set content area
    async setContentHolder() {
        const {$el, url, tpl} = this.config;
        const data = await this.fetch(url.data);

        // set holder
        const html = Object.keys(data).map((id, index) => {
            const title = document.querySelector(`a[href='#${id}']`).textContent;
            let {chart, preference = "", others = ""} = data[id];

            if (others) {
                others = chart ?
                    `<span class='badge badge-pill mb-10'>그 외 언급</span><ul class='ml-10'><li>${others.join("</li><li>")}</li></ul>` :
                    `<ul>${others.map(v => `<li>${v}</li>`).join("")}</ul>`;                     
            }

            if (preference) {
                preference = `<p><span class='badge badge-primary'>선호/순위</span> ${preference}</p>`;
            }

            return tplProcess(tpl.content, {
                index: ++index,
                id, title, preference, others
            });
        }).join("");

        $el.content.innerHTML = html;

        return data;
    },

    // get default chart options
    getChartDefaultOption() {
        return {
            boost: {
                useWorker: true
            },
            resize: {
                auto: "parent",
                timer: false
            },
            data: {
                x: "x",
                type: "bar",
                order: null,
                stack: {
                    normalize: true
                },
                groups: [[
                    "🤷 모름",
                    "🚫 알지만 관심 없음",
                    "☑️ 관심있다",
                    "👎 사용해 봤으나, 다시 사용 않음",
                    "👍 사용해 봤고, 계속 사용예정"
                ]]
            },
            color: {
                pattern: [
                    "rgb(148 145 145 / 50%)",
                    "#5883cc",
                    "#f3dc49",
                    "#ee1a60",
                    "#03d041",
                    "#2ac4b3",
                    "#feaf29",
                    "#ff617b",
                    "#73a2ef"
                ]
            },
            clipPath: false,
            bar: {
                width: {
                    ratio: 0.7
                },
                label: {
                    threshold: 0.05,
                }
            },
            pie: {
                innerRadius: 30,
                outerRadius: {},
                label: {
                    ratio: 1.15,
                    format: function(value, ratio, id) {
                        const temp = id.split(" ");
                        let name = id;

                        if (temp.length > 2) {
                            name = temp.map((v, i) => {
                                if (i && i%2 === 0) {
                                    return "\n" + v;
                                }
                            
                                return v;
                            }).join("");
                        }

                        return `${name}\n${(ratio*100).toFixed(2)}%`;
                    }
                }
            },
            padding: {
                mode: "fit"
            },
            axis: {
                x: {
                    type: "category",
                    tick: {
                        outer: false
                    },
                    height: 50
                },
                y: {
                    tick: {
                        outer: false,
                        count: 5,
                        rotate: 0
                    }
                }
            },
            tooltip: {
                order: "desc"
            },
            legend: {
                item: {
                    tile: {
                        type: "circle"
                    }
                }
            }
        };
    },

    // generate chart
    generateChart(d) {        
        Object.keys(d).forEach(v => {
            const options = mergeObj(this.getChartDefaultOption(), {
                bindto: `#${v} .chart-holder`,
                ...d[v].chart
            });

            const {data} = options;

            try {
                if (data.type === "bar" && data.groups.length) {
                    data.columns[0].unshift("x");

                    if (isNumber(data.columns[1][0])) {
                        data.groups[0]
                            .forEach(function(v, i) {
                                data.columns[i + 1].unshift(v);
                            });
                    }


                    if (window.innerWidth < 700) {
                        options.axis.x.tick.rotate = -40;
                        options.axis.x.tick.multiline = false;
                        options.axis.x.height = null;
                    }

                } else if (data.type === "pie") {
                    options.data.order = "desc";

                    if (window.innerWidth >= 550) {
                        options.legend = {
                            position: "right",
                            item: {
                                tile: {
                                    type: "circle"
                                }
                            }
                        };
                    }

                    options.data.columns.forEach(column => {
                        options.pie.outerRadius[column[0]] = 135;
                    });

                    const maxId = options.data.columns.reduce((a, c) => (c[1] > a[1]) ? c : a)[0];
                    const minId = options.data.columns.reduce((a, c) => (c[1] < a[1]) ? c : a)[0];

                    options.pie.outerRadius[maxId] = window.innerWidth >= 550 ? 150 : 140;
                    options.pie.outerRadius[minId] = 130;

                    options.color.pattern = null;
                } else if (data.type === "treemap") {
                    options.data.onmax = function(d) {
                        const {id} = d[0];
                        const target = this.$.text.texts.filter(d => d.id === id);

                       	target.style("font-size", "2em");
                        target.select("tspan:first-child").style("fill", "red");
                        target.select("tspan:last-child").style("stroke", "blue").style("fill", "blue");
                    };
                }

                bb.generate(options);
            } catch(e) {}
        });
    },

    // copy link to clipboard
    copyLink(elem) {
        if (navigator.clipboard) {            
            let {href} = location;
            
            href = href.substring(0, href.lastIndexOf("/"));

            navigator.clipboard.writeText(`${href}/#${elem.parentNode.id}`)
                .then(() => {
                    // Show confirmation
                    elem.innerHTML = "<i class='fa fa-check-circle' aria-hidden='true'></i> 복사됨!";
    
                    // Hide confirmation
                    setTimeout(() => {
                        elem.innerHTML = "<i class='fa fa-clipboard' aria-hidden='true'></i> 링크 복사";
                    }, 1000);
                }, e => {
                    console.error("An error occured:", e);
                });
        }
    },

    // sidebar menu click handler
    clickHandler(e) {
        const {state} = this.config;
        const {target} = e;

        if (target.tagName === "A" && state.lastMenu !== target) {
            state.lastMenu && state.lastMenu.classList.remove("active");
            target.classList.add("active");

            state.lastMenu = target;
            !inViewport(target) && target.scrollIntoView();
        }
    },

    // bind events
    bindEvent() {
        const {$el, state} = this.config;

        // goto top
        $el.top.forEach(el => el.addEventListener("click", e => {            
            state.lastMenu && state.lastMenu.classList.remove("active");

            $el.sidebar.scrollTop = 0;
            $el.contentWrapper.scrollTop = 0;

        }));

        // sidebar menu anchor
        $el.menu.addEventListener("click", this.clickHandler.bind(this));

        // copy button
        $el.content.addEventListener("click", e => {
            const {target} = e;

            if (target.classList.contains("copy-button")) {
                this.copyLink(target);
            }
        });
    },

    // set intersection observer to sync with sidebar menu active state
    setObserver() {
        const {$el} = this.config;

        // set side menu active during the scroll
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                requestIdleCallback(() => {
                    let {target} =  entry;
                    const {boundingClientRect: {top}, intersectionRatio} = entry;

                    if (intersectionRatio > 0.9 && top <= 100) {
                        target = $el.menu.querySelector(`a[href='#${target.id}']`);

                        this.clickHandler({target});
                    }
                });
            });
        }, {
            root: $el.contentWrapper,
            rootMargin: "0px 0px 50px 0px",
            threshold: 1.0
        });

        document.querySelectorAll("#content .card")
            .forEach(v => observer.observe(v));
    }
}).$init();

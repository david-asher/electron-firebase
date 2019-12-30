/**
 * JSONViewer - by Roman Makudera 2016 (c) MIT licence.
 */
JSONViewer = (function() {
	var JSONViewer = function() {
		this._dom = {};
		this._dom.container = document.createElement("pre");
		this._dom.container.classList.add("json-viewer");
	};

	/**
	 * Visualise JSON object.
	 * 
	 * @param {Object|Array} json Input value
	 * @param {Number} [maxLvl] Process only to max level, where 0..n, -1 unlimited
	 * @param {Number} [colAt] Collapse at level, where 0..n, -1 unlimited
	 */
	JSONViewer.prototype.showJSON = function(json, maxLvl, colAt) {
		maxLvl = typeof maxLvl === "number" ? maxLvl : -1; // max level
		colAt = typeof colAt === "number" ? colAt : -1; // collapse at

		var jsonData = this._processInput(json);
		var walkEl = this._walk(jsonData, maxLvl, colAt, 0);

		this._dom.container.innerHTML = "";
		this._dom.container.appendChild(walkEl);
	};

	/**
	 * Get container with pre object - this container is used for visualise JSON data.
	 * 
	 * @return {Element}
	 */
	JSONViewer.prototype.getContainer = function() {
		return this._dom.container;
	};

	/**
	 * Process input JSON - throws exception for unrecognized input.
	 * 
	 * @param {Object|Array} json Input value
	 * @return {Object|Array}
	 */
	JSONViewer.prototype._processInput = function(json) {
		if (json && typeof json === "object") {
			return json;
		}
		else {
			throw "Input value is not object or array!";
		}
	};

	/**
	 * Recursive walk for input value.
	 * 
	 * @param {Object|Array} value Input value
	 * @param {Number} maxLvl Process only to max level, where 0..n, -1 unlimited
	 * @param {Number} colAt Collapse at level, where 0..n, -1 unlimited
	 * @param {Number} lvl Current level
	 */
	JSONViewer.prototype._walk = function(value, maxLvl, colAt, lvl) {
		var frag = document.createDocumentFragment();
		var isMaxLvl = maxLvl >= 0 && lvl >= maxLvl;
		var isCollapse = colAt >= 0 && lvl >= colAt;

		switch (typeof value) {
			case "object":
				if (value) {
					var isArray = Array.isArray(value);
					var items = isArray ? value : Object.keys(value);

					if (lvl === 0) {
						// root level
						var rootCount = this._createItemsCount(items.length);
						// hide/show
						var rootLink = this._createLink(isArray ? "[" : "{");

						if (items.length) {
							rootLink.addEventListener("click", function() {
								if (isMaxLvl) return;

								rootLink.classList.toggle("collapsed");
								rootCount.classList.toggle("hide");

								// main list
								this._dom.container.querySelector("ul").classList.toggle("hide");
							}.bind(this));

							if (isCollapse) {
								rootLink.classList.add("collapsed");
								rootCount.classList.remove("hide");
							}
						}
						else {
							rootLink.classList.add("empty");
						}

						rootLink.appendChild(rootCount);
						frag.appendChild(rootLink);
					}

					if (items.length && !isMaxLvl) {
						var len = items.length - 1;
						var ulList = document.createElement("ul");
						ulList.setAttribute("data-level", lvl);
						ulList.classList.add("type-" + (isArray ? "array" : "object"));

						items.forEach(function(key, ind) {
							var item = isArray ? key : value[key];
							var li = document.createElement("li");

							if (typeof item === "object") {
								var isEmpty = false;

								// null && date
								if (!item || item instanceof Date) {
									li.appendChild(document.createTextNode(isArray ? "" : key + ": "));
									li.appendChild(this._createSimple(item ? item : null));
								}
								// array & object
								else {
									var itemIsArray = Array.isArray(item);
									var itemLen = itemIsArray ? item.length : Object.keys(item).length;

									// empty
									if (!itemLen) {
										li.appendChild(document.createTextNode(key + ": " + (itemIsArray ? "[]" : "{}")));
									}
									else {
										// 1+ items
										var itemTitle = (typeof key === "string" ? key + ": " : "") + (itemIsArray ? "[" : "{");
										var itemLink = this._createLink(itemTitle);
										var itemsCount = this._createItemsCount(itemLen);

										// maxLvl - only text, no link
										if (maxLvl >= 0 && lvl + 1 >= maxLvl) {
											li.appendChild(document.createTextNode(itemTitle));
										}
										else {
											itemLink.appendChild(itemsCount);
											li.appendChild(itemLink);
										}

										li.appendChild(this._walk(item, maxLvl, colAt, lvl + 1));
										li.appendChild(document.createTextNode(itemIsArray ? "]" : "}"));
										
										var list = li.querySelector("ul");
										var itemLinkCb = function() {
											itemLink.classList.toggle("collapsed");
											itemsCount.classList.toggle("hide");
											list.classList.toggle("hide");
										};

										// hide/show
										itemLink.addEventListener("click", itemLinkCb);

										// collapse lower level
										if (colAt >= 0 && lvl + 1 >= colAt) {
											itemLinkCb();
										}
									}
								}
							}
							// simple values
							else {
								// object keys with key:
								if (!isArray) {
									li.appendChild(document.createTextNode(key + ": "));
								}

								// recursive
								li.appendChild(this._walk(item, maxLvl, colAt, lvl + 1));
							}

							// add comma to the end
							if (ind < len) {
								li.appendChild(document.createTextNode(","));
							}

							ulList.appendChild(li);
						}, this);

						frag.appendChild(ulList);
					}
					else if (items.length && isMaxLvl) {
						var itemsCount = this._createItemsCount(items.length);
						itemsCount.classList.remove("hide");

						frag.appendChild(itemsCount);
					}

					if (lvl === 0) {
						// empty root
						if (!items.length) {
							var itemsCount = this._createItemsCount(0);
							itemsCount.classList.remove("hide");

							frag.appendChild(itemsCount);
						}

						// root cover
						frag.appendChild(document.createTextNode(isArray ? "]" : "}"));

						// collapse
						if (isCollapse) {
							frag.querySelector("ul").classList.add("hide");
						}
					}
					break;
				}

			default:
				// simple values
				frag.appendChild(this._createSimple(value));
				break;
		}

		return frag;
	};

	/**
	 * Create simple value (no object|array).
	 * 
	 * @param  {Number|String|null|undefined|Date} value Input value
	 * @return {Element}
	 */
	JSONViewer.prototype._createSimple = function(value) {
		var spanEl = document.createElement("span");
		var type = typeof value;
		var txt = value;

		if (type === "string") {
			txt = '"' + value + '"';
		}
		else if (value === null) {
			type = "null";
			txt = "null";
		}
		else if (value === undefined) {
			txt = "undefined";
		}
		else if (value instanceof Date) {
			type = "date";
			txt = value.toString();
		}

		spanEl.classList.add("type-" + type);
		spanEl.innerHTML = txt;

		return spanEl;
	};

	/**
	 * Create items count element.
	 * 
	 * @param  {Number} count Items count
	 * @return {Element}
	 */
	JSONViewer.prototype._createItemsCount = function(count) {
		var itemsCount = document.createElement("span");
		itemsCount.classList.add("items-ph");
		itemsCount.classList.add("hide");
		itemsCount.innerHTML = this._getItemsTitle(count);

		return itemsCount;
	};

	/**
	 * Create clickable link.
	 * 
	 * @param  {String} title Link title
	 * @return {Element}
	 */
	JSONViewer.prototype._createLink = function(title) {
		var linkEl = document.createElement("a");
		linkEl.classList.add("list-link");
		linkEl.href = "javascript:void(0)";
		linkEl.innerHTML = title || "";

		return linkEl;
	};

	/**
	 * Get correct item|s title for count.
	 * 
	 * @param  {Number} count Items count
	 * @return {String}
	 */
	JSONViewer.prototype._getItemsTitle = function(count) {
		var itemsTxt = count > 1 || count === 0 ? "items" : "item";

		return (count + " " + itemsTxt);
	};

	return JSONViewer;
})();
